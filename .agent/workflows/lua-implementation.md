---
description: How to implement the core poker Lua scripts for the Red Cable
---

# Red Cable Lua Implementation Workflow

This workflow guides the implementation of atomic Lua scripts for the poker game engine.
**Prerequisite**: GameGateway and LuaRunnerService must be running (verified via Docker logs).

// turbo-all

## Step 1: The Gatekeeper (join_table.lua)

Create `apps/api/src/game/lua/join_table.lua`:

**Inputs:**
- `KEYS[1]` = `table:{id}`
- `KEYS[2]` = `user:{id}:balance`
- `ARGV[1]` = seat number
- `ARGV[2]` = buyInAmount
- `ARGV[3]` = playerJson (serialized player data)

**Logic:**
1. Check if the seat is occupied in `table:{id}:players`
2. Check if user has enough balance in `user:{id}:balance`
3. ATOMICALLY: Decrement user balance, HSET the player data, record buy-in
4. Check if `active_players >= 2`. If yes, set `trigger_start: true` in response
5. Return the full updated table state (JSON)

---

## Step 2: The Dealer (next_hand.lua)

Create `apps/api/src/game/lua/next_hand.lua`:

**Inputs:**
- `KEYS[1]` = `table:{id}`
- `ARGV[1]` = shuffled deck array (from Node.js cryptoShuffle)

**Logic:**
1. Rotate `dealerSeat` to the next active player (clockwise)
2. Post Small Blind and Big Blind (deduct chips, update pot)
3. Deal 2 cards to every active player (update `table:{id}:players`)
4. Set `state` to `'preflop'`
5. Set `turnSeat` to the player after Big Blind
6. Store remaining deck in `table:{id}:deck`

---

## Step 3: The Action (bet.lua)

Create `apps/api/src/game/lua/bet.lua`:

**Inputs:**
- `KEYS[1]` = `table:{id}`
- `ARGV[1]` = seat number
- `ARGV[2]` = amount
- `ARGV[3]` = actionType (`'call'` | `'raise'` | `'check'`)

**Logic:**
1. Assert it is currently `ARGV[1]`'s turn
2. Validate the bet amount (must >= current call amount)
3. Deduct chips from player, add to pot
4. Move `turnSeat` to the next active player
5. If all players have acted, return `next_street: true`

---

## Step 4: Wiring It Up (NestJS)

Update `apps/api/src/game/game.gateway.ts`:

1. In `handleJoinTable`:
   - Call `LuaRunnerService.runScript('join_table', [tableKey, userBalanceKey], [seat, buyIn, playerJson])`
   - Parse the result
   
2. If result contains `trigger_start: true`:
   - Import `createShuffledDeck` from `@poker/shared`
   - Generate deck: `const deck = createShuffledDeck()`
   - Call `runScript('next_hand', [tableKey], [JSON.stringify(deck)])`
   
3. Broadcast the new table state to all connected clients:
   - `this.broadcastTableState(tableId, result.tableState)`

---

## Verification

After implementing all scripts, test the flow:

1. Connect two clients to the socket
2. Have both join the same table with sufficient buy-in
3. Verify that `next_hand.lua` triggers automatically
4. Check Redis for correct state: `docker exec poker_redis redis-cli HGETALL table:{id}`
