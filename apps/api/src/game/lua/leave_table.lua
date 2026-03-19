--[[
  leave_table.lua - Handle Player Leaving Table
  
  Removes player from table and refunds chips to balance.
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
    [3] = user:{id}:balance    (user chip balance)
  
  ARGV:
    [1] = seat number
    [2] = user ID (for validation)
  
  RETURNS:
    JSON object with updated state
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]
local balanceKey = KEYS[3]

local seat = tonumber(ARGV[1])
local userId = ARGV[2]

-- ============================================================
-- Validation
-- ============================================================

local playerData = redis.call('HGET', playersKey, 'seat_' .. seat)
if not playerData or playerData == false then
  return cjson.encode({
    success = false,
    message = "No player at this seat"
  })
end

local player = cjson.decode(playerData)

if player.id ~= userId then
  return cjson.encode({
    success = false,
    message = "You are not seated here"
  })
end

local isDisconnect = ARGV[3] == "true"

-- ============================================================
-- Lifeline Logic: Disconnect vs Leave
-- ============================================================

if isDisconnect then
  -- Zombie State: Player is still in the game but away
  player.status = "disconnected"
  redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(player))
  
  -- Log disconnect event
  redis.call('XADD', 'stream:table:' .. (redis.call('HGET', tableKey, 'id') or "unknown"), '*',
    'event', 'player_disconnected',
    'userId', userId,
    'seat', seat,
    'timestamp', redis.call('TIME')[1]
  )
  
  -- Return early, DO NOT remove or refund
  return cjson.encode({
    success = true,
    message = "Player marked as disconnected",
    isDisconnected = true,
    tableState = {
      table = {
        id = redis.call('HGET', tableKey, 'id') or "",
        phase = redis.call('HGET', tableKey, 'phase') or "waiting"
      },
      players = { player } -- Partial state for acknowledgement
    }
  })
end

-- ============================================================
-- Standard Leave Logic (Manual Quit)
-- ============================================================

-- Check if player is in active hand
local phase = redis.call('HGET', tableKey, 'phase') or "waiting"
if phase ~= "waiting" and phase ~= "showdown" and (player.status == "active" or player.status == "disconnected") then
  -- Player is in active hand - fold them first
  player.status = "folded"
  player.cards = {}
end

-- Refund Chips & Remove Player
local chipsToRefund = player.chips
redis.call('INCRBYFLOAT', balanceKey, chipsToRefund)
redis.call('HDEL', playersKey, 'seat_' .. seat)

-- ============================================================
-- Check Remaining Players
-- ============================================================

local remainingPlayers = 0
local remainingActive = 0
for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    remainingPlayers = remainingPlayers + 1
    local p = cjson.decode(pData)
    if p.status ~= "sitting_out" and p.status ~= "left" then
      remainingActive = remainingActive + 1
    end
  end
end

-- If only 1 player left and hand was in progress, award pot + reset table
local pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0)
if remainingPlayers == 1 then
  if pot > 0 then
    for i = 0, 9 do
      local pData = redis.call('HGET', playersKey, 'seat_' .. i)
      if pData and pData ~= false then
        local p = cjson.decode(pData)
        p.chips = p.chips + pot
        p.status = "waiting"
        p.cards = {}
        redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(p))
        break
      end
    end
  else
    -- Pot already distributed — just reset player status
    for i = 0, 9 do
      local pData = redis.call('HGET', playersKey, 'seat_' .. i)
      if pData and pData ~= false then
        local p = cjson.decode(pData)
        p.status = "waiting"
        p.cards = {}
        redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(p))
        break
      end
    end
  end
  -- Always reset table to clean state
  redis.call('HSET', tableKey, 'pot', 0)
  redis.call('HSET', tableKey, 'phase', 'waiting')
  redis.call('HSET', tableKey, 'turnSeat', -1)
  redis.call('HSET', tableKey, 'currentBet', 0)
  redis.call('HSET', tableKey, 'communityCards', '[]')
end

-- ============================================================
-- Build Response
-- ============================================================

local tableState = {
  id = redis.call('HGET', tableKey, 'id') or "",
  name = redis.call('HGET', tableKey, 'name') or "Table",
  phase = redis.call('HGET', tableKey, 'phase') or "waiting",
  pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0),
  currentBet = tonumber(redis.call('HGET', tableKey, 'currentBet') or 0),
  turnSeat = tonumber(redis.call('HGET', tableKey, 'turnSeat') or -1),
  dealerSeat = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0),
  smallBlindSeat = tonumber(redis.call('HGET', tableKey, 'smallBlindSeat') or 0),
  bigBlindSeat = tonumber(redis.call('HGET', tableKey, 'bigBlindSeat') or 0),
  communityCards = cjson.decode(redis.call('HGET', tableKey, 'communityCards') or "[]"),
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
  'event', 'player_left',
  'userId', userId,
  'seat', seat,
  'refund', chipsToRefund,
  'timestamp', redis.call('TIME')[1]
)

return cjson.encode({
  success = true,
  message = "Left table, refunded " .. chipsToRefund .. " chips",
  refundedAmount = chipsToRefund,
  remainingActive = remainingActive,
  tableState = {
    table = tableState,
    players = players
  }
})
