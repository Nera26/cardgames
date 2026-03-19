import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LuaRunnerService } from './lua-runner.service';
import { GameGateway } from './game.gateway';
import { AuditService } from '../audit/audit.service';
export declare class PlayerReaperService implements OnModuleInit, OnModuleDestroy {
    private readonly luaRunner;
    private readonly gameGateway;
    private readonly auditService;
    private readonly logger;
    private sweepInterval;
    constructor(luaRunner: LuaRunnerService, gameGateway: GameGateway, auditService: AuditService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private sweep;
    private sweepTable;
}
