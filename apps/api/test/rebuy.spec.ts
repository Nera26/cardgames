import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('add_chips_vault.lua: Re-Buy System (Phoenix)', () => {
    let container: StartedTestContainer;
    let redis: Redis;
    const tableId = 'rebuy-table';
    const tableKey = `table:${tableId}`;
    const playersKey = `table:${tableId}:players`;

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
        return redis.eval(script, keys.length, ...keys, ...args.map(String));
    };

    beforeEach(async () => {
        await redis.flushall();
        // Setup minimal table state
        await redis.hset(tableKey, {
            id: tableId,
            phase: 'waiting',
            pot: 0
        });
    });

    it('Scenario A: Busted Rebuy (0 chips -> waiting)', async () => {
        // 1. Setup Busted Player (Seat 0)
        await redis.hset(playersKey, 'seat_0', JSON.stringify({
            id: 'u1',
            username: 'p1',
            chips: 0,
            status: 'sitting_out'
        }));

        // 2. Execute add_chips_vault (500 chips)
        const result = await runScript('add_chips_vault', [tableKey, playersKey], [0, 500]);
        const res = JSON.parse(result as string);

        expect(res.success).toBe(true);

        // 3. Verify status transitioned to 'waiting'
        const p1 = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
        expect(p1.chips).toBe(500);
        expect(p1.status).toBe('waiting');
    });

    it('Scenario B: Top-Up (Has chips -> Preserve Status)', async () => {
        // 1. Setup Active Player with chips (Seat 1)
        await redis.hset(playersKey, 'seat_1', JSON.stringify({
            id: 'u2',
            username: 'p2',
            chips: 500,
            status: 'active'
        }));

        // 2. Execute add_chips_vault (500 chips)
        const result = await runScript('add_chips_vault', [tableKey, playersKey], [1, 500]);
        const res = JSON.parse(result as string);

        expect(res.success).toBe(true);

        // 3. Verify status remained 'active' (Status Preservation)
        const p2 = JSON.parse((await redis.hget(playersKey, 'seat_1'))!);
        expect(p2.chips).toBe(1000);
        expect(p2.status).toBe('active');
    });

    it('Scenario C: Folded Top-Up (Preserve Folded Status)', async () => {
        // 1. Setup Folded Player
        await redis.hset(playersKey, 'seat_2', JSON.stringify({
            id: 'u3',
            username: 'p3',
            chips: 300,
            status: 'folded'
        }));

        // 2. Execute add_chips_vault (200 chips)
        await runScript('add_chips_vault', [tableKey, playersKey], [2, 200]);

        // 3. Verify status remained 'folded'
        const p3 = JSON.parse((await redis.hget(playersKey, 'seat_2'))!);
        expect(p3.chips).toBe(500);
        expect(p3.status).toBe('folded');
    });
});
