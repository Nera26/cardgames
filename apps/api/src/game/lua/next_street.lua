--[[
  next_street.lua - Advance to Next Betting Round
  
  Reveals community cards and resets betting state.
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
    [3] = table:{id}:deck      (deck list)
  
  ARGV: (none)
  
  RETURNS:
    JSON object with updated table state
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]
local deckKey = KEYS[3]

local phase = redis.call('HGET', tableKey, 'phase') or "waiting"
local dealerSeat = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0)

-- ============================================================
-- Helper: Find next active seat (who can actually act)
-- ============================================================

local function getNextActiveSeat(currentSeat)
  for offset = 1, 10 do
    local nextSeat = (currentSeat + offset) % 10
    local playerData = redis.call('HGET', playersKey, 'seat_' .. nextSeat)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      -- Only 'active' players can act - all-in players cannot
      if player.status == "active" then
        return nextSeat
      end
    end
  end
  return -1
end

-- Count players by status
local function countPlayersByStatus()
  local activeCount = 0
  local allInCount = 0
  for i = 0, 9 do
    local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      if player.status == "active" then
        activeCount = activeCount + 1
      elseif player.status == "all-in" then
        allInCount = allInCount + 1
      end
    end
  end
  return activeCount, allInCount
end

-- ============================================================
-- Determine Next Phase & Cards to Reveal
-- ============================================================

local nextPhase = phase
local cardsToReveal = 0

if phase == "preflop" then
  nextPhase = "flop"
  cardsToReveal = 3
elseif phase == "flop" then
  nextPhase = "turn"
  cardsToReveal = 1
elseif phase == "turn" then
  nextPhase = "river"
  cardsToReveal = 1
elseif phase == "river" then
  nextPhase = "showdown"
  cardsToReveal = 0
else
  return cjson.encode({
    success = false,
    message = "Cannot advance from phase: " .. phase
  })
end

-- ============================================================
-- Reveal Community Cards
-- ============================================================

local communityCards = cjson.decode(redis.call('HGET', tableKey, 'communityCards') or "[]")

for i = 1, cardsToReveal do
  local card = redis.call('LPOP', deckKey)
  if card then
    table.insert(communityCards, card)
  end
end

redis.call('HSET', tableKey, 'communityCards', cjson.encode(communityCards))

-- ============================================================
-- Reset Betting State
-- ============================================================

-- Reset all player bets
for i = 0, 9 do
  local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
  if playerData and playerData ~= false then
    local player = cjson.decode(playerData)
    player.currentBet = 0
    redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
  end
end

redis.call('HSET', tableKey, 'currentBet', 0)
redis.call('HSET', tableKey, 'lastRaiseSize', tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20))
redis.call('HSET', tableKey, 'playersActedCount', 0)  -- Reset participation counter
redis.call('HSET', tableKey, 'phase', nextPhase)

-- Set turn to first active player after dealer (or SB for post-flop)
local firstToAct = getNextActiveSeat(dealerSeat)
redis.call('HSET', tableKey, 'turnSeat', firstToAct)

-- ============================================================
-- Build Response
-- ============================================================

local tableState = {
  id = redis.call('HGET', tableKey, 'id') or "",
  name = redis.call('HGET', tableKey, 'name') or "Table",
  phase = nextPhase,
  pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0),
  currentBet = 0,
  turnSeat = firstToAct,
  dealerSeat = dealerSeat,
  smallBlindSeat = tonumber(redis.call('HGET', tableKey, 'smallBlindSeat') or 0),
  bigBlindSeat = tonumber(redis.call('HGET', tableKey, 'bigBlindSeat') or 0),
  communityCards = communityCards,
  smallBlind = tonumber(redis.call('HGET', tableKey, 'smallBlind') or 10),
  bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20),
  lastRaiseSize = tonumber(redis.call('HGET', tableKey, 'lastRaiseSize') or 0)
}

local players = {}
for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    table.insert(players, cjson.decode(pData))
  end
end

-- Log event
redis.call('XADD', 'stream:table:' .. (tableState.id or "unknown"), '*',
  'event', 'street_advanced',
  'phase', nextPhase,
  'cards', cjson.encode(communityCards),
  'timestamp', redis.call('TIME')[1]
)

-- Check if we should auto-advance (skip betting rounds)
-- This is true when:
-- 1. No active players (all are all-in) OR
-- 2. Only 1 active player and 1+ all-in players (can't bet against anyone who can respond)
local activeCount, allInCount = countPlayersByStatus()
local shouldAutoAdvance = (nextPhase ~= "showdown") and 
                          (activeCount == 0 or (activeCount == 1 and allInCount >= 1))

return cjson.encode({
  success = true,
  message = "Advanced to " .. nextPhase,
  phase = nextPhase,
  isShowdown = nextPhase == "showdown",
  allPlayersAllIn = shouldAutoAdvance,
  tableState = {
    table = tableState,
    players = players
  }
})
