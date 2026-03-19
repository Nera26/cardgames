--[[
  sync_balance.lua — Sync Postgres wallet balance to Redis
  
  §17.1: Validates user key exists pattern
  §17.2: XADD event to stream
  
  KEYS[1] = user:{userId}:balance
  ARGV[1] = balance amount (string number)
  ARGV[2] = userId (for audit trail)
  
  Returns: JSON { success, balance }
]]

local balanceKey = KEYS[1]
local amount     = ARGV[1]
local userId     = ARGV[2]

-- §17.1 Validation First: amount must be a valid number >= 0
local numAmount = tonumber(amount)
if not numAmount or numAmount < 0 then
    return cjson.encode({
        success = false,
        message = 'Invalid balance amount: must be >= 0'
    })
end

-- Mutation: Set the balance
redis.call('SET', balanceKey, amount)

-- §17.2 Event Log: Record the sync event
-- Extract tableId-agnostic stream for user-level events
redis.call('XADD', 'stream:user:' .. userId, '*',
    'event', 'BALANCE_SYNCED',
    'userId', userId,
    'balance', amount,
    'timestamp', tostring(redis.call('TIME')[1])
)

return cjson.encode({
    success = true,
    balance = numAmount
})
