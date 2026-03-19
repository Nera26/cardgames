--[[
  join_table.lua - Atomic Table Join Script
  
  Handles player joining a poker table with atomic chip transfer.
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
    [3] = user:{id}:balance    (user chip balance)
  
  ARGV:
    [1] = seat number (0-9)
    [2] = buy-in amount
    [3] = user ID
    [4] = username
    [5] = avatar ID
    [6] = avatar URL (custom upload or null)
  
  RETURNS:
    JSON object with:
    - success: boolean
    - message: string
    - triggerStart: boolean (true if 2+ active players)
    - tableState: full table state object
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]
local balanceKey = KEYS[3]

local seat = tonumber(ARGV[1])
local buyIn = tonumber(ARGV[2])
local odId = ARGV[3]
local username = ARGV[4]
local avatarId = ARGV[5] or "avatar_1"
local avatarUrl = ARGV[6] or ""

-- ============================================================
-- Validation & Resurrection
-- ============================================================

-- Check if player is already at this table (any seat) - RESURRECTION LOGIC
for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    local p = cjson.decode(pData)
    if p.id == odId then
      -- Player found: Resurrection
      if p.status == "disconnected" then
        p.status = "active"
        redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(p))
      end
      
      -- Fetch current table state
      local tState = {
        id = redis.call('HGET', tableKey, 'id') or "",
        name = redis.call('HGET', tableKey, 'name') or "Table",
        phase = redis.call('HGET', tableKey, 'phase') or "waiting",
        pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0),
        currentBet = tonumber(redis.call('HGET', tableKey, 'currentBet') or 0),
        turnSeat = tonumber(redis.call('HGET', tableKey, 'turnSeat') or -1),
        dealerSeat = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0),
        smallBlindSeat = tonumber(redis.call('HGET', tableKey, 'smallBlindSeat') or 1),
        bigBlindSeat = tonumber(redis.call('HGET', tableKey, 'bigBlindSeat') or 2),
        communityCards = cjson.decode(redis.call('HGET', tableKey, 'communityCards') or "[]"),
        smallBlind = tonumber(redis.call('HGET', tableKey, 'smallBlind') or 10),
        bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20),
        lastRaiseSize = tonumber(redis.call('HGET', tableKey, 'lastRaiseSize') or 0)
      }
      
      -- Collect all players for response
      local allPlayers = {}
      for j = 0, 9 do
        local d = redis.call('HGET', playersKey, 'seat_' .. j)
        if d and d ~= false then
          table.insert(allPlayers, cjson.decode(d))
        end
      end
      
      return cjson.encode({
        success = true,
        action = "reconnected",
        message = "Reconnected to seat " .. i,
        seat = i,
        triggerStart = false,
        tableState = {
          table = tState,
          players = allPlayers
        }
      })
    end
  end
end

-- Check if seat is valid (0-9)
if seat < 0 or seat > 9 then
  return cjson.encode({
    success = false,
    message = "Invalid seat number"
  })
end

-- Check if seat is already occupied
local existingPlayer = redis.call('HGET', playersKey, 'seat_' .. seat)
if existingPlayer and existingPlayer ~= false then
  return cjson.encode({
    success = false,
    message = "Seat is already occupied"
  })
end


-- Check if user has enough balance
local currentBalance = tonumber(redis.call('GET', balanceKey) or 0)
if currentBalance < buyIn then
  return cjson.encode({
    success = false,
    message = "Insufficient balance"
  })
end

-- ============================================================
-- THE BOUNCER: Enforce Buy-in Limits (Hot Sync Config)
-- ============================================================

-- Read table config from Redis (seeded from Postgres on first join)
local configKey = KEYS[1] .. ':config'
local minBuyIn = tonumber(redis.call('HGET', configKey, 'minBuyIn') or 0)
local maxBuyIn = tonumber(redis.call('HGET', configKey, 'maxBuyIn') or 999999999)

-- Reject if buy-in is below minimum
if buyIn < minBuyIn then
  return cjson.encode({
    success = false,
    errorCode = 'ERR_MIN_BUYIN',
    message = 'Buy-in too low. Minimum: ' .. minBuyIn,
    minBuyIn = minBuyIn
  })
