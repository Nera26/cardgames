--[[
  set_config.lua — Atomic table config update (Hot Sync)
  
  §17.1: Validates at least one field provided
  §17.2: XADD event to stream
  
  KEYS[1] = table:{tableId}:config
  KEYS[2] = stream:table:{tableId}   (for event log)
  ARGV = pairs of (field, value) — e.g. 'rakePercent', '5', 'rakeCap', '2'
  
  Returns: JSON { success, updated_fields }
]]

local configKey = KEYS[1]
local streamKey = KEYS[2]

-- §17.1 Validation: Must have at least one field-value pair
local argc = #ARGV
if argc == 0 or argc % 2 ~= 0 then
    return cjson.encode({
        success = false,
        message = 'Invalid arguments: must be field-value pairs'
    })
end

-- Allowed fields whitelist (defense in depth)
local allowed = {
    rakePercent = true,
    rakeCap = true,
    turnTime = true,
    timeBank = true,
    smallBlind = true,
    bigBlind = true,
    minBuyIn = true,
    maxBuyIn = true,
}

-- Build the update set, rejecting unknown fields
local updates = {}
local updatedFields = {}
for i = 1, argc, 2 do
    local field = ARGV[i]
    local value = ARGV[i + 1]
    if allowed[field] then
        updates[#updates + 1] = field
        updates[#updates + 1] = value
        updatedFields[#updatedFields + 1] = field
    end
end

if #updates == 0 then
    return cjson.encode({
        success = false,
        message = 'No valid config fields provided'
    })
end

-- Mutation: Apply the config update
redis.call('HSET', configKey, unpack(updates))

-- §17.2 Event Log
redis.call('XADD', streamKey, '*',
    'event', 'CONFIG_UPDATED',
    'fields', table.concat(updatedFields, ','),
    'timestamp', tostring(redis.call('TIME')[1])
)

return cjson.encode({
    success = true,
    updated_fields = updatedFields
})
