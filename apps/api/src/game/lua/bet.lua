--[[
  bet.lua - Handle Betting Actions
  
  Processes fold, check, call, raise, and all-in actions.
  
  KEYS:
    [1] = table:{id}           (table hash)
    [2] = table:{id}:players   (players hash)
  
  ARGV:
    [1] = seat number performing action
    [2] = action type: 'fold' | 'check' | 'call' | 'raise' | 'all-in'
    [3] = amount (for raise/all-in, 0 for others)
  
  RETURNS:
    JSON object with:
    - success: boolean
    - message: string
    - nextStreet: boolean (true if betting round complete)
    - handComplete: boolean (true if only one player left)
    - tableState: full table state
]]

local tableKey = KEYS[1]
local playersKey = KEYS[2]

local actionSeat = tonumber(ARGV[1])
local actionType = ARGV[2]
local actionAmount = tonumber(ARGV[3] or 0)

-- ============================================================
-- Helper Functions
-- ============================================================

local function getNextActiveSeat(currentSeat)
  for offset = 1, 10 do
    local nextSeat = (currentSeat + offset) % 10
    local playerData = redis.call('HGET', playersKey, 'seat_' .. nextSeat)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      if player.status == "active" then
        return nextSeat
      end
    end
  end
  return -1
end

-- Count players with status "active" (can still bet)
local function countActivePlayers()
  local count = 0
  for i = 0, 9 do
    local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      if player.status == "active" then
        count = count + 1
      end
    end
  end
  return count
end

-- Count players still in the hand (active or all-in, not folded)
local function countPlayersInHand()
  local count = 0
  for i = 0, 9 do
    local playerData = redis.call('HGET', playersKey, 'seat_' .. i)
    if playerData and playerData ~= false then
      local player = cjson.decode(playerData)
      if player.status == "active" or player.status == "all-in" then
        count = count + 1
      end
    end
  end
  return count
end

-- ============================================================
-- Validation
-- ============================================================

local currentTurn = tonumber(redis.call('HGET', tableKey, 'turnSeat') or -1)
local currentBet = tonumber(redis.call('HGET', tableKey, 'currentBet') or 0)
local pot = tonumber(redis.call('HGET', tableKey, 'pot') or 0)
local phase = redis.call('HGET', tableKey, 'phase') or "waiting"

-- Check if it's this player's turn
if currentTurn ~= actionSeat then
  return cjson.encode({
    success = false,
    message = "It is not your turn"
  })
end

-- Get player data
local playerData = redis.call('HGET', playersKey, 'seat_' .. actionSeat)
if not playerData or playerData == false then
  return cjson.encode({
    success = false,
    message = "Player not found"
  })
end

local player = cjson.decode(playerData)

if player.status ~= "active" then
  return cjson.encode({
    success = false,
    message = "Player is not active"
  })
end

-- ============================================================
-- AoF Enforcement: All-In or Fold Mode
-- ============================================================

local configKey = tableKey .. ':config'
local variant = redis.call('HGET', configKey, 'variant') or 'TEXAS_HOLDEM'

if variant == 'ALL_IN_OR_FOLD' then
  -- In AoF mode, only 'fold' and 'all-in' are allowed
  if actionType == 'check' then
    return cjson.encode({
      success = false,
      message = "Check not allowed in All-In or Fold mode",
      errorCode = "ERR_AOF_VIOLATION"
    })
  end
  
  if actionType == 'call' then
    return cjson.encode({
      success = false,
      message = "Call not allowed in All-In or Fold mode. You must go All-In.",
      errorCode = "ERR_AOF_VIOLATION"
    })
  end
  
  if actionType == 'raise' then
    -- Check if this is truly an all-in raise
    local toCall = currentBet - player.currentBet
    local raiseWithChips = actionAmount - player.currentBet
    if actionAmount < (player.chips + player.currentBet) then
      return cjson.encode({
        success = false,
        message = "Partial raises not allowed in AoF. Go All-In or Fold.",
        errorCode = "ERR_AOF_VIOLATION"
      })
    end
  end
end

-- ============================================================
-- Process Action
-- ============================================================

local toCall = currentBet - player.currentBet

-- Track whether this action resets the acted count (aggressive action)
local isAggressive = false

if actionType == "fold" then
  player.status = "folded"
  player.cards = {}
  redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(player))

elseif actionType == "check" then
  if toCall > 0 then
    return cjson.encode({
      success = false,
      message = "Cannot check, must call or raise"
    })
  end
  -- Check is valid, no chips change

elseif actionType == "call" then
  local callAmount = math.min(toCall, player.chips)
  player.chips = player.chips - callAmount
  player.currentBet = player.currentBet + callAmount
  pot = pot + callAmount
  
  if player.chips == 0 then
    player.status = "all-in"
  end
  
  player.totalContribution = (player.totalContribution or 0) + callAmount
  redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(player))
  redis.call('HSET', tableKey, 'pot', pot)