end

-- Reject if buy-in exceeds maximum
if buyIn > maxBuyIn then
  return cjson.encode({
    success = false,
    errorCode = 'ERR_MAX_BUYIN',
    message = 'Buy-in too high. Maximum: ' .. maxBuyIn,
    maxBuyIn = maxBuyIn
  })
end

-- ============================================================
-- Atomic Operations
-- ============================================================

-- Decrement user balance
redis.call('INCRBYFLOAT', balanceKey, -buyIn)

-- Read time bank config (defaults to 60s if missing)
local timeBankConfig = tonumber(redis.call('HGET', configKey, 'timeBank') or 60)

-- Create player object
local playerData = cjson.encode({
  id = odId,
  username = username,
  avatarId = avatarId,
  avatarUrl = (avatarUrl ~= "") and avatarUrl or nil,
  chips = buyIn,
  totalBuyIn = buyIn,
  status = "waiting",
  cards = {},
  currentBet = 0,
  seatNumber = seat,
  time_bank = timeBankConfig,
  sitOutBank = 600
})

-- Add player to table
redis.call('HSET', playersKey, 'seat_' .. seat, playerData)

-- ============================================================
-- Count Active Players & Check for Auto-Start
-- ============================================================

-- STATE BARRIER: Read current phase to prevent mid-hand intruders
local phase = redis.call('HGET', tableKey, 'phase') or 'waiting'

local activePlayers = 0
local players = {}

for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    local pl = cjson.decode(pData)
    table.insert(players, pl)
    -- Only count players eligible to play (not sitting_out or left)
    if pl.status ~= "sitting_out" and pl.status ~= "left" then
      activePlayers = activePlayers + 1
    end
  end
end

-- Only trigger hand start if table is IDLE (no hand in progress)
local triggerStart = activePlayers >= 2 and phase == "waiting"

-- Promote waiting → active ONLY when table is idle (phase == 'waiting')
-- During active hands, new joiners stay 'waiting' until next_hand.lua
if triggerStart and phase == "waiting" then
  for i = 0, 9 do
    local pData = redis.call('HGET', playersKey, 'seat_' .. i)
    if pData and pData ~= false then
      local player = cjson.decode(pData)
      if player.status == "waiting" then
        player.status = "active"
        redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(player))
      end
    end
  end
end

-- ============================================================
-- Build Table State Response
-- ============================================================

-- Get table metadata
local tableState = {
  id = redis.call('HGET', tableKey, 'id') or "",
  name = redis.call('HGET', tableKey, 'name') or "Table",
  phase = redis.call('HGET', tableKey, 'phase') or "waiting",
  pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0),
  currentBet = tonumber(redis.call('HGET', tableKey, 'currentBet') or 0),
  turnSeat = tonumber(redis.call('HGET', tableKey, 'turnSeat') or -1),
  dealerSeat = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0),
  smallBlindSeat = tonumber(redis.call('HGET', tableKey, 'smallBlindSeat') or 1),
  bigBlindSeat = tonumber(redis.call('HGET', tableKey, 'bigBlindSeat') or 2),
  communityCards = cjson.decode(redis.call('HGET', tableKey, 'communityCards') or "[]"),
  smallBlind = tonumber(redis.call('HGET', tableKey, 'smallBlind') or 10),
  bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20),
  lastRaiseSize = tonumber(redis.call('HGET', tableKey, 'lastRaiseSize') or 0)
}

-- Rebuild players list after potential status update
players = {}
for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    table.insert(players, cjson.decode(pData))
  end
end

-- ============================================================
-- Log to Stream for Yellow Cable
-- ============================================================

redis.call('XADD', 'stream:table:' .. (tableState.id or "unknown"), '*',
  'event', 'player_joined',
  'userId', odId,
  'seat', seat,
  'buyIn', buyIn,
  'avatarId', avatarId,
  'avatarUrl', avatarUrl,
  'timestamp', redis.call('TIME')[1]
)

return cjson.encode({
  success = true,
  message = "Joined table successfully",
  triggerStart = triggerStart,
  tableState = {
    table = tableState,
    players = players
  }
})
