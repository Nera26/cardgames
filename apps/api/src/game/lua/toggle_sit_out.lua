--[[
  toggle_sit_out.lua - Sit-Out State Manager (Depleting Time Bank)
  
  Safety first: If a player is in a hand, we set a flag to sit out next hand
  to prevent breaking the current betting round.
  
  Depleting Time Bank: Each player has sitOutBank (seconds).
  When sitting out, sitOutStartedAt is recorded.
  When returning, elapsed time is deducted from sitOutBank.
  
  KEYS:
    [1] = table:{id}:players
  
  ARGV:
    [1] = seat number
  
  RETURNS:
    JSON updated player object with sitOutBank info
]]

local playersKey = KEYS[1]
local seat = ARGV[1]

local pData = redis.call('HGET', playersKey, 'seat_' .. seat)
if not pData or pData == false then
  return cjson.encode({ success = false, message = "Player not found" })
end

local p = cjson.decode(pData)

-- Initialize sitOutBank if missing (for legacy players who joined before this feature)
if not p.sitOutBank then
  p.sitOutBank = 600
end

-- Logic:
-- 1. If active/playing and has cards: sit out next hand
-- 2. If active/playing and NO cards: sit out immediately
-- 3. If sitting out: toggle to 'waiting' for next hand, deduct elapsed time

if p.status == "active" or p.status == "folded" or p.status == "all-in" then
  -- In a hand (or just finished one)
  if p.cards and #p.cards > 0 then
    -- SAFETY TRAP: Don't change status, just set flag
    p.sitOutNextHand = not (p.sitOutNextHand or false)
  else
    -- Not in a hand or already folded — sit out immediately
    p.status = "sitting_out"
    p.sitOutNextHand = false
    p.sitOutStartedAt = tonumber(redis.call('TIME')[1]) -- Unix epoch seconds
  end
elseif p.status == "sitting_out" then
  -- ═══ RETURN TO ACTION — Deplete Time Bank ═══
  if p.sitOutStartedAt then
    local now = tonumber(redis.call('TIME')[1])
    local elapsed = now - tonumber(p.sitOutStartedAt)
    p.sitOutBank = math.max(0, (tonumber(p.sitOutBank) or 600) - elapsed)
  end
  p.status = "waiting" -- Will be promoted in next_hand.lua
  p.sitOutNextHand = false
  p.sitOutStartedAt = nil
elseif p.status == "waiting" then
  -- Changed mind, stay out
  p.status = "sitting_out"
  p.sitOutNextHand = false
  p.sitOutStartedAt = tonumber(redis.call('TIME')[1])
end

redis.call('HSET', playersKey, 'seat_' .. seat, cjson.encode(p))

-- Count active players (anyone who can participate in a hand)
local activeCount = 0
local allPlayers = redis.call('HGETALL', playersKey)
for i = 1, #allPlayers, 2 do
  local key = allPlayers[i]
  if string.find(key, 'seat_') then
    local pd = cjson.decode(allPlayers[i + 1])
    if pd.status ~= 'sitting_out' and pd.status ~= 'left' then
      activeCount = activeCount + 1
    end
  end
end

-- §17.2 Event Log
local tableId = string.match(playersKey, 'table:(.+):players')
if tableId then
  redis.call('XADD', 'stream:table:' .. tableId, '*',
    'event', 'PLAYER_SIT_OUT',
    'seat', seat,
    'status', p.status,
    'sitOutBank', tostring(p.sitOutBank or 0),
    'sitOutNextHand', tostring(p.sitOutNextHand or false),
    'timestamp', tostring(redis.call('TIME')[1])
  )
end

return cjson.encode({
  success = true,
  player = p,
  activeCount = activeCount,
  sitOutBank = tonumber(p.sitOutBank) or 0
})
