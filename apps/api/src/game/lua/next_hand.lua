--[[
  next_hand.lua - Start New Hand Script
  
  Rotates dealer, posts blinds, deals cards, and starts the hand.
  Called when 2+ players are active and ready.
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
    [3] = table:{id}:deck      (deck list)
  
  ARGV:
    [1] = shuffled deck JSON array (from Node.js cryptoShuffle)
  
  RETURNS:
    JSON object with full table state
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]
local deckKey = KEYS[3]

local shuffledDeck = cjson.decode(ARGV[1])

-- ============================================================
-- Helper: Find next active seat
-- ============================================================

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
  return currentSeat
end

-- ============================================================
-- GHOST PROTOCOL: Sanitization Pass (Rule A)
-- Run before dealing to handle busted players
-- ============================================================

-- Get table ID for event stream
local tableId = redis.call('HGET', tableKey, 'id') or "unknown"

-- PHASE 0: Apply Pending Top-Ups queued during the previous hand
for i = 0, 9 do
  local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
  if playerData and playerData ~= false then
    local player = cjson.decode(playerData)
    local pending = tonumber(player.pendingTopUp or 0)
    if pending > 0 then
      player.chips = (tonumber(player.chips) or 0) + pending
      player.pendingTopUp = nil
      redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
    end
  end
end

-- PHASE 0.5: Clear stale action log (safety reset)
local tableId = redis.call('HGET', tableKey, 'id') or "unknown"
redis.call('DEL', 'table:' .. tableId .. ':action_log')

-- PHASE 1: Bust Detection - Any active player with 0 chips becomes a Ghost
local bustEvents = {}
for i = 0, 9 do
  local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
  if playerData and playerData ~= false then
    local player = cjson.decode(playerData)
    
    -- Detect bust: active with 0 chips
    if player.status == "active" and (not player.chips or player.chips <= 0) then
      player.status = "sitting_out"
      player.currentBet = 0
      player.totalContribution = 0
      player.cards = {}
      player.sit_out_start = redis.call('TIME')[1]
      redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
      
      -- Queue bust event for frontend notification
      table.insert(bustEvents, { seat = i, userId = player.id or player.odusId })
    end
  end
end

-- Emit bust events to stream
for _, evt in ipairs(bustEvents) do
  redis.call('XADD', 'stream:table:' .. tableId, '*',
    'event', 'player_bust',
    'seat', evt.seat,
    'userId', evt.userId
  )
end

-- PHASE 2: Promotion - Reset eligible players for new hand
-- 'waiting' players (rebuyers) become 'active'
-- 'active'/'folded'/'all-in' players with chips stay 'active' with reset state
-- UNLESS sitOutNextHand is true, benchAfterHand is true, or connection is offline
for i = 0, 9 do
  local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
  if playerData and playerData ~= false then
    local player = cjson.decode(playerData)
    
    local isIngame = (player.status == "active" or player.status == "folded" or player.status == "all-in")
    
    -- ══ DIAGNOSTIC LOG ══
    redis.call('XADD', 'stream:table:' .. tableId, '*',
      'event', 'PHASE2_SWEEP',
      'seat', tostring(i),
      'username', tostring(player.username or 'unknown'),
      'status_before', tostring(player.status),
      'chips', tostring(player.chips or 0),
      'sitOutNextHand', tostring(player.sitOutNextHand or 'nil'),
      'benchAfterHand', tostring(player.benchAfterHand or 'nil')
    )

    -- ══ SITTING_OUT GUARD ══
    -- Players on break are SACRED — never promote them back to active.
    -- They must explicitly click "I'm Back" to rejoin.
    if player.status == "sitting_out" then
      -- Reset hand-specific state but DO NOT change status
      player.currentBet = 0
      player.totalContribution = 0
      player.cards = {}
      redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
    -- BENCH TRANSITION: Timeout-folded players go to sitting_out
    elseif player.benchAfterHand then
      player.status = "sitting_out"
      player.benchAfterHand = nil
      player.currentBet = 0
      player.totalContribution = 0
      player.cards = {}
      -- sit_out_start already set by timeout.lua
      redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
    -- OFFLINE FREEZE: Disconnected players stay frozen (no promotion)
    elseif player.connection == "offline" then
      -- Don't promote — keep current status but clear hand state
      if isIngame then
        player.currentBet = 0
        player.totalContribution = 0
        player.cards = {}
        -- Don't change status — they might be active/folded from last hand
        -- But we skip them below so they won't be in the new hand
        redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
      end
    -- Check for Sit-Out Transition
    elseif player.sitOutNextHand then
      player.status = "sitting_out"
      player.sitOutNextHand = false
      player.currentBet = 0
      player.totalContribution = 0
      player.cards = {}
      player.sit_out_start = redis.call('TIME')[1]
      redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
    elseif player.status == "waiting" or (isIngame and player.chips and player.chips > 0) then
      -- Promote/Reset to active
      player.status = "active"
      player.currentBet = 0
      player.totalContribution = 0
      player.cards = {}
      
      -- TIME BANK ECONOMICS: +2s Capped Drip (read cap from config)
      local configKey = tableKey .. ':config'
      local MAX_BANK = tonumber(redis.call('HGET', configKey, 'timeBank') or 60)
      local ACCRUAL = 2
      player.time_bank = math.min((player.time_bank or MAX_BANK) + ACCRUAL, MAX_BANK)
      
      redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
    end
  end
end

-- ============================================================
-- Get Current State
-- ============================================================

local currentDealer = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0)
local smallBlind = tonumber(redis.call('HGET', tableKey, 'smallBlind') or 10)
local bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20)

