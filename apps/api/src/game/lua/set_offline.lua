--[[
  set_offline.lua - Atomic Player Disconnect

  Marks a seated player's connection status as 'offline' without
  folding or removing them from the table. The player retains their
  seat, chips, and cards. The turn timer + time bank handle timeout
  if it's currently their turn.

  KEYS:
    [1] = table:{id}:players   (players hash)

  ARGV:
    [1] = seat number

  RETURNS:
    JSON { success, connection, username }

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

-- Atomic mutation: Mark offline with precise timestamp
local player = cjson.decode(playerData)
player.connection = "offline"
player.disconnected_at = redis.call('TIME')[1]  -- Unix seconds (server-side)
redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(player))

-- Extract table ID from key pattern (table:{id}:players)
local tableId = string.match(playersKey, "table:([^:]+):players")

-- Event Log (§17.2)
redis.call('XADD', 'stream:table:' .. (tableId or "unknown"), '*',
  'event', 'player_offline',
  'seat', seat,
  'username', player.username or "",
  'timestamp', redis.call('TIME')[1]
)

return cjson.encode({
  success = true,
  connection = "offline",
  username = player.username or ""
})
