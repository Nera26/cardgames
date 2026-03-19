import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CronService } from '../cron.service';
export declare class AuditProcessor extends WorkerHost {
    private readonly cronService;
    private readonly logger;
    constructor(cronService: CronService);
    process(job: Job): Promise<void>;
}
