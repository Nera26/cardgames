--[[
  toggle_lnbb.lua - Leave Next Big Blind Toggle
  
  Sets or clears the leaveNextBB flag on a player's seat state.
  The flag is enforced by next_hand.lua during blind assignment.
  
  KEYS:
    [1] = table:{id}:players
  
  ARGV:
    [1] = seat number
    [2] = "true" or "false"
  
  RETURNS:
    JSON { success, player }
]]

local playersKey = KEYS[1]
local seat = ARGV[1]
local value = (ARGV[2] == "true")

local pData = redis.call('HGET', playersKey, 'seat_' .. seat)
if not pData or pData == false then
  return cjson.encode({ success = false, message = "Player not found" })
end

local p = cjson.decode(pData)
p.leaveNextBB = value

redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(p))

-- Event log
local tableId = string.match(playersKey, 'table:(.+):players')
if tableId then
  redis.call('XADD', 'stream:table:' .. tableId, '*',
    'event', 'TOGGLE_LNBB',
    'seat', seat,
    'value', tostring(value),
    'timestamp', tostring(redis.call('TIME')[1])
  )
end

return cjson.encode({
  success = true,
  player = p
})
