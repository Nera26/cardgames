/**
 * Tournament Lifecycle Cron Service (Phase 7 - Yellow Cable)
 *
 * Runs every minute via BullMQ. Automatically transitions tournaments:
 *   Rule 1: ANNOUNCED → REGISTERING  (when startTime - 2h has passed)
 *   Rule 2: REGISTERING → LATE_REG or RUNNING  (when startTime is reached)
 *   Rule 3: LATE_REG → RUNNING  (when late registration window closes)
 *
 * All transitions are idempotent and logged.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TournamentStatus, LateRegistrationWindow } from '@prisma/client';
import { TournamentService } from './tournament.service';

@Injectable()
export class TournamentCronService {
    private readonly logger = new Logger(TournamentCronService.name);

    // Registration opens 2 hours before startTime by default
    private readonly REGISTRATION_LEAD_TIME_MS = 2 * 60 * 60 * 1000; // 2 hours

    constructor(
        private readonly prisma: PrismaService,
        private readonly tournamentService: TournamentService,
    ) {}

    /**
     * Called by the BullMQ processor every minute.
     * Scans for tournaments needing state transitions.
     */
    async processLifecycleTransitions(): Promise<void> {
        const now = new Date();
        let transitioned = 0;

        // ================================================
        // Rule 1: ANNOUNCED → REGISTERING
        // When: now >= startTime - 2 hours
        // ================================================
        const registrationOpenThreshold = new Date(now.getTime() + this.REGISTRATION_LEAD_TIME_MS);

        const announcedTournaments = await this.prisma.tournament.findMany({
            where: {
                status: 'ANNOUNCED',
                startTime: { lte: registrationOpenThreshold },
            },
        });

        for (const t of announcedTournaments) {
            try {
                await this.tournamentService.transitionStatus(t.id, 'REGISTERING');
                transitioned++;
                this.logger.log(`[Rule 1] "${t.name}" → REGISTERING (starts at ${t.startTime.toISOString()})`);
            } catch (err: any) {
                this.logger.error(`[Rule 1] Failed to transition "${t.name}": ${err.message}`);
            }
        }

        // ================================================
        // Rule 2: REGISTERING → RUNNING or LATE_REG
        // When: now >= startTime
        // ================================================
        const registeringTournaments = await this.prisma.tournament.findMany({
            where: {
                status: 'REGISTERING',
                startTime: { lte: now },
            },
        });

        for (const t of registeringTournaments) {
            try {
                if (t.lateRegistration !== 'DISABLED') {
                    // Move to LATE_REG — registration still open
                    await this.tournamentService.transitionStatus(t.id, 'LATE_REG');
                    this.logger.log(`[Rule 2] "${t.name}" → LATE_REG (late reg: ${t.lateRegistration})`);
                } else {
                    // No late reg — go directly to RUNNING
                    await this.tournamentService.transitionStatus(t.id, 'RUNNING');
                    this.logger.log(`[Rule 2] "${t.name}" → RUNNING (no late reg)`);
                }
                transitioned++;
            } catch (err: any) {
                this.logger.error(`[Rule 2] Failed to transition "${t.name}": ${err.message}`);
            }
        }

        // ================================================
        // Rule 3: LATE_REG → RUNNING
        // When: now >= startTime + lateRegistrationWindow
        // ================================================
        const lateRegTournaments = await this.prisma.tournament.findMany({
            where: {
                status: 'LATE_REG',
            },
        });

        for (const t of lateRegTournaments) {
            const windowMs = this.getLateRegistrationWindowMs(t.lateRegistration);
            const lateRegCloses = new Date(t.startTime.getTime() + windowMs);

            if (now >= lateRegCloses) {
                try {
                    await this.tournamentService.transitionStatus(t.id, 'RUNNING');
                    transitioned++;
                    this.logger.log(`[Rule 3] "${t.name}" → RUNNING (late reg window closed)`);
                } catch (err: any) {
                    this.logger.error(`[Rule 3] Failed to transition "${t.name}": ${err.message}`);
                }
            }
        }

        if (transitioned > 0) {
            this.logger.log(`🏆 Tournament lifecycle: ${transitioned} transition(s) applied`);
        }
    }

    /**
     * Convert LateRegistrationWindow enum to milliseconds
     */
    private getLateRegistrationWindowMs(window: LateRegistrationWindow): number {
        switch (window) {
            case 'THIRTY_MINUTES': return 30 * 60 * 1000;
            case 'SIXTY_MINUTES': return 60 * 60 * 1000;
            case 'NINETY_MINUTES': return 90 * 60 * 1000;
            case 'UNTIL_FIRST_BREAK': return 60 * 60 * 1000; // Default to 1h for first break
            case 'DISABLED': return 0;
            default: return 60 * 60 * 1000;
        }
    }
}