-- Collect active players
local activePlayers = {}
for i = 0, 9 do
  local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
  if playerData and playerData ~= false then
    local player = cjson.decode(playerData)
    if player.status == "active" then
      table.insert(activePlayers, { seat = i, data = player })
    end
  end
end

if #activePlayers < 2 then
  -- Still collect current player state for broadcast (including sitting_out players)
  local allPlayers = {}
  for i = 0, 9 do
    local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      player.seatNumber = i
      table.insert(allPlayers, player)
    end
  end
  
  -- Set phase to waiting
  redis.call('HSET', tableKey, 'phase', 'waiting')
  
  return cjson.encode({
    success = false,
    message = "Not enough players to start hand",
    waitingForPlayers = true,
    tableState = {
      table = {
        id = redis.call('HGET', tableKey, 'id') or "",
        name = redis.call('HGET', tableKey, 'name') or "Table",
        phase = "waiting",
        pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0),
        currentBet = 0,
        turnSeat = -1,
        dealerSeat = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0),
        smallBlindSeat = -1,
        bigBlindSeat = -1,
        smallBlind = tonumber(redis.call('HGET', tableKey, 'smallBlind') or 10),
        bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20),
        lastRaiseSize = tonumber(redis.call('HGET', tableKey, 'lastRaiseSize') or 0),
        communityCards = {}
      },
      players = allPlayers
    }
  })
end

-- ============================================================
-- Rotate Dealer
-- ============================================================

local newDealer = getNextActiveSeat(currentDealer)
redis.call('HSET', tableKey, 'dealerSeat', newDealer)

-- ============================================================
-- Determine Blind Positions
-- ============================================================

local sbSeat = getNextActiveSeat(newDealer)
local bbSeat = getNextActiveSeat(sbSeat)

-- For heads-up (2 players), dealer is SB
if #activePlayers == 2 then
  sbSeat = newDealer
  bbSeat = getNextActiveSeat(newDealer)
end

-- ============================================================
-- LNBB INTERCEPTOR: If BB player has leaveNextBB, mark them for
-- removal and advance BB pointer to the next eligible player.
-- The actual leave (chip refund) is handled by the gateway via
-- forceStandUp() using lnbbKickedSeat/lnbbKickedUserId.
-- ============================================================
local lnbbKickedSeat = nil
local lnbbKickedUserId = nil

