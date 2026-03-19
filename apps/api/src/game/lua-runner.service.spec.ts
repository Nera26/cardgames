/**
 * LuaRunnerService Tests
 * 
 * Tests Lua script loading and execution via ioredis mock.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LuaRunnerService } from './lua-runner.service';

// Mock ioredis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        script: jest.fn().mockResolvedValue('mock-sha-hash'),
        evalsha: jest.fn().mockResolvedValue('script-result'),
        eval: jest.fn().mockResolvedValue('eval-result'),
        ping: jest.fn().mockResolvedValue('PONG'),
    }));
});

// Mock fs/promises
jest.mock('fs/promises', () => ({
    readFile: jest.fn().mockResolvedValue('return "hello"'),
    readdir: jest.fn().mockResolvedValue([]),
}));

describe('LuaRunnerService', () => {
    let service: LuaRunnerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LuaRunnerService],
        }).compile();

        service = module.get<LuaRunnerService>(LuaRunnerService);
        await service.onModuleInit();
    });

    describe('healthCheck', () => {
        it('should return true when Redis responds with PONG', async () => {
            const result = await service.healthCheck();
            expect(result).toBe(true);
        });
    });

    describe('getClient', () => {
        it('should return the Redis client', () => {
            const client = service.getClient();
            expect(client).toBeDefined();
            expect(typeof client.ping).toBe('function');
        });
    });

    describe('evalRaw', () => {
        it('should execute raw Lua code', async () => {
            const result = await service.evalRaw('return "test"', [], []);
            expect(result).toBe('eval-result');
        });
    });
});
