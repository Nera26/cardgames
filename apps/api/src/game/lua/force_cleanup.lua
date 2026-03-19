--[[
  force_cleanup.lua - Boot Reconciliation Hard Reset
  
  Surgically resets a single table: refunds all players' chips to their
  wallet balances and empties the table state.
  
  This is NOT the same as leave_table.lua — it skips all game logic
  (no fold, no pot award, no next hand). It's a hard reset.
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
  
  ARGV:
    (none)
  
  RETURNS:
    JSON { success, playersRefunded, totalRefunded }
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]

-- ============================================================
-- Phase 1: Enumerate & Refund All Players
-- ============================================================

local playersRefunded = 0
local totalRefunded = 0

for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    local player = cjson.decode(pData)
    
    -- Calculate total money on table: chips in stack + current bet
    local chips = tonumber(player.chips or 0)
    local currentBet = tonumber(player.currentBet or 0)
    local totalContribution = tonumber(player.totalContribution or 0)
    local refund = chips + currentBet
    
    -- Refund to user's wallet balance
    if refund > 0 and player.id then
      local balanceKey = 'user:' .. player.id .. ':balance'
      redis.call('INCRBYFLOAT', balanceKey, refund)
      totalRefunded = totalRefunded + refund
    end
    
    -- Remove player from seat
    redis.call('HDEL', playersKey, 'seat_' .. i)
    playersRefunded = playersRefunded + 1
  end
end

-- ============================================================
-- Phase 2: Also refund any chips stuck in the pot
-- (Edge case: server crashed mid-showdown before distribution)
-- ============================================================

-- The pot is already included in player totalContributions,
-- but we zero it out to reset the table state cleanly.

-- ============================================================
-- Phase 3: Reset Table State to Clean "Waiting"
-- ============================================================

redis.call('HSET', tableKey, 'phase', 'waiting')
redis.call('HSET', tableKey, 'pot', 0)
redis.call('HSET', tableKey, 'currentBet', 0)
redis.call('HSET', tableKey, 'turnSeat', -1)
redis.call('HSET', tableKey, 'communityCards', '[]')
redis.call('HSET', tableKey, 'handNumber', 0)
redis.call('HSET', tableKey, 'lastAction', '')

-- Clean up deck if it exists
local deckKey = tableKey .. ':deck'
redis.call('DEL', deckKey)

-- §17.2 Event Log: Record cleanup BEFORE deleting the stream
local tableId = redis.call('HGET', tableKey, 'id') or 'unknown'
local streamKey = 'stream:table:' .. tableId
redis.call('XADD', streamKey, '*',
  'event', 'TABLE_FORCE_CLEANUP',
  'playersRefunded', tostring(playersRefunded),
  'totalRefunded', tostring(totalRefunded),
  'timestamp', tostring(redis.call('TIME')[1])
)

-- Clean up event stream (hard reset — wipe history)
redis.call('DEL', streamKey)

return cjson.encode({
  success = true,
  playersRefunded = playersRefunded,
  totalRefunded = totalRefunded
})
