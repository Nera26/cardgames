--[[
  add_chips.lua - Rebuy/Reload Script (Ghost Protocol)
  
  Allows a busted player (sitting_out) to add chips and rejoin.
  Sets status to 'waiting' so they're picked up by next hand.
  
  KEYS:
    [1] = table:{id}:players   (players hash)
    [2] = user:{id}:balance    (user's Redis balance key)
  
  ARGV:
    [1] = seat index (0-9)
    [2] = amount to add
  
  RETURNS:
    JSON object with success/error and updated balances
]]

local playersKey = KEYS[1]
local balanceKey = KEYS[2]

local seat = tonumber(ARGV[1])
local amount = tonumber(ARGV[2])

-- Validate amount
if not amount or amount <= 0 then
  return cjson.encode({
    success = false,
    message = "Invalid amount"
  })
end

-- Get player data
local playerData = redis.call('HGET', playersKey, 'seat_' .. seat)
if not playerData or playerData == false then
  return cjson.encode({
    success = false,
    message = "Player not found at seat"
  })
end

local player = cjson.decode(playerData)

-- Verify player is sitting out or waiting (can rebuy)
if player.status ~= "sitting_out" and player.status ~= "waiting" then
  return cjson.encode({
    success = false,
    message = "Cannot add chips while active in hand"
  })
end

-- Check user's wallet balance
local walletBalance = tonumber(redis.call('GET', balanceKey) or 0)
if walletBalance < amount then
  return cjson.encode({
    success = false,
    message = "Insufficient balance",
    walletBalance = walletBalance,
    requested = amount
  })
end

-- Deduct from wallet
redis.call('INCRBYFLOAT', balanceKey, -amount)

-- Add to table chips
player.chips = (player.chips or 0) + amount

-- Track cumulative buy-in for Real Time Result winnings calculation
player.totalBuyIn = (player.totalBuyIn or player.chips) + amount

-- Set status to 'waiting' - will be promoted to 'active' by next hand
player.status = "waiting"

-- Save player data
redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(player))

-- Get updated wallet balance
local newWalletBalance = tonumber(redis.call('GET', balanceKey) or 0)

-- §17.2 Event Log: XADD to table stream
local tableId = string.match(playersKey, 'table:(.+):players')
if tableId then
  redis.call('XADD', 'stream:table:' .. tableId, '*',
    'event', 'CHIPS_ADDED',
    'seat', tostring(seat),
    'amount', tostring(amount),
    'totalChips', tostring(player.chips),
    'walletBalance', tostring(newWalletBalance),
    'timestamp', tostring(redis.call('TIME')[1])
  )
end

return cjson.encode({
  success = true,
  message = "Chips added successfully",
  tableChips = player.chips,
  walletBalance = newWalletBalance
})
