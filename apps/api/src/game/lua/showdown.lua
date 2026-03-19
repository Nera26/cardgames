--[[
  showdown.lua - The Atomic Judge (Production Grade)
  
  Atomically distributes pot to winners using Iterative Pot Splitting.
  Calculates and deducts platform rake.
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
  
  ARGV:
    [1] = scoresJson: [{seat: 0, score: 9000}, ...]
    [2] = rakePercent: (e.g., 0.05)
    [3] = rakeCap: (e.g., 500 units)
  
  RETURNS:
    JSON summary of distribution and rake
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]

local scoresJson = ARGV[1]
local rakePercent = tonumber(ARGV[2] or 0)
local rakeCap = tonumber(ARGV[3] or 0)
local scores = cjson.decode(scoresJson)

local MAX_SEATS = 10

-- ============================================================
-- 1. Snapshot State
-- ============================================================

local players = {}
local uniqueLevels = {}
local levelMap = {}

for i = 0, MAX_SEATS - 1 do
    local pData = redis.call('HGET', playersKey, 'seat_' .. i)
    if pData then
        local p = cjson.decode(pData)
        players[i] = p
        local contrib = tonumber(p.totalContribution or 0)
        if contrib > 0 then
            if not levelMap[contrib] then
                table.insert(uniqueLevels, contrib)
                levelMap[contrib] = true
            end
        end
    end
end

table.sort(uniqueLevels)

-- ============================================================
-- 2. Rake Calculation
-- ============================================================

local grossPot = tonumber(redis.call('HGET', tableKey, 'pot') or 0)
local totalRake = math.min(math.floor(grossPot * rakePercent), rakeCap)
redis.call('INCRBYFLOAT', 'house:rake', totalRake)
-- Per-table cumulative stats for Admin Dashboard (Yellow Cable reads these)
redis.call('HINCRBYFLOAT', tableKey, 'totalRake', totalRake)
redis.call('HINCRBYFLOAT', tableKey, 'totalPotHistory', grossPot)

local netPot = grossPot - totalRake
local scalingFactor = 0
if grossPot > 0 then
    scalingFactor = netPot / grossPot
end

-- ============================================================
-- 3. Iterative Pot Splitting
-- ============================================================

local winnerInfo = {}
local lastLevel = 0

for _, level in ipairs(uniqueLevels) do
    local sliceGrossPot = 0
    local eligibleSeats = {}
    
    -- Calculate slice size and eligibility
    for seat, p in pairs(players) do
        local contrib = tonumber(p.totalContribution or 0)
        local contributionInSlice = math.max(0, math.min(contrib, level) - lastLevel)
        sliceGrossPot = sliceGrossPot + contributionInSlice
        
        if (p.status == 'active' or p.status == 'all-in') and contrib >= level then
            table.insert(eligibleSeats, seat)
        end
    end
    
    if sliceGrossPot > 0 and #eligibleSeats > 0 then
        -- Find highest score among eligible
        local bestScore = -1
        for _, seat in ipairs(eligibleSeats) do
            for _, sObj in ipairs(scores) do
                if sObj.seat == seat then
                    if sObj.score > bestScore then
                        bestScore = sObj.score
                    end
                end
            end
        end
        
        -- Identify all winners for this slice
        local winnersInSlice = {}
        for _, seat in ipairs(eligibleSeats) do
            for _, sObj in ipairs(scores) do
                if sObj.seat == seat and sObj.score == bestScore then
                    table.insert(winnersInSlice, seat)
                end
            end
        end
        
        -- Distribute slice net of rake contribution
        local sliceNetPot = math.floor(sliceGrossPot * scalingFactor)
        local perWinner = math.floor(sliceNetPot / #winnersInSlice)
        local remainder = sliceNetPot % #winnersInSlice
        
        for idx, seat in ipairs(winnersInSlice) do
            local amount = perWinner + (idx == 1 and remainder or 0)
            -- Display amount: gross (pre-rake) share so UI shows full pot win
            local grossPerWinner = math.floor(sliceGrossPot / #winnersInSlice)
            local grossRemainder = sliceGrossPot % #winnersInSlice
            local displayAmount = grossPerWinner + (idx == 1 and grossRemainder or 0)
            players[seat].chips = (players[seat].chips or 0) + amount
            
            -- Look up handDescription from scores for this seat
            local desc = nil
            for _, sObj in ipairs(scores) do
                if sObj.seat == seat then
                    desc = sObj.handDescription
                    break
                end
            end

            table.insert(winnerInfo, {
                seat = seat,
                amount = amount,
                displayAmount = displayAmount,
                type = (#eligibleSeats == 1) and "return" or "win",
                username = players[seat].username,
                handDescription = desc
            })
        end
    end
    lastLevel = level
end

-- ============================================================
-- 4. Atomic Reset & Cleanup
-- ============================================================

-- Snapshot communityCards BEFORE reset (line 140 wipes them to '[]')
local savedCommunityCards = redis.call('HGET', tableKey, 'communityCards') or "[]"

redis.call('HSET', tableKey, 'pot', 0)
redis.call('HSET', tableKey, 'phase', 'waiting')
redis.call('HSET', tableKey, 'communityCards', '[]')
redis.call('DEL', tableKey .. ':deck')

-- Snapshot archival data BEFORE reset (cards + totalContribution are wiped during cleanup)
local savedCards = {}
local savedContrib = {}
for i = 0, MAX_SEATS - 1 do
    if players[i] then
        if players[i].cards then
            savedCards[i] = players[i].cards
        end
        savedContrib[i] = tonumber(players[i].totalContribution or 0)
    end
end

local finalPlayers = {}
for i = 0, MAX_SEATS - 1 do
    if players[i] then
        local p = players[i]
        p.totalContribution = 0
        p.currentBet = 0
        p.cards = {}
        
        -- REPLENISHMENT: +10s break bank for actively playing a hand (capped at 600s / 10min)
        local MAX_SIT_OUT_BANK = 600
        local REPLENISH_PER_HAND = 10
        local contributed = tonumber(savedContrib[i] or 0)
        if contributed > 0 and p.status ~= 'sitting_out' then
            local currentBank = tonumber(p.sitOutBank or MAX_SIT_OUT_BANK)
            p.sitOutBank = math.min(MAX_SIT_OUT_BANK, currentBank + REPLENISH_PER_HAND)
        end

        if p.status == 'sitting_out' then
            -- SACRED: Preserve sitting_out — player is on break
            -- Do NOT reset to 'waiting', they must click "I'm Back" to rejoin
        elseif p.chips and p.chips > 0 then
            p.status = 'waiting'
        else
            p.status = 'busted'
        end
        
        redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(p))

        -- Restore archival data for the stream payload (not saved to Redis)
        p.cards = savedCards[i] or {}
        p.totalContribution = savedContrib[i] or 0
        -- Attach handDescription from scores for ALL participants
        for _, sObj in ipairs(scores) do
            if sObj.seat == i then
                p.handDescription = sObj.handDescription
                break
            end
        end
        table.insert(finalPlayers, p)
    end
end

-- ════════════════════════════════════════════════════════
-- 4b. AUTO-MUCK: Scrub losing cards from broadcast payload
-- Players with autoMuck=true who did NOT win have their
-- hole cards removed so the table never sees them.
-- ════════════════════════════════════════════════════════

-- Build winner seat lookup
local winnerSeats = {}
for _, w in ipairs(winnerInfo) do
    winnerSeats[w.seat] = true
end

-- Scrub non-winner autoMuck players
for _, fp in ipairs(finalPlayers) do
    local seat = tonumber(fp.seatNumber or fp.seat or -1)
    if seat >= 0 and not winnerSeats[seat] then
        if fp.autoMuck == true then
            fp.cards = {}
        end
    end
end

-- ============================================================
-- 5. Event & Response
-- ============================================================

local tableId = redis.call('HGET', tableKey, 'id') or "unknown"

-- Read accumulated action log from Redis
local actionLogKey = 'table:' .. tableId .. ':action_log'
local actionLogRaw = redis.call('LRANGE', actionLogKey, 0, -1)
local actionLog = {}
for _, entry in ipairs(actionLogRaw) do
  table.insert(actionLog, cjson.decode(entry))
end

redis.call('XADD', 'stream:table:' .. tableId, '*',
    'event', 'hand_ended',
    'winners', cjson.encode(winnerInfo),
    'pot', grossPot,
    'rake', totalRake,
    'communityCards', savedCommunityCards,
    'participants', cjson.encode(finalPlayers),
    'actionLog', cjson.encode(actionLog),
    'timestamp', redis.call('TIME')[1]
)

-- Clean up action log for next hand
redis.call('DEL', actionLogKey)

return cjson.encode({
    success = true,
    totalRake = totalRake,
    winners = winnerInfo,
    tableState = {
        table = {
            id = tableId,
            phase = "waiting",
            pot = 0
        },
        players = finalPlayers
    }
})
