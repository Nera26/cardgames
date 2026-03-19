import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LuaRunnerService } from '../../game/lua-runner.service';
import { TimerService } from '../timer.service';
import { GameGateway } from '../../game/game.gateway';
import { AuditService } from '../../audit/audit.service';
export declare class TurnTimerProcessor extends WorkerHost {
    private readonly luaRunner;
    private readonly timerService;
    private readonly gameGateway;
    private readonly auditService;
    private readonly logger;
    constructor(luaRunner: LuaRunnerService, timerService: TimerService, gameGateway: GameGateway, auditService: AuditService);
    process(job: Job<{
        tableId: string;
        seat: number;
    }>): Promise<void>;
}
