--[[
  set_online.lua - Atomic Player Reconnect

  Clears a player's offline status when they reconnect. Also clears
  sit_out_start and promotes sitting_out players to 'waiting' so they
  are dealt in next hand.

  KEYS:
    [1] = table:{id}:players   (players hash)

  ARGV:
    [1] = seat number

  RETURNS:
    JSON { success, connection, status, username }

  @see ARCHITECTURE.md §17 - The Law of Lua
  @see ARCHITECTURE.md §2 - Red Cable (Lua is the Judge)
]]

local playersKey = KEYS[1]
local seat = tonumber(ARGV[1])

-- Validate input
if not seat or seat < 0 or seat > 9 then
  return cjson.encode({
    success = false,
    message = "Invalid seat number"
  })
end

-- Get the player at this seat
local playerData = redis.call('HGET', playersKey, 'seat_' .. seat)
if not playerData or playerData == false then
  return cjson.encode({
    success = false,
    message = "No player at seat " .. seat
  })
end

-- Atomic mutation: Clear offline + promote if needed
local player = cjson.decode(playerData)
player.connection = nil       -- Clear offline flag
player.disconnected_at = nil  -- Clear disconnect timestamp (reset Reaper timer)
player.sit_out_start = nil    -- Clear AFK timer

-- If sitting out, promote to waiting for next hand
if player.status == "sitting_out" then
  player.status = "waiting"
end

redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(player))

-- Extract table ID from key pattern
local tableId = string.match(playersKey, "table:([^:]+):players")

-- Event Log (§17.2)
redis.call('XADD', 'stream:table:' .. (tableId or "unknown"), '*',
  'event', 'player_online',
  'seat', seat,
  'username', player.username or "",
  'status', player.status,
  'timestamp', redis.call('TIME')[1]
)

return cjson.encode({
  success = true,
  connection = "online",
  status = player.status,
  username = player.username or ""
})
