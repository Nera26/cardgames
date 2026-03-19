import { OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
export declare class LuaRunnerService implements OnModuleInit {
    private readonly logger;
    private redis;
    private scriptCache;
    private readonly scriptsDir;
    onModuleInit(): Promise<void>;
    loadAllScripts(): Promise<void>;
    loadScript(scriptName: string): Promise<string>;
    runScript<T = unknown>(scriptName: string, keys: string[], args?: (string | number)[]): Promise<T>;
    evalRaw<T = unknown>(script: string, keys: string[], args?: (string | number)[]): Promise<T>;
    getClient(): Redis;
    healthCheck(): Promise<boolean>;
}
