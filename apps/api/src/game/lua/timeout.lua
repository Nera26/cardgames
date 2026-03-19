--[[
  timeout.lua - Two-Phase Timer Switchboard
  
  When the Game Pace timer expires, this script decides:
    Phase 1 → Phase 2: Grant full time bank balance as extension
    Phase 2 → Fold:    Time bank depleted, force fold + bench
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
  
  ARGV:
    [1] = seat number (whose turn it currently is)
  
  RETURNS:
    JSON object with action: 'extended' | 'folded'
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]
local actionSeat = tonumber(ARGV[1])

-- ============================================================
-- Helper Functions
-- ============================================================

local function countActivePlayers()
  local count = 0
  for i = 0, 9 do
    local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      if player.status == "active" then
        count = count + 1
      end
    end
  end
  return count
end

local function countPlayersInHand()
  local count = 0
  for i = 0, 9 do
    local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      if player.status == "active" or player.status == "all-in" then
        count = count + 1
      end
    end
  end
  return count
end

local function getNextActiveSeat(currentSeat)
  for offset = 1, 10 do
    local nextSeat = (currentSeat + offset) % 10
    local playerData = redis.call('HGET', playersKey, 'seat_' .. nextSeat)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      if player.status == "active" then
        return nextSeat
      end
    end
  end
  return -1
end

-- ============================================================
-- Logic
-- ============================================================

local currentTurn = tonumber(redis.call('HGET', tableKey, 'turnSeat') or -1)

-- 1. Validation: Is it actually this seat's turn?
if currentTurn ~= actionSeat then
  return cjson.encode({
    success = false,
    message = "Not this seat's turn"
  })
end

-- 2. Get Player Data
local playerData = redis.call('HGET', playersKey, 'seat_' .. actionSeat)
if not playerData or playerData == false then
  return cjson.encode({ success = false, message = "Player not found" })
end

local player = cjson.decode(playerData)
local timeBank = tonumber(player.time_bank or 0)
local isAlreadyUsingBank = (player.is_using_bank == true or player.is_using_bank == "true")

-- 3. THE SWITCHBOARD: Phase 1 → Phase 2 or Fold
if timeBank > 0 and not isAlreadyUsingBank then
    -- ═══════════════════════════════════════════
    -- EXTENSION: Grant full time bank as new timer
    -- ═══════════════════════════════════════════
    local now = tonumber(redis.call('TIME')[1])  -- Unix seconds
    
    player.is_using_bank = true
    player.time_bank_started_at = now
    -- Don't deduct yet — bet.lua pays the bill when player acts
    
    redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(player))
    
    -- Convert seconds to milliseconds for the processor
    local durationMs = timeBank * 1000
    
    return cjson.encode({
        success = true,
        action = 'extended',
        durationMs = durationMs,
        timeBankBalance = timeBank
    })
else
    -- ═══════════════════════════════════════════
    -- FOLD: Time bank depleted or already used → Fold AND Bench
    -- ═══════════════════════════════════════════
    player.status = "folded"
    player.cards = {}
    player.is_using_bank = nil
    player.time_bank_started_at = nil
    -- THE BENCH: Mark for sitting_out after this hand
    player.benchAfterHand = true
    player.sit_out_start = redis.call('TIME')[1]
    redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(player))
    
    -- Increment acted count (a fold on timeout is an action)
    redis.call('HINCRBY', tableKey, 'playersActedCount', 1)
    
    -- Determine if hand is complete or move turn
    local activeCount = countActivePlayers()
    local playersInHand = countPlayersInHand()
    local handComplete = false
    local winningSeat = -1
    local nextStreet = false
    local nextTurn = -1
    local pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0)

    if playersInHand == 1 then
        handComplete = true
        -- Award pot
        for i = 0, 9 do
            local pData = redis.call('HGET', playersKey, 'seat_' .. i)
            if pData and pData ~= false then
                local p = cjson.decode(pData)
                if p.status == "active" or p.status == "all-in" then
                    winningSeat = i
                    p.chips = p.chips + pot
                    redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(p))
                    break
                end
            end
        end
        redis.call('HSET', tableKey, 'pot', 0)
        redis.call('HSET', tableKey, 'phase', 'showdown')
        redis.call('HSET', tableKey, 'turnSeat', -1)
    else
        nextTurn = getNextActiveSeat(actionSeat)
        
        -- Check if betting round complete
        local currentBet = tonumber(redis.call('HGET', tableKey, 'currentBet') or 0)
        local allMatched = true
        for i = 0, 9 do
            local pData = redis.call('HGET', playersKey, 'seat_' .. i)
            if pData and pData ~= false then
                local p = cjson.decode(pData)
                if p.status == "active" and p.currentBet < currentBet then
                    allMatched = false
                    break
                end
            end
        end
        
        local playersActedCount = tonumber(redis.call('HGET', tableKey, 'playersActedCount') or 0)
        if allMatched and playersActedCount >= activeCount then
            nextStreet = true
            nextTurn = -1
        end
        
        redis.call('HSET', tableKey, 'turnSeat', nextTurn)
    end
    
    -- Log event
    redis.call('XADD', 'stream:table:' .. (redis.call('HGET', tableKey, 'id') or "unknown"), '*',
      'event', 'action',
      'seat', actionSeat,
      'action', 'fold',
      'reason', 'timeout',
      'timestamp', redis.call('TIME')[1]
    )

    return cjson.encode({
        success = true,
        action = 'folded',
        benched = true,
        playerId = player.id,
        nextStreet = nextStreet,
        handComplete = handComplete,
        winningSeat = winningSeat,
        nextTurn = nextTurn
    })
end
