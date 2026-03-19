import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

describe('Lua Integration Tests (The Iron Foundation)', () => {
    let container: StartedTestContainer;
    let redis: Redis;
    const scripts: Record<string, string> = {};

    beforeAll(async () => {
        // Spin up ephemeral Redis container
        container = await new GenericContainer('redis:7-alpine')
            .withExposedPorts(6379)
            .start();

        redis = new Redis({
            host: container.getHost(),
            port: container.getMappedPort(6379),
        });

        // Load all Lua scripts
        const scriptsDir = join(__dirname, '../src/game/lua');
        const files = await readdir(scriptsDir);
        for (const file of files) {
            if (file.endsWith('.lua')) {
                const name = file.replace('.lua', '');
                scripts[name] = await readFile(join(scriptsDir, file), 'utf-8');
            }
        }
    }, 60000); // Higher timeout for container start

    afterAll(async () => {
        if (redis) await redis.quit();
        if (container) await container.stop();
    });

    const runLua = async (name: string, keys: string[], args: any[]) => {
        return redis.eval(scripts[name], keys.length, ...keys, ...args.map(String));
    };

    describe('bet.lua & totalContribution', () => {
        const tableId = 'test-table';
        const tableKey = `table:${tableId}`;
        const playersKey = `${tableKey}:players`;

        beforeEach(async () => {
            await redis.flushall();

            // Setup table
            await redis.hset(tableKey, {
                id: tableId,
                turnSeat: 0,
                currentBet: 0,
                pot: 0,
                phase: 'preflop'
            });

            // Setup players
            const player0 = { id: 'user-0', username: 'Player0', chips: 1000, status: 'active', currentBet: 0, totalContribution: 0 };
            const player1 = { id: 'user-1', username: 'Player1', chips: 1000, status: 'active', currentBet: 0, totalContribution: 0 };

            await redis.hset(playersKey, 'seat_0', JSON.stringify(player0));
            await redis.hset(playersKey, 'seat_1', JSON.stringify(player1));
        });

        it('should atomically increment totalContribution on call', async () => {
            await redis.hset(tableKey, 'currentBet', 100);
            const result = await runLua('bet', [tableKey, playersKey], [0, 'call', 0]);
            expect(JSON.parse(result as string).success).toBe(true);

            const player0 = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            expect(player0.totalContribution).toBe(100);
        });
    });

    describe('Scenario 1: 3-Player All-In & Side Pot Bifurcation', () => {
        const tableId = 'scenario-1-table';
        const tableKey = `table:${tableId}`;
        const playersKey = `${tableKey}:players`;

        it('should distribute main pot to A and side pot/excess to B when C folds', async () => {
            await redis.flushall();

            // Setup Table
            await redis.hset(tableKey, { id: tableId, turnSeat: 0, currentBet: 0, pot: 0, phase: 'preflop' });

            // Player A (Seat 0): 100 chips (Hero)
            // Player B (Seat 1): 500 chips (Villain 1)
            // Player C (Seat 2): 1000 chips (Villain 2 - Folds)
            const pA = { seatNumber: 0, username: 'A', chips: 100, status: 'active', currentBet: 0, totalContribution: 0 };
            const pB = { seatNumber: 1, username: 'B', chips: 500, status: 'active', currentBet: 0, totalContribution: 0 };
            const pC = { seatNumber: 2, username: 'C', chips: 1000, status: 'active', currentBet: 0, totalContribution: 0 };

            await redis.hset(playersKey, 'seat_0', JSON.stringify(pA));
            await redis.hset(playersKey, 'seat_1', JSON.stringify(pB));
            await redis.hset(playersKey, 'seat_2', JSON.stringify(pC));

            // ROUND 1: C bets 100, A calls (All-in), B calls
            // (Simplified sequence for totalContribution testing)

            // C bets 100
            await redis.hset(tableKey, 'turnSeat', 2);
            await runLua('bet', [tableKey, playersKey], [2, 'raise', 100]);

            // A calls 100 (All-in)
            await redis.hset(tableKey, 'turnSeat', 0);
            await runLua('bet', [tableKey, playersKey], [0, 'call', 0]);

            // B calls 100
            await redis.hset(tableKey, 'turnSeat', 1);
            await runLua('bet', [tableKey, playersKey], [1, 'call', 0]);

            // ROUND 2: C bets 400, B calls (All-in)

            // C bets 400
            await redis.hset(tableKey, 'turnSeat', 2);
            await runLua('bet', [tableKey, playersKey], [2, 'raise', 500]);

            // B calls 400 (All-in)
            await redis.hset(tableKey, 'turnSeat', 1);
            await runLua('bet', [tableKey, playersKey], [1, 'call', 0]);

            // ROUND 3: C Folds (Final pot is 1100: A(100) + B(500) + C(500))
            // Actually, in our scenario: A=100, B=500, C contributed 500 but folds.
            // Main Pot (Level 100): 100*3 = 300. Eligible: A, B.
            // Side Pot (Level 500): (500-100)*2 = 800. Eligible: B only.

            const pA_state = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            const pB_state = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);
            const pC_state = JSON.parse((await redis.hget(playersKey, 'seat_2'))!);

            expect(pA_state.totalContribution).toBe(100);
            expect(pB_state.totalContribution).toBe(500);
            expect(pC_state.totalContribution).toBe(500);

            // Simulate the "Brain" (HandEvaluatorService) calculating the plan:
            // A wins the main pot (Level 100 slice)
            // B wins/reclaims the side pot (Level 500 slice)
            const distributionPlan = [
                { seat: 0, amount: 300, type: 'win' },    // A wins the main pot
                { seat: 1, amount: 800, type: 'return' } // B reclaims/wins the side pot
            ];

            const showdownResult = await runLua('showdown', [tableKey, playersKey], [JSON.stringify(distributionPlan)]);
            const response = JSON.parse(showdownResult as string);

            expect(response.success).toBe(true);

            // Final Chips:
            // A: 300 (won)
            // B: 800 (won/returned)
            // C: 500 (remaining from 1000 - 500 contributed)
            const pA_after = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            const pB_after = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);
            const pC_after = JSON.parse((await redis.hget(playersKey, 'seat_2'))!);

            expect(pA_after.chips).toBe(300);
            expect(pB_after.chips).toBe(800);
            expect(pC_after.chips).toBe(500);

            expect(parseInt(await redis.hget(tableKey, 'pot') || '0')).toBe(0);
        });
    });
});