elseif actionType == "raise" then
  -- ============================================================
  -- NLH Min-Raise Rule: raise must be at least the last raise increment
  -- Formula: minRaise = currentBet + lastRaiseSize
  -- Example: BB=10K, raise to 380K (increment=370K), min re-raise = 380K + 370K = 750K
  -- ============================================================
  local bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20)
  local lastRaiseSize = tonumber(redis.call('HGET', tableKey, 'lastRaiseSize') or bigBlind)
  local minRaise = currentBet + lastRaiseSize
  if actionAmount < minRaise and actionAmount < player.chips then
    return cjson.encode({
      success = false,
      message = "Raise must be at least " .. minRaise
    })
  end
  
  -- ============================================================
  -- Pot Limit Enforcement: Cap raise at pot size formula
  -- ============================================================
  local bettingLimit = redis.call('HGET', configKey, 'bettingLimit') or 'NO_LIMIT'
  local maxBet = player.chips + player.currentBet  -- Default: all-in cap
  
  if bettingLimit == 'POT_LIMIT' then
    -- PLO Formula: Max Bet = Current Pot + (2 × Amount to Call)
    -- This allows: call the bet, then raise the size of the new pot
    local amountToCall = currentBet - player.currentBet
    maxBet = pot + (2 * amountToCall) + player.currentBet
    
    -- Cap at player's available chips
    maxBet = math.min(maxBet, player.chips + player.currentBet)
    
    if actionAmount > maxBet then
      -- Auto-cap to max pot bet (UX-friendly)
      actionAmount = maxBet
    end
  end
  
  -- If raise amount >= player's total stack (chips + currentBet), treat as all-in.
  -- This fixes the bug where slider sends playerBalance as the amount but the
  -- "raise to" semantic leaves the already-posted blind behind.
  local totalBet
  local chipsToAdd

  if actionAmount >= player.chips + player.currentBet then
    -- All-in via raise: put everything in
    chipsToAdd = player.chips
    totalBet = player.currentBet + chipsToAdd
    player.chips = 0
    player.status = "all-in"
  elseif actionAmount >= player.chips then
    -- Frontend sent playerBalance (chips only) as amount — also all-in
    chipsToAdd = player.chips
    totalBet = player.currentBet + chipsToAdd
    player.chips = 0
    player.status = "all-in"
  else
    totalBet = math.min(actionAmount, player.chips + player.currentBet)
    chipsToAdd = totalBet - player.currentBet
    player.chips = player.chips - chipsToAdd
    if player.chips == 0 then
      player.status = "all-in"
    end
  end

  player.currentBet = totalBet
  pot = pot + chipsToAdd
  
  redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(player))
  redis.call('HSET', tableKey, 'pot', pot)
  redis.call('HSET', tableKey, 'currentBet', totalBet)

  -- Update lastRaiseSize: the increment of THIS raise
  local raiseIncrement = totalBet - currentBet
  if raiseIncrement > 0 then
    redis.call('HSET', tableKey, 'lastRaiseSize', raiseIncrement)
  end

  -- Atomically increment total contribution
  local playerRaw = redis.call('HGET', playersKey, 'seat_' .. actionSeat)
  local playerObj = cjson.decode(playerRaw)
  playerObj.totalContribution = (playerObj.totalContribution or 0) + chipsToAdd
  redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(playerObj))
  currentBet = totalBet
  isAggressive = true  -- Raise resets acted count

elseif actionType == "all-in" then
  local allInAmount = player.chips
  player.currentBet = player.currentBet + allInAmount
  pot = pot + allInAmount
  player.chips = 0
  player.status = "all-in"
  
  if player.currentBet > currentBet then
    -- Update lastRaiseSize for all-in that raises
    local raiseIncrement = player.currentBet - currentBet
    redis.call('HSET', tableKey, 'lastRaiseSize', raiseIncrement)
    currentBet = player.currentBet
    redis.call('HSET', tableKey, 'currentBet', currentBet)
    isAggressive = true  -- All-in that raises resets acted count
  end
  
  player.totalContribution = (player.totalContribution or 0) + allInAmount
  redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(player))
  redis.call('HSET', tableKey, 'pot', pot)

else
  return cjson.encode({
    success = false,
    message = "Invalid action type"
  })
end

-- ============================================================
-- TIME BANK DEDUCTION: "The Bill"
-- If player was using time bank, calculate and deduct the cost.
-- Redis TIME returns {seconds, microseconds}. We use seconds.
-- ============================================================

local timeBankDeducted = 0
local timeBankRemaining = tonumber(player.time_bank or 0)

