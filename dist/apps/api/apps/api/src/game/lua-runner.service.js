"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LuaRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaRunnerService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const promises_1 = require("fs/promises");
const path_1 = require("path");
let LuaRunnerService = LuaRunnerService_1 = class LuaRunnerService {
    constructor() {
        this.logger = new common_1.Logger(LuaRunnerService_1.name);
        this.scriptCache = new Map();
        this.scriptsDir = process.env.NODE_ENV === 'production'
            ? (0, path_1.join)(__dirname, 'lua')
            : (0, path_1.join)(process.cwd(), 'apps/api/src/game/lua');
    }
    async onModuleInit() {
        this.redis = new ioredis_1.default({
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
        await this.loadAllScripts();
    }
    async loadAllScripts() {
        try {
            const files = await (0, promises_1.readdir)(this.scriptsDir);
            const luaFiles = files.filter(f => f.endsWith('.lua'));
            for (const file of luaFiles) {
                const scriptName = file.replace('.lua', '');
                await this.loadScript(scriptName);
            }
            this.logger.log(`Loaded ${luaFiles.length} Lua scripts`);
        }
        catch (error) {
            this.logger.warn('No Lua scripts found (this is expected during initial setup)');
        }
    }
    async loadScript(scriptName) {
        const filePath = (0, path_1.join)(this.scriptsDir, `${scriptName}.lua`);
        const source = await (0, promises_1.readFile)(filePath, 'utf-8');
        const sha = await this.redis.script('LOAD', source);
        this.scriptCache.set(scriptName, { sha, source });
        this.logger.debug(`Loaded script: ${scriptName} (SHA: ${sha.substring(0, 8)}...)`);
        return sha;
    }
    async runScript(scriptName, keys, args = []) {
        let entry = this.scriptCache.get(scriptName);
        if (!entry) {
            await this.loadScript(scriptName);
            entry = this.scriptCache.get(scriptName);
        }
        if (!entry) {
            throw new Error(`Script not found: ${scriptName}`);
        }
        try {
            const result = await this.redis.evalsha(entry.sha, keys.length, ...keys, ...args.map(String));
            return result;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('NOSCRIPT')) {
                this.logger.warn(`Script ${scriptName} evicted from Redis, reloading...`);
                const newSha = await this.redis.script('LOAD', entry.source);
                entry.sha = newSha;
                const result = await this.redis.evalsha(newSha, keys.length, ...keys, ...args.map(String));
                return result;
            }
            throw error;
        }
    }
    async evalRaw(script, keys, args = []) {
        const result = await this.redis.eval(script, keys.length, ...keys, ...args.map(String));
        return result;
    }
    getClient() {
        return this.redis;
    }
    async healthCheck() {
        try {
            const pong = await this.redis.ping();
            return pong === 'PONG';
        }
        catch (_a) {
            return false;
        }
    }
};
exports.LuaRunnerService = LuaRunnerService;
exports.LuaRunnerService = LuaRunnerService = LuaRunnerService_1 = __decorate([
    (0, common_1.Injectable)()
], LuaRunnerService);
//# sourceMappingURL=lua-runner.service.js.map