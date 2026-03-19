import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('join_table.lua: Idempotent Reconnection (Resurrection)', () => {
    let container: StartedTestContainer;
    let redis: Redis;
    const tableId = 'reconnect-table';
    const tableKey = `table:${tableId}`;
    const playersKey = `table:${tableId}:players`;
    const balanceKey = `user:u1:balance`;

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

    it('Scenario: Disconnect and Resurrection', async () => {
        // 1. Setup Table Metadata
        await redis.hset(tableKey, {
            id: tableId,
            name: 'Test Table',
            phase: 'waiting',
            smallBlind: 10,
            bigBlind: 20
        });

        // 2. Setup User Balance
        await redis.set(balanceKey, '1000');

        // 3. Initial Join
        const joinResult = await runScript('join_table', [tableKey, playersKey, balanceKey], [0, 500, 'u1', 'p1', 'avatar_1']);
        const joinRes = JSON.parse(joinResult as string);
        expect(joinRes.success).toBe(true);
        expect(joinRes.action).toBeUndefined();

        // 4. Disconnect (Zombie State)
        await runScript('leave_table', [tableKey, playersKey, balanceKey], [0, 'u1', 'true']);

        // 5. Resurrection (Rejoin)
        const reconnectResult = await runScript('join_table', [tableKey, playersKey, balanceKey], [0, 500, 'u1', 'p1', 'avatar_1']);
        const reconnectRes = JSON.parse(reconnectResult as string);

        console.log('Reconnect Response:', JSON.stringify(reconnectRes, null, 2));

        expect(reconnectRes.success).toBe(true);
        expect(reconnectRes.action).toBe('reconnected');
        expect(reconnectRes.seat).toBe(0);

        const p1 = JSON.parse((await redis.hget(playersKey, 'seat_0'))!);
        expect(p1.status).toBe('active');
        expect(p1.chips).toBe(500);

        const balance = await redis.get(balanceKey);
        expect(balance).toBe('500');
    });
});
