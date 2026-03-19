/**
 * Lua Runner Service
 * 
 * Executes Lua scripts atomically via Redis EVALSHA.
 * Implements SHA1 caching for optimized script execution.
 * 
 * @see ARCHITECTURE.md Section 17 - The Law of Lua
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

interface ScriptEntry {
    sha: string;
    source: string;
}

@Injectable()
export class LuaRunnerService implements OnModuleInit {
    private readonly logger = new Logger(LuaRunnerService.name);
    private redis!: Redis;
    private scriptCache: Map<string, ScriptEntry> = new Map();

    // In Docker, use the source directory path since webpack doesn't bundle .lua files
    private readonly scriptsDir = process.env.NODE_ENV === 'production'
        ? join(__dirname, 'lua')
        : join(process.cwd(), 'apps/api/src/game/lua');

    async onModuleInit(): Promise<void> {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        this.redis.on('connect', () => {
            this.logger.log('Connected to Redis');
        });

        this.redis.on('error', (err) => {
            this.logger.error('Redis connection error', err);
        });

        // Pre-load all Lua scripts on startup
        await this.loadAllScripts();
    }

    /**
     * Load all .lua files from the lua/ directory and cache their SHA1 hashes.
     */
    async loadAllScripts(): Promise<void> {
        try {
            const files = await readdir(this.scriptsDir);
            const luaFiles = files.filter(f => f.endsWith('.lua'));

            for (const file of luaFiles) {
                const scriptName = file.replace('.lua', '');
                await this.loadScript(scriptName);
            }

            this.logger.log(`Loaded ${luaFiles.length} Lua scripts`);
        } catch (error) {
            // No scripts yet is OK during initial setup
            this.logger.warn('No Lua scripts found (this is expected during initial setup)');
        }
    }

    /**
     * Load a single Lua script and register it with Redis.
     * 
     * @param scriptName - Name of the script (without .lua extension)
     * @returns SHA1 hash of the loaded script
     */
    async loadScript(scriptName: string): Promise<string> {
        const filePath = join(this.scriptsDir, `${scriptName}.lua`);
        const source = await readFile(filePath, 'utf-8');
        const sha = await this.redis.script('LOAD', source) as string;

        this.scriptCache.set(scriptName, { sha, source });
        this.logger.debug(`Loaded script: ${scriptName} (SHA: ${sha.substring(0, 8)}...)`);

        return sha;
    }

    /**
     * Execute a Lua script atomically.
     * Uses EVALSHA for efficiency (SHA1 cached, minimal bandwidth).
     * Falls back to EVAL if script not cached in Redis.
     * 
     * @param scriptName - Name of the script (without .lua extension)
     * @param keys - Redis keys the script will access
     * @param args - Arguments to pass to the script
     * @returns Script execution result
     */
    async runScript<T = unknown>(
        scriptName: string,
        keys: string[],
        args: (string | number)[] = []
    ): Promise<T> {
        let entry = this.scriptCache.get(scriptName);

        if (!entry) {
            // Script not loaded yet, load it now
            await this.loadScript(scriptName);
            entry = this.scriptCache.get(scriptName);
        }

        if (!entry) {
            throw new Error(`Script not found: ${scriptName}`);
        }

        try {
            // Try EVALSHA first (optimized)
            const result = await this.redis.evalsha(
                entry.sha,
                keys.length,
                ...keys,
                ...args.map(String)
            );
            return result as T;
        } catch (error: unknown) {
            // If NOSCRIPT error, script was flushed from Redis - reload and retry
            if (error instanceof Error && error.message.includes('NOSCRIPT')) {
                this.logger.warn(`Script ${scriptName} evicted from Redis, reloading...`);
                const newSha = await this.redis.script('LOAD', entry.source) as string;
                entry.sha = newSha;

                const result = await this.redis.evalsha(
                    newSha,
                    keys.length,
                    ...keys,
                    ...args.map(String)
                );
                return result as T;
            }
            throw error;
        }
    }

    /**
     * Execute raw Lua code (for testing/debugging only).
     * Production code should always use loadScript + runScript.
     * 
     * @param script - Raw Lua code
     * @param keys - Redis keys
     * @param args - Arguments
     */
    async evalRaw<T = unknown>(
        script: string,
        keys: string[],
        args: (string | number)[] = []
    ): Promise<T> {
        const result = await this.redis.eval(
            script,
            keys.length,
            ...keys,
            ...args.map(String)
        );
        return result as T;
    }

    /**
     * Get the Redis client for direct operations (use sparingly).
     * Prefer Lua scripts for atomic operations.
     */
    getClient(): Redis {
        return this.redis;
    }

    /**
     * Check if Redis is connected and responsive.
     */
    async healthCheck(): Promise<boolean> {
        try {
            const pong = await this.redis.ping();
            return pong === 'PONG';
        } catch {
            return false;
        }
    }
}
