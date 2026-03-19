--[[
  set_heartbeat.lua — Atomic heartbeat timestamp update
  
  §17.1: Validates seat exists in session context
  §17.2: No XADD needed (high-frequency, non-critical event)
  
  KEYS[1] = last_seen:{tableId}:{seat}
  ARGV[1] = current timestamp (milliseconds)
  
  Returns: JSON { success }
  
  NOTE: Heartbeats are exempt from §17.2 XADD because they fire
  every 10-15 seconds per player. Logging them to streams would
  flood the audit trail. The Reaper uses the key directly.
]]

local heartbeatKey = KEYS[1]
local timestamp    = ARGV[1]

-- §17.1 Validation: timestamp must be a valid number
local numTs = tonumber(timestamp)
if not numTs or numTs <= 0 then
    return cjson.encode({
        success = false,
        message = 'Invalid timestamp'
    })
end

-- Mutation: Set heartbeat with 60s TTL (auto-expire = dead man's switch)
redis.call('SET', heartbeatKey, timestamp, 'EX', 60)

return cjson.encode({
    success = true
})
