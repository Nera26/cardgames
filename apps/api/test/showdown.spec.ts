import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('showdown.lua: Side Pots & Rake Audit', () => {
    let container: StartedTestContainer;
    let redis: Redis;
    let showdownScript: string;

    const tableId = 'audit-table';
    const tableKey = `table:${tableId}`;
    const playersKey = `${tableKey}:players`;

    beforeAll(async () => {
        container = await new GenericContainer('redis:7-alpine')
            .withExposedPorts(6379)
            .start();

        redis = new Redis({
            host: container.getHost(),
            port: container.getMappedPort(6379),
        });

        const scriptsDir = join(__dirname, '../src/game/lua');
        showdownScript = await readFile(join(scriptsDir, 'showdown.lua'), 'utf-8');
    }, 60000);

    afterAll(async () => {
        if (redis) await redis.quit();
        if (container) await container.stop();
    });

    beforeEach(async () => {
        await redis.flushall();
    });

    const runShowdown = async (scores: any[], rakePercent: number, rakeCap: number) => {
        return redis.eval(
            showdownScript,
            2,
            tableKey,
            playersKey,
            JSON.stringify(scores),
            rakePercent.toString(),
            rakeCap.toString()
        );
    };

    it('Scenario: 3 Players All-In (Slicing & Rake)', async () => {
        /**
         * SETUP:
         * Player A (Seat 0): 10000 contribution ($100), Score 9000 (Best)
         * Player B (Seat 1): 5000 contribution ($50), Score 5000 (Mid)
         * Player C (Seat 2): 2500 contribution ($25), Score 9000 (Best - Tie with A)
         * Total Pot: Gross 17500 ($175)
         */

        await redis.hset(tableKey, {
            id: tableId,
            pot: 17500,
            phase: 'river'
        });

        const pA = { seatNumber: 0, status: 'all-in', chips: 0, totalContribution: 10000 };
        const pB = { seatNumber: 1, status: 'all-in', chips: 0, totalContribution: 5000 };
        const pC = { seatNumber: 2, status: 'all-in', chips: 0, totalContribution: 2500 };

        await redis.hset(playersKey, 'seat_0', JSON.stringify(pA));
        await redis.hset(playersKey, 'seat_1', JSON.stringify(pB));
        await redis.hset(playersKey, 'seat_2', JSON.stringify(pC));

        const scores = [
            { seat: 0, score: 9000 },
            { seat: 1, score: 5000 },
            { seat: 2, score: 9000 }
        ];

        // Rake 5%, Cap $5 (500)
        const result = await runShowdown(scores, 0.05, 500);
        const response = JSON.parse(result as string);

        expect(response.success).toBe(true);

        /**
         * EXPECTED MATH:
         * 1. Rake = Gross 17500 * 0.05 = 875 -> Capped at $5 (500)
         * 2. Net Pot = 17500 - 500 = 17000
         * 3. Slices (Gross):
         *    Slice 1 (0-2500): 2500 * 3 = 7500. Eligible: A, B, C. Winners: A, C.
         *    Slice 2 (2500-5000): 2500 * 2 = 5000. Eligible: A, B. Winner: A.
         *    Slice 3 (5000-10000): 5000 * 1 = 5000. Eligible: A only. Result: Returned to A.
         * 
         * 4. Rake distribution (Weighted by slice size):
         *    Net Proportion: 17000/17500 = 0.971428...
         *    Slice 1 (Net): 7500 * 0.9714... = 7285.71 -> 7285 (integer floor)
         *    Slice 2 (Net): 5000 * 0.9714... = 4857.14 -> 4857
         *    Slice 3 (Net): 5000 * 0.9714... = 4857.14 -> 4857
         * 
         * 5. Player final chips:
         *    Player C (Slice 1 split): 7285 / 2 = 3642
         *    Player B: 0 (Lost)
         *    Player A (Slice 1 split + Slice 2 + Slice 3): (7285-3642) + 4857 + 4857 = 3643 + 4857 + 4857 = 13357
         * 
         * Total check: 3642 + 13357 + 500 (rake) = 17499 (Rounding/Integer loss of 1 unit expected)
         */

        expect(response.totalRake).toBe(500);

        const pA_after = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
        const pB_after = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);
        const pC_after = JSON.parse((await redis.hget(playersKey, 'seat_2'))!);

        expect(pC_after.chips).toBeGreaterThan(3600);
        expect(pB_after.chips).toBe(0);
        expect(pA_after.chips).toBeGreaterThan(13000);

        const houseRake = parseInt(await redis.get('house:rake') || '0');
        expect(houseRake).toBe(500);
    });
});