local bbData = redis.call('HGET', playersKey, 'seat_' .. bbSeat)
if bbData and bbData ~= false then
  local bbPlayer = cjson.decode(bbData)
  if bbPlayer.leaveNextBB then
    -- Mark for full removal by gateway (forceStandUp refunds chips to wallet)
    lnbbKickedSeat = bbSeat
    lnbbKickedUserId = bbPlayer.id or bbPlayer.odusId
    bbPlayer.status = "leaving"
    bbPlayer.leaveNextBB = false
    bbPlayer.currentBet = 0
    bbPlayer.totalContribution = 0
    bbPlayer.cards = {}
    redis.call('HSET', playersKey, 'seat_' .. bbSeat, cjson.encode(bbPlayer))

    -- Log the LNBB event
    redis.call('XADD', 'stream:table:' .. tableId, '*',
      'event', 'LNBB_TRIGGERED',
      'seat', bbSeat,
      'timestamp', tostring(redis.call('TIME')[1])
    )

    -- Re-collect active players after removal
    activePlayers = {}
    for i = 0, 9 do
      local pd = redis.call('HGET', playersKey, 'seat_' .. i)
      if pd and pd ~= false then
        local pl = cjson.decode(pd)
        if pl.status == "active" then
          table.insert(activePlayers, { seat = i, data = pl })
        end
      end
    end

    -- Safety abort: not enough players after LNBB removal
    if #activePlayers < 2 then
      local allPlayers = {}
      for i = 0, 9 do
        local pd = redis.call('HGET', playersKey, 'seat_' .. i)
        if pd and pd ~= false then
          local pl = cjson.decode(pd)
          pl.seatNumber = i
          table.insert(allPlayers, pl)
        end
      end
      redis.call('HSET', tableKey, 'phase', 'waiting')
      return cjson.encode({
        success = false,
        message = "Not enough players after LNBB removal",
        waitingForPlayers = true,
        lnbbKickedSeat = lnbbKickedSeat,
        lnbbKickedUserId = lnbbKickedUserId,
        tableState = {
          table = {
            id = redis.call('HGET', tableKey, 'id') or "",
            name = redis.call('HGET', tableKey, 'name') or "Table",
            phase = "waiting",
            pot = 0,
            currentBet = 0,
            turnSeat = -1,
            dealerSeat = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0),
            smallBlindSeat = -1,
            bigBlindSeat = -1,
            smallBlind = smallBlind,
            bigBlind = bigBlind,
            lastRaiseSize = 0,
            communityCards = {}
          },
          players = allPlayers
        }
      })
    end

    -- Advance BB to next active player (single forward step)
    bbSeat = getNextActiveSeat(bbSeat)

    -- Heads-up edge case: if only 2 remain, re-check SB/BB
    if #activePlayers == 2 then
      sbSeat = newDealer
      -- If dealer is no longer active, use getNextActiveSeat
      local dealerActive = false
      for _, ap in ipairs(activePlayers) do
        if ap.seat == newDealer then dealerActive = true end
      end
      if not dealerActive then
        sbSeat = activePlayers[1].seat
      end
      bbSeat = getNextActiveSeat(sbSeat)
    end
  end
end

redis.call('HSET', tableKey, 'smallBlindSeat', sbSeat)
redis.call('HSET', tableKey, 'bigBlindSeat', bbSeat)

-- ============================================================
-- Post Blinds
-- ============================================================

local pot = 0

-- Post Small Blind
local sbData = redis.call('HGET', playersKey, 'seat_' .. sbSeat)
if sbData then
  local sbPlayer = cjson.decode(sbData)
  local sbAmount = math.min(sbPlayer.chips, smallBlind)
  sbPlayer.chips = sbPlayer.chips - sbAmount
  sbPlayer.currentBet = sbAmount
  sbPlayer.totalContribution = sbAmount  -- Track blind in totalContribution
  sbPlayer.status = "active"
  pot = pot + sbAmount
  redis.call('HSET', playersKey, 'seat_' .. sbSeat, cjson.encode(sbPlayer))
