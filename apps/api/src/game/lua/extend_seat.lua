--[[
  extend_seat.lua - Deposit Extension Seat Hold
  
  Extends a busted player's sitOutBank to 180 seconds so they can
  deposit funds without losing their seat. Only works for players
  who are currently sitting_out (busted).
  
  SAFETY: Checks that the player is NOT in an active hand.
  Idempotent — calling again while already extended just resets to 180s.
  
  KEYS:
    [1] = table:{id}:players
  
  ARGV:
    [1] = seat number
  
  RETURNS:
    JSON { success, sitOutBank, message }
]]

local playersKey = KEYS[1]
local seat = ARGV[1]

local pData = redis.call('HGET', playersKey, 'seat_' .. seat)
if not pData or pData == false then
  return cjson.encode({ success = false, message = "Player not found" })
end

local p = cjson.decode(pData)

-- SAFETY: Only extend for sitting_out or busted players
-- Do NOT extend for active/folded/all-in players (they're in a hand)
if p.status ~= "sitting_out" and p.status ~= "busted" then
  return cjson.encode({
    success = false,
    message = "Player is not sitting out (status: " .. tostring(p.status) .. ")"
  })
end

-- Extend the sit-out bank to 180 seconds (3 minutes)
local now = tonumber(redis.call('TIME')[1])
p.sitOutBank = 180
p.depositExtension = true
p.depositExpiresAt = now + 180  -- Unix timestamp: single source of truth for all clients
p.sitOutStartedAt = now  -- Reset the clock

redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(p))

-- Event log
local tableId = string.match(playersKey, 'table:(.+):players')
if tableId then
  redis.call('XADD', 'stream:table:' .. tableId, '*',
    'event', 'SEAT_EXTENDED_FOR_DEPOSIT',
    'seat', seat,
    'sitOutBank', '180',
    'timestamp', tostring(redis.call('TIME')[1])
  )
end

return cjson.encode({
  success = true,
  message = "Seat reserved for 180 seconds for deposit",
  sitOutBank = 180
})
