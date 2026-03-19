/**
 * Tournament Module (Phase 7)
 *
 * Registers all tournament components:
 * - AdminTournamentController (Blue Cable - CRUD)
 * - PublicTournamentController (Blue Cable - Lobby + Registration)
 * - TournamentService (Business Logic + ACID Financial Gateway)
 * - TournamentCronService (Yellow Cable - Lifecycle Automation)
 *
 * Integrates with BullMQ for scheduled lifecycle transitions.
 */

import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AdminTournamentController } from './admin-tournament.controller';
import { PublicTournamentController } from './public-tournament.controller';
import { TournamentService } from './tournament.service';
import { TournamentCronService } from './tournament-cron.service';
import { TournamentLifecycleProcessor } from './tournament-lifecycle.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'tournament-lifecycle',
        }),
        PrismaModule,
        CommonModule,
        AuthModule,
    ],
    controllers: [AdminTournamentController, PublicTournamentController],
    providers: [
        TournamentService,
        TournamentCronService,
        TournamentLifecycleProcessor,
    ],
    exports: [TournamentService, TournamentCronService],
})
export class TournamentModule implements OnModuleInit {
    private readonly logger = new Logger(TournamentModule.name);

    constructor(@InjectQueue('tournament-lifecycle') private readonly queue: Queue) {}

    async onModuleInit() {
        this.logger.log('Initializing Tournament Lifecycle cron jobs...');

        // Schedule tournament lifecycle check every minute
        await this.queue.add(
            'tournament-lifecycle-tick',
            {},
            {
                repeat: {
                    every: 60 * 1000, // Every 1 minute
                },
                removeOnComplete: true,
            },
        );

        this.logger.log('🏆 Tournament Lifecycle Processor scheduled (Every 1m) - Yellow Cable');
    }
}
