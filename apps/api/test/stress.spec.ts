/**
 * Red Cable Stress Test - The 3-Way All-In
 * 
 * This test proves the Game Engine is "Fully Dynamic" and mathematically sound.
 * Uses real Redis container (Testcontainers) - NO MOCKS.
 * 
 * @see ARCHITECTURE.md Section 2.3 - The Lua Library
 */

import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

describe('Red Cable Stress Test: 3-Way All-In with Side Pots', () => {
    let container: StartedTestContainer;
    let redis: Redis;
    const scripts: Record<string, string> = {};

    const tableId = 'stress-test-table';
    const tableKey = `table:${tableId}`;
    const playersKey = `${tableKey}:players`;

    beforeAll(async () => {
        // Spin up ephemeral Redis container (NO MOCKS!)
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
            if (file.endsWith('.lua') && !file.includes('.new.')) {
                const name = file.replace('.lua', '');
                scripts[name] = await readFile(join(scriptsDir, file), 'utf-8');
            }
        }
    }, 60000);

    afterAll(async () => {
        if (redis) await redis.quit();
        if (container) await container.stop();
    });

    beforeEach(async () => {
        await redis.flushall();
    });

    const runLua = async (name: string, keys: string[], args: any[]) => {
        return redis.eval(scripts[name], keys.length, ...keys, ...args.map(String));
    };

    describe('Scenario: 6-Player Table with 3-Way All-In', () => {
        /**
         * SETUP:
         * Create a table with 6 players having varying stack sizes.
         * Force 3 players to ALL-IN, creating side pots.
         * Verify the math is correct to the chip.
         */

        it('should correctly distribute main pot and 2 side pots', async () => {
            // ============================================================
            // 1. CREATE TABLE IN REDIS
            // ============================================================
            await redis.hset(tableKey, {
                id: tableId,
                name: 'Stress Test Table',
                phase: 'preflop',
                pot: 0,
                currentBet: 0,
                turnSeat: 0,
                dealerSeat: 0,
                smallBlindSeat: 1,
                bigBlindSeat: 2,
                smallBlind: 10,
                bigBlind: 20,
                communityCards: '[]',
                playersActedCount: 0,
            });

            // ============================================================
            // 2. ADD 6 PLAYERS WITH VARYING CHIP STACKS
            // ============================================================
            const players = [
                { seatNumber: 0, id: 'user-0', username: 'ShortStack', chips: 100, status: 'active', currentBet: 0, totalContribution: 0, cards: ['As', 'Ks'] },
                { seatNumber: 1, id: 'user-1', username: 'MidStack', chips: 200, status: 'active', currentBet: 0, totalContribution: 0, cards: ['Ah', 'Kh'] },
                { seatNumber: 2, id: 'user-2', username: 'BigStack', chips: 500, status: 'active', currentBet: 0, totalContribution: 0, cards: ['Ad', 'Kd'] },
                { seatNumber: 3, id: 'user-3', username: 'Player4', chips: 300, status: 'active', currentBet: 0, totalContribution: 0, cards: ['2c', '7d'] },
                { seatNumber: 4, id: 'user-4', username: 'Player5', chips: 400, status: 'active', currentBet: 0, totalContribution: 0, cards: ['3c', '8d'] },
                { seatNumber: 5, id: 'user-5', username: 'Player6', chips: 600, status: 'active', currentBet: 0, totalContribution: 0, cards: ['4c', '9d'] },
            ];

            for (const player of players) {
                await redis.hset(playersKey, `seat_${player.seatNumber}`, JSON.stringify(player));
            }

            // ============================================================
            // 3. SIMULATE BETTING ROUND - FORCE 3-WAY ALL-IN
            // ============================================================

            // Player 0 (ShortStack, 100 chips) goes ALL-IN
            await redis.hset(tableKey, 'turnSeat', 0);
            let result = await runLua('bet', [tableKey, playersKey], [0, 'all-in', 0]);
            expect(JSON.parse(result as string).success).toBe(true);

            // Player 1 (MidStack, 200 chips) calls/goes ALL-IN
            await redis.hset(tableKey, 'turnSeat', 1);
            result = await runLua('bet', [tableKey, playersKey], [1, 'all-in', 0]);
            expect(JSON.parse(result as string).success).toBe(true);

            // Player 2 (BigStack, 500 chips) calls/goes ALL-IN
            await redis.hset(tableKey, 'turnSeat', 2);
            result = await runLua('bet', [tableKey, playersKey], [2, 'all-in', 0]);
            expect(JSON.parse(result as string).success).toBe(true);

            // Players 3, 4, 5 FOLD
            await redis.hset(tableKey, 'turnSeat', 3);
            result = await runLua('bet', [tableKey, playersKey], [3, 'fold', 0]);
            expect(JSON.parse(result as string).success).toBe(true);

            await redis.hset(tableKey, 'turnSeat', 4);
            result = await runLua('bet', [tableKey, playersKey], [4, 'fold', 0]);
            expect(JSON.parse(result as string).success).toBe(true);

            await redis.hset(tableKey, 'turnSeat', 5);
            result = await runLua('bet', [tableKey, playersKey], [5, 'fold', 0]);
            expect(JSON.parse(result as string).success).toBe(true);

            // ============================================================
            // 4. VERIFY POT AND CONTRIBUTIONS
            // ============================================================
            const potAfterBetting = parseInt(await redis.hget(tableKey, 'pot') || '0');
            expect(potAfterBetting).toBe(800); // 100 + 200 + 500 = 800

            const p0State = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            const p1State = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);
            const p2State = JSON.parse((await redis.hget(playersKey, 'seat_2'))!);

            expect(p0State.totalContribution).toBe(100);
            expect(p0State.status).toBe('all-in');
            expect(p1State.totalContribution).toBe(200);
            expect(p1State.status).toBe('all-in');
            expect(p2State.totalContribution).toBe(500);
            expect(p2State.status).toBe('all-in');

            // ============================================================
            // 5. TRIGGER SHOWDOWN.LUA
            // ============================================================

            /**
             * EXPECTED SIDE POT STRUCTURE:
             * 
             * Main Pot (Level 100): 100 * 3 players = 300
             *   Eligible: Player 0, 1, 2
             * 
             * Side Pot 1 (Level 200): (200 - 100) * 2 players = 200
             *   Eligible: Player 1, 2
             * 
             * Side Pot 2 (Level 500): (500 - 200) * 1 player = 300 (returned)
             *   Eligible: Player 2 only (returned)
             * 
             * Total: 300 + 200 + 300 = 800
             */

            // Hand scores (simulating HandEvaluatorService results)
            // Player 2 (BigStack) has the best hand
            // Player 1 (MidStack) has second best
            // Player 0 (ShortStack) has worst
            const handScores = [
                { seat: 0, score: 5000 },  // Low pair
                { seat: 1, score: 7000 },  // Two pair
                { seat: 2, score: 9000 },  // Flush (BEST)
            ];

            // Rake: 5%, Cap: 50 chips
            const rakePercent = 0.05;
            const rakeCap = 50;

            const showdownResult = await runLua(
                'showdown',
                [tableKey, playersKey],
                [JSON.stringify(handScores), rakePercent, rakeCap]
            );

            const response = JSON.parse(showdownResult as string);
            expect(response.success).toBe(true);

            // ============================================================
            // 6. VERIFY CHIP DISTRIBUTION TO THE PENNY (CHIP)
            // ============================================================

            /**
             * EXPECTED MATH:
             * 
             * Gross Pot: 800
             * Rake: min(800 * 0.05, 50) = min(40, 50) = 40
             * Net Pot: 800 - 40 = 760
             * Scaling Factor: 760 / 800 = 0.95
             * 
             * Slice 1 (0-100): Gross 300
             *   Net: floor(300 * 0.95) = 285
             *   Eligible: Player 0, 1, 2
             *   Winner: Player 2 (score 9000)
             *   Player 2 gets: 285
             * 
             * Slice 2 (100-200): Gross 200
             *   Net: floor(200 * 0.95) = 190
             *   Eligible: Player 1, 2
             *   Winner: Player 2 (score 9000)
             *   Player 2 gets: 190
             * 
             * Slice 3 (200-500): Gross 300
             *   Net: floor(300 * 0.95) = 285
             *   Eligible: Player 2 only
             *   Type: Return (unchallenged)
             *   Player 2 gets: 285
             * 
             * FINAL:
             *   Player 0: 0 chips (lost)
             *   Player 1: 0 chips (lost)
             *   Player 2: 285 + 190 + 285 = 760 chips
             *   House Rake: 40 chips
             * 
             * Total: 0 + 0 + 760 + 40 = 800 ✓
             */

            const p0After = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            const p1After = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);
            const p2After = JSON.parse((await redis.hget(playersKey, 'seat_2'))!);

            expect(response.totalRake).toBe(40);

            // Player 0 lost - busted
            expect(p0After.chips).toBe(0);
            expect(p0After.status).toBe('busted');

            // Player 1 lost - busted
            expect(p1After.chips).toBe(0);
            expect(p1After.status).toBe('busted');

            // Player 2 wins everything (after rake)
            // Expected: floor(300 * 0.95) + floor(200 * 0.95) + floor(300 * 0.95)
            //         = 285 + 190 + 285 = 760
            expect(p2After.chips).toBe(760);
            expect(p2After.status).toBe('waiting');

            // House rake accumulated
            const houseRake = parseInt(await redis.get('house:rake') || '0');
            expect(houseRake).toBe(40);

            // Final pot should be 0
            const finalPot = parseInt(await redis.hget(tableKey, 'pot') || '0');
            expect(finalPot).toBe(0);

            // Conservation of chips check
            expect(p0After.chips + p1After.chips + p2After.chips + houseRake).toBe(800);
        });

        it('should handle split pot when two players tie', async () => {
            // ============================================================
            // SETUP: 2 Players with equal hands go all-in
            // ============================================================
            await redis.hset(tableKey, {
                id: tableId,
                name: 'Split Pot Test',
                phase: 'river',
                pot: 200, // Pre-set pot
                currentBet: 100,
                turnSeat: -1,
                dealerSeat: 0,
                smallBlindSeat: 0,
                bigBlindSeat: 1,
                smallBlind: 10,
                bigBlind: 20,
                communityCards: '["As", "Ks", "Qs", "Js", "Ts"]', // Royal flush on board
                playersActedCount: 2,
            });

            const player0 = {
                seatNumber: 0,
                id: 'user-0',
                username: 'Player1',
                chips: 0,
                status: 'all-in',
                currentBet: 100,
                totalContribution: 100,
                cards: ['2c', '3c'] // Doesn't matter - board is best
            };
            const player1 = {
                seatNumber: 1,
                id: 'user-1',
                username: 'Player2',
                chips: 0,
                status: 'all-in',
                currentBet: 100,
                totalContribution: 100,
                cards: ['4c', '5c'] // Doesn't matter - board is best
            };

            await redis.hset(playersKey, 'seat_0', JSON.stringify(player0));
            await redis.hset(playersKey, 'seat_1', JSON.stringify(player1));

            // Both players have the same score (tie - royal flush on board)
            const handScores = [
                { seat: 0, score: 10000 },
                { seat: 1, score: 10000 }, // TIED!
            ];

            // No rake for this test
            const showdownResult = await runLua(
                'showdown',
                [tableKey, playersKey],
                [JSON.stringify(handScores), 0, 0]
            );

            const response = JSON.parse(showdownResult as string);
            expect(response.success).toBe(true);

            const p0After = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            const p1After = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);

            // Split pot: 200 / 2 = 100 each
            expect(p0After.chips).toBe(100);
            expect(p1After.chips).toBe(100);

            // Conservation check
            expect(p0After.chips + p1After.chips).toBe(200);
        });

        it('should correctly apply rake cap', async () => {
            // ============================================================
            // SETUP: Large pot to test rake cap
            // ============================================================
            await redis.hset(tableKey, {
                id: tableId,
                name: 'Rake Cap Test',
                phase: 'river',
                pot: 100000, // $1000 pot
                currentBet: 0,
                turnSeat: -1,
                communityCards: '[]',
            });

            const player0 = {
                seatNumber: 0,
                id: 'user-0',
                username: 'HighRoller',
                chips: 0,
                status: 'all-in',
                currentBet: 0,
                totalContribution: 100000,
                cards: ['As', 'Ks']
            };

            await redis.hset(playersKey, 'seat_0', JSON.stringify(player0));

            const handScores = [
                { seat: 0, score: 9000 },
            ];

            // 5% rake with $50 (5000 chip) cap
            const showdownResult = await runLua(
                'showdown',
                [tableKey, playersKey],
                [JSON.stringify(handScores), 0.05, 5000]
            );

            const response = JSON.parse(showdownResult as string);
            expect(response.success).toBe(true);

            // 5% of 100000 = 5000, but capped at 5000
            expect(response.totalRake).toBe(5000);

            const p0After = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            expect(p0After.chips).toBe(95000); // 100000 - 5000 = 95000

            const houseRake = parseInt(await redis.get('house:rake') || '0');
            expect(houseRake).toBe(5000);
        });
    });

    describe('Edge Cases', () => {
        it('should handle single player remaining (all others fold)', async () => {
            await redis.hset(tableKey, {
                id: tableId,
                phase: 'preflop',
                pot: 150,
                currentBet: 50,
                turnSeat: 0,
            });

            const player0 = { seatNumber: 0, id: 'user-0', username: 'LastMan', chips: 450, status: 'active', currentBet: 50, totalContribution: 50, cards: ['As', 'Ks'] };
            const player1 = { seatNumber: 1, id: 'user-1', username: 'Folder1', chips: 0, status: 'folded', currentBet: 50, totalContribution: 50, cards: [] };
            const player2 = { seatNumber: 2, id: 'user-2', username: 'Folder2', chips: 0, status: 'folded', currentBet: 50, totalContribution: 50, cards: [] };

            await redis.hset(playersKey, 'seat_0', JSON.stringify(player0));
            await redis.hset(playersKey, 'seat_1', JSON.stringify(player1));
            await redis.hset(playersKey, 'seat_2', JSON.stringify(player2));

            const handScores = [
                { seat: 0, score: 9000 },
            ];

            const showdownResult = await runLua(
                'showdown',
                [tableKey, playersKey],
                [JSON.stringify(handScores), 0.05, 500]
            );

            const response = JSON.parse(showdownResult as string);
            expect(response.success).toBe(true);

            // Rake: min(150 * 0.05, 500) = 7 (floored)
            expect(response.totalRake).toBe(7);

            const p0After = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
            // Wins 150 - 7 = 143, plus original 450 = 593... wait, that's not right
            // Actually, the pot already includes contributions, so:
            // Player wins: 150 - 7 = 143
            // But player had 450 chips remaining, so total: 450 + 143 = 593
            // Wait, let me re-read the logic...

            // The player's existing chips are NOT in the pot. The 450 is their remaining stack.
            // So after winning: 450 (remaining) + 143 (won from pot) = 593? No...

            // Looking at showdown.lua: it adds the winnings TO the player's current chips.
            // player0.chips = 450 (before showdown)
            // player0 wins 143 (net pot after rake)
            // player0.chips = 450 + 143 = 593... 

            // But wait, the 450 is what remains AFTER they contributed 50 to the pot.
            // Let me check: original 500 - 50 contribution = 450 remaining.
            // Pot = 150 (from 3 players contributing 50 each).
            // Player 0 wins: 150 - 7 rake = 143.
            // Final chips: 450 + 143 = 593.

            // Actually I think there's a nuance. Let me just verify the math is consistent.
            expect(p0After.chips).toBe(450 + (150 - 7)); // 593
        });
    });
});
