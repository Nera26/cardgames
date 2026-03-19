--[[
  add_chips_vault.lua - Rebuy/Reload Script (Post-Vault Sync)
  
  Adds chips to a player's stack. This script ASSUMES the financial
  deduction has already happened in the "Iron Vault" (Postgres).
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
  
  ARGV:
    [1] = seat index (0-9)
    [2] = amount to add
  
  RETURNS:
    JSON object with success and the updated table state.
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]

local seat = tonumber(ARGV[1])
local amount = tonumber(ARGV[2])

-- 1. Validate amount
if not amount or amount <= 0 then
  return cjson.encode({
    success = false,
    message = "Invalid amount"
  })
end

-- 2. Get player data
local playerData = redis.call('HGET', playersKey, 'seat_' .. seat)
if not playerData or playerData == false then
  return cjson.encode({
    success = false,
    message = "Player not found at seat"
  })
end

local p = cjson.decode(playerData)
local oldChips = tonumber(p.chips or 0)

-- 3. Check if a hand is actively in progress
local phase = redis.call('HGET', tableKey, 'phase') or 'waiting'
local handActive = (phase == 'preflop' or phase == 'flop' or phase == 'turn' or phase == 'river' or phase == 'showdown')

-- 4. Status-Aware Chip Add
if handActive and (p.status == 'all-in' or p.status == 'active' or p.status == 'folded') then
  -- Player is participating in the current hand — QUEUE the top-up
  -- Chips will be applied by next_hand.lua when the hand completes
  p.pendingTopUp = (tonumber(p.pendingTopUp) or 0) + amount
else
  -- Hand is not active OR player is waiting/sitting_out — apply immediately
  p.chips = oldChips + amount
  if oldChips == 0 then
    p.status = "waiting"
  end
end

-- Clear deposit hold flags (rebuy complete — stop showing "Depositing" badge)
p.depositExpiresAt = nil
p.depositExtension = nil

-- 5. Save Player Data
redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(p))

-- §17.2 Event Log: XADD to table stream
local tableId = redis.call('HGET', tableKey, 'id') or 'unknown'
redis.call('XADD', 'stream:table:' .. tableId, '*',
  'event', 'CHIPS_ADDED_VAULT',
  'seat', tostring(seat),
  'amount', tostring(amount),
  'oldChips', tostring(oldChips),
  'newChips', tostring(p.chips),
  'timestamp', tostring(redis.call('TIME')[1])
)

-- 6. Fetch Table State for Broadcast
local tableState = {
  id = tableId,
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
  bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20)
}

local players = {}
for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    table.insert(players, cjson.decode(pData))
  end
end

return cjson.encode({
  success = true,
  message = "Chips added via vault",
  tableState = {
    table = tableState,
    players = players
  }
})
