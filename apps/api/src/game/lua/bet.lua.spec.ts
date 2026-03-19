/**
 * bet.lua — Lua Sandbox Unit Test
 *
 * Architecture §17.3: Every .lua script must have a corresponding .spec.ts
 * that spins up a disposable Redis instance via Testcontainers.
 *
 * This is the TEMPLATE for all future Lua tests.
 *
 * Pattern:
 *   1. Start a real Redis container (GenericContainer)
 *   2. Connect with ioredis
 *   3. Load the .lua file as raw text
 *   4. Execute via redis.eval (not evalsha — no LuaRunnerService needed)
 *   5. Assert Redis state after execution
 */

const { GenericContainer } = require('testcontainers');
const Redis = require('ioredis');
const { readFile } = require('fs/promises');
const { join } = require('path');

// ============================================================
// Test Configuration
// ============================================================

const REDIS_IMAGE = 'redis:7-alpine';
const TABLE_ID = '550e8400-e29b-41d4-a716-446655440000';
const TABLE_KEY = `table:${TABLE_ID}`;
const PLAYERS_KEY = `table:${TABLE_ID}:players`;
const CONFIG_KEY = `table:${TABLE_ID}:config`;
const LUA_DIR = join(__dirname);

// ============================================================
// Helper: Load Lua script from file
// ============================================================

async function loadLua(scriptName) {
    return readFile(join(LUA_DIR, `${scriptName}.lua`), 'utf-8');
}

// ============================================================
// Helper: Create a standard player JSON
// ============================================================

function makePlayer(overrides = {}) {
    return JSON.stringify({
        id: 'player-1',
        username: 'Alice',
        chips: 1000,
        status: 'active',
        cards: ['Ah', 'Kd'],
        currentBet: 0,
        totalContribution: 0,
        seatNumber: 0,
        avatarId: 'avatar_1',
        ...overrides,
    });
}

// ============================================================
// Test Suite
// ============================================================

