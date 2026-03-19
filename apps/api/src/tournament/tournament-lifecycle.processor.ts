/**
 * Tournament Lifecycle BullMQ Processor (Phase 7 - Yellow Cable)
 *
 * Processes the repeating 'tournament-lifecycle-tick' job,
 * dispatching to TournamentCronService for state transitions.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { TournamentCronService } from './tournament-cron.service';

@Processor('tournament-lifecycle')
@Injectable()
export class TournamentLifecycleProcessor extends WorkerHost {
    private readonly logger = new Logger(TournamentLifecycleProcessor.name);

    constructor(private readonly cronService: TournamentCronService) {
        super();
    }

    async process(job: Job): Promise<void> {
        if (job.name === 'tournament-lifecycle-tick') {
            try {
                await this.cronService.processLifecycleTransitions();
            } catch (error: any) {
                this.logger.error(`Tournament lifecycle tick failed: ${error.message}`, error.stack);
                throw error; // Let BullMQ handle retry
            }
        }
    }
}