if player.is_using_bank == true or player.is_using_bank == "true" then
  local now = tonumber(redis.call('TIME')[1])
  local started = tonumber(player.time_bank_started_at or now)
  local used = now - started
  
  timeBankDeducted = used
  timeBankRemaining = math.max(0, timeBankRemaining - used)
  
  -- Clear time bank flags
  player.time_bank = timeBankRemaining
  player.is_using_bank = nil
  player.time_bank_started_at = nil
  
  -- Re-save player (with updated time bank)
  redis.call('HSET', playersKey, 'seat_' .. actionSeat, cjson.encode(player))
end

-- ============================================================
-- Update Players Acted Count (Barrier of Action)
-- ============================================================

if isAggressive then
  -- Aggressive action resets count to 1 (the aggressor)
  redis.call('HSET', tableKey, 'playersActedCount', 1)
else
  -- Passive action increments count
  redis.call('HINCRBY', tableKey, 'playersActedCount', 1)
end

-- ============================================================
-- Check for Hand Complete (Only 1 Active)
-- ============================================================

local activeCount = countActivePlayers()
local playersInHand = countPlayersInHand()
local handComplete = false
local winningSeat = -1

-- Hand is complete ONLY if all but one player has folded
-- (All-in players are still in the hand, so we check playersInHand, not activeCount)
if playersInHand == 1 then
  handComplete = true
  -- Find the winner (either active or all-in)
  for i = 0, 9 do
    local pData = redis.call('HGET', playersKey, 'seat_' .. i)
    if pData and pData ~= false then
      local p = cjson.decode(pData)
      if p.status == "active" or p.status == "all-in" then
        winningSeat = i
        -- Award pot
        p.chips = p.chips + pot
        redis.call('HSET', playersKey, 'seat_' .. i, cjson.encode(p))
        break
      end
    end
  end
  redis.call('HSET', tableKey, 'pot', 0)
  redis.call('HSET', tableKey, 'phase', 'showdown')

  -- Emit hand_ended to Redis stream for fold-win archival (Yellow Cable)
  local foldTableId = redis.call('HGET', tableKey, 'id') or "unknown"
  local foldCommunityCards = redis.call('HGET', tableKey, 'communityCards') or "[]"
  local foldActionLogKey = 'table:' .. foldTableId .. ':action_log'

  -- Read all accumulated actions
  local foldActionLogRaw = redis.call('LRANGE', foldActionLogKey, 0, -1)
  local foldActionLog = {}
  for _, entry in ipairs(foldActionLogRaw) do
    table.insert(foldActionLog, cjson.decode(entry))
  end

  -- Build participants list from current players
  local foldParticipants = {}
  for i = 0, 9 do
    local pData = redis.call('HGET', playersKey, 'seat_' .. i)
    if pData and pData ~= false then
      local p = cjson.decode(pData)
      if p.status and p.status ~= "empty" and p.status ~= "sitting_out" and p.status ~= "waiting" then
        table.insert(foldParticipants, p)
      end
    end
  end

  -- Winner info for the stream
  local foldWinnerData = redis.call('HGET', playersKey, 'seat_' .. winningSeat)
  local foldWinner = foldWinnerData and cjson.decode(foldWinnerData) or {}
  local foldWinnerInfo = {{
    seat = winningSeat,
    amount = pot,
    type = "win",
    handDescription = "Fold Win"
  }}

  redis.call('XADD', 'stream:table:' .. foldTableId, '*',
    'event', 'hand_ended',
    'winners', cjson.encode(foldWinnerInfo),
    'pot', pot,
    'rake', 0,
    'communityCards', foldCommunityCards,
    'participants', cjson.encode(foldParticipants),
    'actionLog', cjson.encode(foldActionLog),
    'timestamp', redis.call('TIME')[1]
  )

  -- Clean up action log
  redis.call('DEL', foldActionLogKey)

  pot = 0
end

-- ============================================================
-- Check for Betting Round Complete
-- ============================================================

local nextStreet = false
local nextTurn = -1

if not handComplete then
  -- Find next active player
  nextTurn = getNextActiveSeat(actionSeat)
  
  -- SPECIAL CASE: All remaining players are all-in
  -- If no one can act but multiple players are in the hand, advance to showdown
  if activeCount == 0 and playersInHand >= 2 then
    nextStreet = true
    nextTurn = -1  -- No one to act
  else
    -- Check if betting round is complete
    -- (everyone has acted and bets are matched)
    local allMatched = true
    local actedCount = 0
    
    for i = 0, 9 do
      local pData = redis.call('HGET', playersKey, 'seat_' .. i)
      if pData and pData ~= false then
        local p = cjson.decode(pData)
        if p.status == "active" then
          if p.currentBet < currentBet then
            allMatched = false
            break
          end
        end
      end
    end
    
    -- The Barrier of Action: Check BOTH financial AND temporal conditions
    -- A betting round can ONLY end if:
    --   (1) Financial: All bets are equal
    --   (2) Temporal: All active players have acted in this round
    if allMatched then
      local playersActedCount = tonumber(redis.call('HGET', tableKey, 'playersActedCount') or 0)
      
      if playersActedCount >= activeCount then
        nextStreet = true
      end
    end
  end
  
  redis.call('HSET', tableKey, 'turnSeat', nextTurn)
