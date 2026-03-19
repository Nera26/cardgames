import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('timeout.lua: Lifeline Logic & Capped Drip', () => {
    let container: StartedTestContainer;
    let redis: Redis;
    const tableId = 'test-table-timer';
    const tableKey = `table:${tableId}`;
    const playersKey = `table:${tableId}:players`;
    const deckKey = `table:${tableId}:deck`;

    beforeAll(async () => {
        container = await new GenericContainer('redis:7-alpine')
            .withExposedPorts(6379)
            .start();

        redis = new Redis({
            host: container.getHost(),
            port: container.getMappedPort(6379),
        });
    }, 60000);

    afterAll(async () => {
        if (redis) await redis.quit();
        if (container) await container.stop();
    });

    const runScript = async (name: string, keys: string[], args: any[]) => {
        const scriptPath = path.join(__dirname, '../src/game/lua', `${name}.lua`);
        const script = await fs.readFile(scriptPath, 'utf8');
        return redis.eval(script, keys.length, ...keys, ...args);
    };

    it('Scenario: Economics & Lifeline Flow', async () => {
        // 1. Setup Table
        await redis.hset(tableKey, {
            id: tableId,
            phase: 'preflop',
            turnSeat: 0,
            pot: 100,
            currentBet: 20,
            smallBlind: 10,
            bigBlind: 20,
            dealerSeat: 2
        });

        // 2. Initialize Player (Step 1: join_table logic)
        // Bank starts at 30s
        const pA = { id: 'u1', username: 'p1', seatNumber: 0, status: 'active', chips: 1000, currentBet: 0, time_bank: 30 };
        await redis.hset(playersKey, 'seat_0', JSON.stringify(pA));

        // 3. Hand 1 Ends (Step 3: next_hand logic simulation)
        // We simulate the accrual by running a simplified part of next_hand or just calling it
        // For this test, we'll manually verify the script logic in next_hand.lua
        const deck = JSON.stringify(['As', 'Ks', 'Qs', 'Js', 'Ts', '9s', '8s', '7s']);
        await runScript('next_hand', [tableKey, playersKey, deckKey], [deck]);

        let pA_after = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
        // Bank should be 30 + 2 = 32s
        expect(pA_after.time_bank).toBe(32);

        // 4. Timeout Trigger 1: The First Lifeline (Step 2: timeout logic)
        // Reset turn to 0 for the test
        await redis.hset(tableKey, { turnSeat: 0, phase: 'preflop' });

        const result1 = await runScript('timeout', [tableKey, playersKey], [0]);
        const res1 = JSON.parse(result1 as string);

        expect(res1.action).toBe('extended');
        expect(res1.added).toBe(30);
        expect(res1.remaining).toBe(2); // 32 - 30

        pA_after = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
        expect(pA_after.time_bank).toBe(2);
        expect(pA_after.status).toBe('active'); // Still active

        // 5. Timeout Trigger 2: Depleted Bank -> Fold
        const result2 = await runScript('timeout', [tableKey, playersKey], [0]);
        const res2 = JSON.parse(result2 as string);

        expect(res2.action).toBe('folded');

        pA_after = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
        expect(pA_after.status).toBe('folded');
        expect(pA_after.time_bank).toBe(2); // Remains at 2
    });

    it('Scenario: Disconnect Protection (Step 4: leave_table logic)', async () => {
        // Setup Player
        const pB = { id: 'u2', username: 'p2', seatNumber: 1, status: 'active', chips: 1000, currentBet: 0, time_bank: 30 };
        await redis.hset(playersKey, 'seat_1', JSON.stringify(pB));

        // Call leave_table with is_disconnect=true
        const result = await runScript('leave_table', [tableKey, playersKey, 'user:u2:balance'], [1, 'u2', 'true']);
        const res = JSON.parse(result as string);

        expect(res.isDisconnected).toBe(true);

        const pB_after = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);
        expect(pB_after.status).toBe('disconnected');
        // Seat should NOT be deleted
        expect(pB_after).toBeDefined();
    });
});