end

-- Post Big Blind
bbData = redis.call('HGET', playersKey, 'seat_' .. bbSeat)
if bbData then
  local bbPlayer = cjson.decode(bbData)
  local bbAmount = math.min(bbPlayer.chips, bigBlind)
  bbPlayer.chips = bbPlayer.chips - bbAmount
  bbPlayer.currentBet = bbAmount
  bbPlayer.totalContribution = bbAmount  -- Track blind in totalContribution
  bbPlayer.status = "active"
  pot = pot + bbAmount
  redis.call('HSET', playersKey, 'seat_' .. bbSeat, cjson.encode(bbPlayer))
end

redis.call('HSET', tableKey, 'pot', pot)
redis.call('HSET', tableKey, 'currentBet', bigBlind)
redis.call('HSET', tableKey, 'lastRaiseSize', bigBlind)

-- ============================================================
-- Deal Cards (Dynamic: 2 for Texas, 4/5/6 for Omaha variants)
-- ============================================================

-- Read config for variant-aware dealing
local configKey = tableKey .. ':config'
local cardsToDeal = tonumber(redis.call('HGET', configKey, 'holeCardsCount') or 2)

local deckIndex = 1

for i = 0, 9 do
  local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
  if playerData and playerData ~= false then
    local player = cjson.decode(playerData)
    if player.status == "active" then
      -- Dynamic card dealing: 2 for Texas, 4/5/6 for Omaha
      player.cards = {}
      for c = 1, cardsToDeal do
        table.insert(player.cards, shuffledDeck[deckIndex + c - 1])
      end
      deckIndex = deckIndex + cardsToDeal
      redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
    end
  end
end

-- Store remaining deck
redis.call('DEL', deckKey)
for i = deckIndex, #shuffledDeck do
  redis.call('RPUSH', deckKey, shuffledDeck[i])
end

-- ============================================================
-- Set Game State
-- ============================================================

-- First to act is after BB
local turnSeat = getNextActiveSeat(bbSeat)
redis.call('HSET', tableKey, 'phase', 'preflop')
redis.call('HSET', tableKey, 'turnSeat', turnSeat)
redis.call('HSET', tableKey, 'communityCards', '[]')
redis.call('HSET', tableKey, 'playersActedCount', 0)  -- Reset participation counter

-- ============================================================
-- Build Response
-- ============================================================

local tableState = {
  id = redis.call('HGET', tableKey, 'id') or "",
  name = redis.call('HGET', tableKey, 'name') or "Table",
  phase = "preflop",
  pot = pot,
  currentBet = bigBlind,
  turnSeat = turnSeat,
  dealerSeat = newDealer,
  smallBlindSeat = sbSeat,
  bigBlindSeat = bbSeat,
  communityCards = {},
  smallBlind = smallBlind,
  bigBlind = bigBlind,
  lastRaiseSize = bigBlind
}

-- Rebuild players for response
local players = {}
for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    table.insert(players, cjson.decode(pData))
  end
end

-- Admin Dashboard Counters (Yellow Cable reads these)
redis.call('HINCRBY', tableKey, 'handNumber', 1)
if redis.call('HEXISTS', tableKey, 'firstHandAt') == 0 then
  redis.call('HSET', tableKey, 'firstHandAt', redis.call('TIME')[1])
end

-- Log event
redis.call('XADD', 'stream:table:' .. (tableState.id or "unknown"), '*',
  'event', 'hand_started',
  'dealer', newDealer,
  'sb', sbSeat,
  'bb', bbSeat,
  'pot', pot,
  'timestamp', redis.call('TIME')[1]
)

return cjson.encode({
  success = true,
  message = "Hand started",
  lnbbKickedSeat = lnbbKickedSeat,
  lnbbKickedUserId = lnbbKickedUserId,
  tableState = {
    table = tableState,
    players = players
  }
})