end

-- ============================================================
-- UNCALLED BET REFUND
-- When the betting round closes, return excess from oversized bets.
-- Example: Player A all-in 2.2M, Player B calls 400K → 1.8M returns to A.
-- This runs BEFORE the response is built so Redis state is correct.
-- ============================================================

local uncalledBetRefund = nil

if nextStreet and not handComplete then
  local highestBet = 0
  local secondHighest = 0
  local highestSeat = -1

  for i = 0, 9 do
    local pData = redis.call('HGET', playersKey, 'seat_' .. i)
    if pData and pData ~= false then
      local p = cjson.decode(pData)
      if p.status == "active" or p.status == "all-in" then
        if p.currentBet > highestBet then
          secondHighest = highestBet
          highestBet = p.currentBet
          highestSeat = i
        elseif p.currentBet > secondHighest then
          secondHighest = p.currentBet
        end
      end
    end
  end

  local uncalled = highestBet - secondHighest
  if uncalled > 0 and highestSeat >= 0 then
    -- Atomic refund: chips back, pot reduced, contribution capped
    local pData = redis.call('HGET', playersKey, 'seat_' .. highestSeat)
    local p = cjson.decode(pData)
    p.chips = p.chips + uncalled
    p.currentBet = p.currentBet - uncalled
    p.totalContribution = math.max(0, (p.totalContribution or 0) - uncalled)
    pot = pot - uncalled
    redis.call('HSET', playersKey, 'seat_' .. highestSeat, cjson.encode(p))
    redis.call('HSET', tableKey, 'pot', pot)

    uncalledBetRefund = { seat = highestSeat, amount = uncalled }
  end
end

-- ============================================================
-- Build Response
-- ============================================================

local tableState = {
  id = redis.call('HGET', tableKey, 'id') or "",
  name = redis.call('HGET', tableKey, 'name') or "Table",
  phase = redis.call('HGET', tableKey, 'phase') or phase,
  pot = pot,
  currentBet = currentBet,
  lastRaiseSize = tonumber(redis.call('HGET', tableKey, 'lastRaiseSize') or 0),
  turnSeat = handComplete and -1 or nextTurn,
  dealerSeat = tonumber(redis.call('HGET', tableKey, 'dealerSeat') or 0),
  smallBlindSeat = tonumber(redis.call('HGET', tableKey, 'smallBlindSeat') or 0),
  bigBlindSeat = tonumber(redis.call('HGET', tableKey, 'bigBlindSeat') or 0),
  communityCards = cjson.decode(redis.call('HGET', tableKey, 'communityCards') or "[]"),
  smallBlind = tonumber(redis.call('HGET', tableKey, 'smallBlind') or 10),
  bigBlind = tonumber(redis.call('HGET', tableKey, 'bigBlind') or 20)
}

local players = {}
for i = 0, 9 do
  local pData = redis.call('HGET', playersKey, 'seat_' .. i)
  if pData and pData ~= false then
    table.insert(players, cjson.decode(pData))
  end
end

-- Accumulate action to Redis List (stateless action log)
local actionLogKey = 'table:' .. (tableState.id or "unknown") .. ':action_log'
local actionEntry = cjson.encode({
  street = phase,
  seat = actionSeat,
  player = player.username or ("Seat " .. actionSeat),
  action = actionType,
  amount = actionAmount,
  pot = pot
})
redis.call('RPUSH', actionLogKey, actionEntry)

-- Log event to stream
redis.call('XADD', 'stream:table:' .. (tableState.id or "unknown"), '*',
  'event', 'action',
  'seat', actionSeat,
  'action', actionType,
  'amount', actionAmount,
  'pot', pot,
  'timestamp', redis.call('TIME')[1]
)

-- Detect if all remaining players are all-in (for auto-advance)
local allPlayersAllIn = (not handComplete) and (activeCount == 0 and playersInHand >= 2)

return cjson.encode({
  success = true,
  message = actionType .. " successful",
  nextStreet = nextStreet,
  handComplete = handComplete,
  winningSeat = winningSeat,
  allPlayersAllIn = allPlayersAllIn,
  timeBankDeducted = timeBankDeducted,
  timeBankRemaining = timeBankRemaining,
  uncalledBetRefund = uncalledBetRefund,
  tableState = {
    table = tableState,
    players = players
  }
})
