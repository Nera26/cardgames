import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CronService } from './cron.service';
import { AuditProcessor } from './processors/audit.processor';
import { StatsProcessor } from './processors/stats.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'system-cron',
        }),
        PrismaModule,
        CommonModule,
    ],
    providers: [CronService, AuditProcessor, StatsProcessor],
    exports: [CronService],
})
export class CronModule implements OnModuleInit {
    private readonly logger = new Logger(CronModule.name);

    constructor(@InjectQueue('system-cron') private readonly cronQueue: Queue) { }

    async onModuleInit() {
        this.logger.log('Initializing System Cron repeatable jobs...');

        // Schedule Financial Audit every 10 minutes
        await this.cronQueue.add(
            'financial-audit',
            {},
            {
                repeat: {
                    every: 5 * 60 * 1000, // 5 minutes in ms
                },
                removeOnComplete: true,
            },
        );
        this.logger.log('Financial Audit scheduled (Every 5m)');

        // Schedule Table Stats Worker every 1 minute (Yellow Cable)
        await this.cronQueue.add(
            'table-stats',
            {},
            {
                repeat: {
                    every: 60 * 1000, // 1 minute in ms
                },
                removeOnComplete: true,
            },
        );
        this.logger.log('Table Stats Worker scheduled (Every 1m) - Yellow Cable');

        // Schedule Auto-Healer every 1 hour (Yellow Cable)
        await this.cronQueue.add(
            'auto-healer',
            {},
            {
                repeat: {
                    every: 60 * 60 * 1000, // 1 hour in ms
                },
                removeOnComplete: true,
            },
        );
        this.logger.log('🩺 Auto-Healer scheduled (Every 1h) - Yellow Cable');

        // Schedule Hand History Reaper daily at 3:00 AM (Yellow Cable)
        await this.cronQueue.add(
            'hand-history-reaper',
            {},
            {
                repeat: {
                    pattern: '0 3 * * *', // Cron: daily at 3:00 AM
                },
                removeOnComplete: true,
            },
        );
        this.logger.log('💀 Hand History Reaper scheduled (Daily 3:00 AM) - Yellow Cable');

        // Schedule Leaderboard Refresh every 5 minutes (Yellow Cable)
        await this.cronQueue.add(
            'leaderboard-refresh',
            {},
            {
                repeat: {
                    every: 5 * 60 * 1000, // 5 minutes in ms
                },
                removeOnComplete: true,
            },
        );
        this.logger.log('📊 Leaderboard Aggregator scheduled (Every 5m) - Yellow Cable');
    }
}
