import { OnModuleInit } from '@nestjs/common';
import { LuaRunnerService } from './lua-runner.service';
export declare class ReconciliationService implements OnModuleInit {
    private readonly luaRunner;
    private readonly logger;
    constructor(luaRunner: LuaRunnerService);
    onModuleInit(): Promise<void>;
    private cleanupStaleTables;
}
