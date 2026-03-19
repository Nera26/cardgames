import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { CronService } from '../cron.service';

@Processor('system-cron')
@Injectable()
export class AuditProcessor extends WorkerHost {
    private readonly logger = new Logger(AuditProcessor.name);

    constructor(private readonly cronService: CronService) {
        super();
    }

    async process(job: Job): Promise<void> {
        if (job.name === 'financial-audit') {
            this.logger.log('Executing scheduled financial audit job');
            try {
                await this.cronService.runAudit();
            } catch (error) {
                this.logger.error('Scheduled financial audit failed', error.stack);
                throw error;
            }
        } else if (job.name === 'auto-healer') {
            this.logger.log('Executing Auto-Healer ghost money sweep');
            try {
                await this.cronService.autoResolveGhostMoney();
            } catch (error) {
                this.logger.error('Auto-Healer sweep failed', error.stack);
                throw error;
            }
        } else if (job.name === 'hand-history-reaper') {
            this.logger.log('💀 Executing Hand History Reaper...');
            try {
                await this.cronService.reapOldHandHistory();
            } catch (error) {
                this.logger.error('💀 Hand History Reaper failed', error.stack);
                throw error;
            }
        } else if (job.name === 'leaderboard-refresh') {
            this.logger.log('📊 Executing Leaderboard Aggregator...');
            try {
                await this.cronService.refreshLeaderboard();
            } catch (error) {
                this.logger.error('📊 Leaderboard Aggregator failed', error.stack);
                throw error;
            }
        }
    }
}
