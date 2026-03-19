--[[
  waitlist.lua - Table Waitlist Management (Atomic Operations)
  
  Manages an ordered queue of players waiting for a seat at a full table.
  Uses a Redis List for FIFO ordering.
  
  KEYS:
    [1] = table:{id}:waitlist   (waitlist list)
  
  ARGV:
    [1] = action: "join" | "leave" | "list" | "pop"
    [2] = JSON payload (for join: { userId, username, avatarId })
    [3] = userId (for leave: remove specific user)
  
  RETURNS:
    JSON object with success/error and current waitlist
]]

local waitlistKey = KEYS[1]
local action = ARGV[1]

-- ============================================================
-- JOIN: Add a player to the end of the waitlist
-- ============================================================
if action == "join" then
  local payload = ARGV[2]
  local entry = cjson.decode(payload)
  
  -- Check if player is already in the waitlist
  local existing = redis.call('LRANGE', waitlistKey, 0, -1)
  for _, item in ipairs(existing) do
    local parsed = cjson.decode(item)
    if parsed.userId == entry.userId then
      return cjson.encode({
        success = false,
        message = "Already on the waitlist"
      })
    end
  end
  
  -- Add to end of queue (FIFO)
  redis.call('RPUSH', waitlistKey, payload)
  
  -- Return updated waitlist
  local updated = redis.call('LRANGE', waitlistKey, 0, -1)
  local list = {}
  for _, item in ipairs(updated) do
    table.insert(list, cjson.decode(item))
  end
  
  return cjson.encode({
    success = true,
    message = "Added to waitlist",
    waitlist = list
  })

-- ============================================================
-- LEAVE: Remove a player from the waitlist
-- ============================================================
elseif action == "leave" then
  local userId = ARGV[2]
  
  -- Find and remove the entry with matching userId
  local existing = redis.call('LRANGE', waitlistKey, 0, -1)
  for _, item in ipairs(existing) do
    local parsed = cjson.decode(item)
    if parsed.userId == userId then
      redis.call('LREM', waitlistKey, 1, item)
      break
    end
  end
  
  -- Return updated waitlist
  local updated = redis.call('LRANGE', waitlistKey, 0, -1)
  local list = {}
  for _, item in ipairs(updated) do
    table.insert(list, cjson.decode(item))
  end
  
  return cjson.encode({
    success = true,
    message = "Removed from waitlist",
    waitlist = list
  })

-- ============================================================
-- LIST: Return current waitlist (read-only)
-- ============================================================
elseif action == "list" then
  local existing = redis.call('LRANGE', waitlistKey, 0, -1)
  local list = {}
  for _, item in ipairs(existing) do
    table.insert(list, cjson.decode(item))
  end
  
  return cjson.encode({
    success = true,
    waitlist = list
  })

-- ============================================================
-- POP: Remove and return the first player (seat opened up)
-- ============================================================
elseif action == "pop" then
  local first = redis.call('LPOP', waitlistKey)
  if not first or first == false then
    return cjson.encode({
      success = false,
      message = "Waitlist is empty"
    })
  end
  
  return cjson.encode({
    success = true,
    player = cjson.decode(first)
  })
end

return cjson.encode({
  success = false,
  message = "Unknown action: " .. (action or "nil")
})