describe('bet.lua (Sandbox)', () => {
    let container;
    let redis;
    let betScript;

    // ── Lifecycle: Start Redis Container ──
    beforeAll(async () => {
        container = await new GenericContainer(REDIS_IMAGE)
            .withExposedPorts(6379)
            .start();

        const host = container.getHost();
        const port = container.getMappedPort(6379);

        redis = new Redis({ host, port, maxRetriesPerRequest: 3 });
        betScript = await loadLua('bet');
    }, 60000); // 60s timeout for container startup

    afterAll(async () => {
        if (redis) await redis.quit();
        if (container) await container.stop();
    });

    // ── Reset Redis state between tests ──
    beforeEach(async () => {
        await redis.flushall();
    });

    // ── Helper: Seed a standard table state ──
    async function seedTable(overrides = {}) {
        const defaults = {
            id: TABLE_ID,
            name: 'Test Table',
            phase: 'preflop',
            pot: 0,
            currentBet: 20,
            turnSeat: 0,
            dealerSeat: 1,
            smallBlindSeat: 1,
            bigBlindSeat: 0,
            communityCards: '[]',
            smallBlind: 10,
            bigBlind: 20,
            playersActedCount: 0,
        };
        const tableData = { ...defaults, ...overrides };
        const args = [];
        for (const [k, v] of Object.entries(tableData)) {
            args.push(k, String(v));
        }
        await redis.hset(TABLE_KEY, ...args);
        // Seed config for variant checks
        await redis.hset(CONFIG_KEY, 'variant', 'TEXAS_HOLDEM', 'bettingLimit', 'NO_LIMIT');
    }

    // ── Helper: Run bet.lua ──
    async function runBet(seat, action, amount = 0) {
        const result = await redis.eval(
            betScript,
            2,
            TABLE_KEY,
            PLAYERS_KEY,
            String(seat),
            action,
            String(amount),
        );
        return JSON.parse(result);
    }

    // ============================================================
    // §17.1 Validation First
    // ============================================================

    describe('Validation', () => {
        it('should reject action if not player\'s turn', async () => {
            await seedTable({ turnSeat: 1 }); // Turn belongs to seat 1
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0 }));

            const result = await runBet(0, 'call');

            expect(result.success).toBe(false);
            expect(result.message).toContain('not your turn');
        });

        it('should reject action if player not found', async () => {
            await seedTable({ turnSeat: 5 });
            // No player at seat 5

            const result = await runBet(5, 'fold');

            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
        });

        it('should reject action if player is not active', async () => {
            await seedTable({ turnSeat: 0 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ status: 'folded' }));

            const result = await runBet(0, 'call');

            expect(result.success).toBe(false);
            expect(result.message).toContain('not active');
        });
    });

    // ============================================================
    // Core Actions — Atomicity Tests
    // ============================================================

    describe('Fold', () => {
        it('should set player status to folded and clear cards', async () => {
            await seedTable({ turnSeat: 0, pot: 100 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0 }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1,
            }));

            const result = await runBet(0, 'fold');

            expect(result.success).toBe(true);
            expect(result.message).toContain('fold');

            // Verify atomicity: player state updated
            const raw = await redis.hget(PLAYERS_KEY, 'seat_0');
            const player = JSON.parse(raw);
            expect(player.status).toBe('folded');
            // cjson encodes empty Lua tables as {} (object), not [] (array)
            // Both representations are valid "empty cards"
            const cards = Array.isArray(player.cards) ? player.cards : Object.keys(player.cards);
            expect(cards.length).toBe(0);
        });
    });

    describe('Call', () => {
        it('should atomically decrease user balance and increase pot', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 30 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                seatNumber: 0, chips: 1000, currentBet: 0,
            }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1, currentBet: 20,
            }));

            const result = await runBet(0, 'call');

            expect(result.success).toBe(true);

            // ── Atomicity Check ──
            // Player chips decreased by call amount (20)
            const raw = await redis.hget(PLAYERS_KEY, 'seat_0');
            const player = JSON.parse(raw);
            expect(player.chips).toBe(980);
            expect(player.currentBet).toBe(20);
            expect(player.totalContribution).toBe(20);

            // Pot increased by call amount (30 + 20 = 50)
            const pot = await redis.hget(TABLE_KEY, 'pot');
            expect(Number(pot)).toBe(50);
        });

        it('should go all-in if call amount exceeds balance', async () => {
            await seedTable({ turnSeat: 0, currentBet: 500, pot: 500 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                seatNumber: 0, chips: 100, currentBet: 0,
            }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1, currentBet: 500,
            }));

            const result = await runBet(0, 'call');

            expect(result.success).toBe(true);

            const raw = await redis.hget(PLAYERS_KEY, 'seat_0');
            const player = JSON.parse(raw);
            expect(player.chips).toBe(0);
            expect(player.status).toBe('all-in');
        });
    });

    describe('Check', () => {
        it('should allow check when no bet to call', async () => {
            await seedTable({ turnSeat: 0, currentBet: 0, pot: 30 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0 }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1,
            }));

            const result = await runBet(0, 'check');

            expect(result.success).toBe(true);

            // Chips unchanged
            const raw = await redis.hget(PLAYERS_KEY, 'seat_0');
            const player = JSON.parse(raw);
            expect(player.chips).toBe(1000);
        });

        it('should reject check when there is a bet to call', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 30 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                seatNumber: 0, currentBet: 0,
            }));

            const result = await runBet(0, 'check');

            expect(result.success).toBe(false);
            expect(result.message).toContain('Cannot check');
        });
    });

    describe('Raise', () => {
        it('should atomically decrease balance, increase pot, and update currentBet', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 30 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                seatNumber: 0, chips: 1000, currentBet: 0,
            }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1, currentBet: 20,
            }));

            const result = await runBet(0, 'raise', 40);

            expect(result.success).toBe(true);

            // Player chips: 1000 - 40 = 960
            const raw = await redis.hget(PLAYERS_KEY, 'seat_0');
            const player = JSON.parse(raw);
            expect(player.chips).toBe(960);
            expect(player.currentBet).toBe(40);

            // Pot: 30 + 40 = 70
            const pot = await redis.hget(TABLE_KEY, 'pot');
            expect(Number(pot)).toBe(70);

            // Table currentBet updated to 40
            const tableBet = await redis.hget(TABLE_KEY, 'currentBet');
            expect(Number(tableBet)).toBe(40);
        });

        it('should reject raise below minimum (2x current bet)', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 30 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                seatNumber: 0, chips: 1000, currentBet: 0,
            }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1,
            }));

            const result = await runBet(0, 'raise', 25); // Min is 40

            expect(result.success).toBe(false);
            expect(result.message).toContain('at least');
        });
    });

    describe('All-In', () => {
        it('should commit all chips and set status to all-in', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 30 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                seatNumber: 0, chips: 500, currentBet: 0,
            }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1, currentBet: 20,
            }));

            const result = await runBet(0, 'all-in');

            expect(result.success).toBe(true);

            const raw = await redis.hget(PLAYERS_KEY, 'seat_0');
            const player = JSON.parse(raw);
            expect(player.chips).toBe(0);
            expect(player.status).toBe('all-in');
            expect(player.currentBet).toBe(500);
            expect(player.totalContribution).toBe(500);

            // Pot updated
            const pot = await redis.hget(TABLE_KEY, 'pot');
            expect(Number(pot)).toBe(530); // 30 + 500
        });

        it('should refund uncalled bet when all-in exceeds opponent stack', async () => {
            // Scenario: Seat 0 has 2.2M, Seat 1 has 400K
            // Seat 1 goes all-in (400K), then Seat 0 goes all-in (2.2M)
            // Expected: pot = 800K, seat 0 refunded 1.8M

            // Step 1: Seat 1 goes all-in for 400K
            await seedTable({ turnSeat: 1, currentBet: 0, pot: 0, playersActedCount: 0 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                id: 'player-1', username: 'BigStack', seatNumber: 0,
                chips: 2200000, currentBet: 0, totalContribution: 0,
            }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'SmallStack', seatNumber: 1,
                chips: 400000, currentBet: 0, totalContribution: 0,
            }));

            const r1 = await runBet(1, 'all-in');
            expect(r1.success).toBe(true);

            // Verify seat 1 is all-in with 400K bet
            const s1Raw = await redis.hget(PLAYERS_KEY, 'seat_1');
            const s1 = JSON.parse(s1Raw);
            expect(s1.chips).toBe(0);
            expect(s1.status).toBe('all-in');
            expect(s1.currentBet).toBe(400000);

            // Step 2: Seat 0 goes all-in for 2.2M (but only 400K is callable)
            // Update turnSeat to seat 0 and currentBet to 400K (set by seat 1's all-in)
            await redis.hset(TABLE_KEY, 'turnSeat', '0');
            await redis.hset(TABLE_KEY, 'currentBet', '400000');
            // Reset acted count so the round can close (seat 1 acted, seat 0 about to)
            await redis.hset(TABLE_KEY, 'playersActedCount', '1');

            const r2 = await runBet(0, 'all-in');
            expect(r2.success).toBe(true);

            // The round should close (nextStreet or allPlayersAllIn)
            // Uncalled bet refund should fire
            expect(r2.uncalledBetRefund).toBeDefined();
            expect(r2.uncalledBetRefund.seat).toBe(0);
            expect(r2.uncalledBetRefund.amount).toBe(1800000);

            // Verify pot is capped at matched amount (400K + 400K = 800K)
            const pot = await redis.hget(TABLE_KEY, 'pot');
            expect(Number(pot)).toBe(800000);

            // Verify seat 0 got the 1.8M back
            const s0Raw = await redis.hget(PLAYERS_KEY, 'seat_0');
            const s0 = JSON.parse(s0Raw);
            expect(s0.chips).toBe(1800000);
            expect(s0.totalContribution).toBe(400000);
        });
    });

    // ============================================================
    // §17.2 Event Log (XADD)
    // ============================================================

    describe('Audit Trail (XADD)', () => {
        it('should emit an action event to the table stream', async () => {
            await seedTable({ turnSeat: 0, currentBet: 0, pot: 30 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0 }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1,
            }));

            await runBet(0, 'check');

            // Verify XADD wrote to the stream
            const streamKey = `stream:table:${TABLE_ID}`;
            const entries = await redis.xrange(streamKey, '-', '+');
            expect(entries.length).toBeGreaterThanOrEqual(1);

            // Parse the last entry
            const lastEntry = entries[entries.length - 1];
            const fields = {};
            for (let i = 0; i < lastEntry[1].length; i += 2) {
                fields[lastEntry[1][i]] = lastEntry[1][i + 1];
            }
            expect(fields.event).toBe('action');
            expect(fields.action).toBe('check');
            expect(fields.seat).toBe('0');
        });
    });

    // ============================================================
    // Game Flow
    // ============================================================

    describe('Round Completion', () => {
        it('should signal nextStreet when all players have acted', async () => {
            // Two players, seat 1 already bet 20. Seat 0 calls.
            // playersActedCount = 1 (seat 1 acted), after seat 0 acts it becomes 2 = activeCount
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 20, playersActedCount: 1 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({
                seatNumber: 0, chips: 1000, currentBet: 0,
            }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1, currentBet: 20,
            }));

            const result = await runBet(0, 'call');

            expect(result.success).toBe(true);
            expect(result.nextStreet).toBe(true);
        });

        it('should signal handComplete when all but one player folds', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 40 });
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0 }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1, currentBet: 20,
            }));

            const result = await runBet(0, 'fold');

            expect(result.success).toBe(true);
            expect(result.handComplete).toBe(true);
            expect(result.winningSeat).toBe(1);

            // Pot should be awarded and reset
            const pot = await redis.hget(TABLE_KEY, 'pot');
            expect(Number(pot)).toBe(0);

            // Winner gets the pot
            const raw = await redis.hget(PLAYERS_KEY, 'seat_1');
            const winner = JSON.parse(raw);
            expect(winner.chips).toBe(1040); // 1000 + 40
        });
    });

    // ============================================================
    // Variant: All-In or Fold (AoF)
    // ============================================================

    describe('All-In or Fold Mode', () => {
        beforeEach(async () => {
            await redis.hset(CONFIG_KEY, 'variant', 'ALL_IN_OR_FOLD');
        });

        it('should reject check in AoF mode', async () => {
            await seedTable({ turnSeat: 0, currentBet: 0, pot: 30 });
            await redis.hset(CONFIG_KEY, 'variant', 'ALL_IN_OR_FOLD');
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0 }));

            const result = await runBet(0, 'check');

            expect(result.success).toBe(false);
            expect(result.message).toContain('All-In or Fold');
        });

        it('should reject call in AoF mode', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 30 });
            await redis.hset(CONFIG_KEY, 'variant', 'ALL_IN_OR_FOLD');
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0, currentBet: 0 }));

            const result = await runBet(0, 'call');

            expect(result.success).toBe(false);
            expect(result.message).toContain('All-In or Fold');
        });

        it('should allow fold in AoF mode', async () => {
            await seedTable({ turnSeat: 0, currentBet: 20, pot: 30 });
            await redis.hset(CONFIG_KEY, 'variant', 'ALL_IN_OR_FOLD');
            await redis.hset(PLAYERS_KEY, 'seat_0', makePlayer({ seatNumber: 0 }));
            await redis.hset(PLAYERS_KEY, 'seat_1', makePlayer({
                id: 'player-2', username: 'Bob', seatNumber: 1,
            }));

            const result = await runBet(0, 'fold');

            expect(result.success).toBe(true);
        });
    });
});
