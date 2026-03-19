/**
 * CashOutProcessor — Yellow Cable Write-Behind Sync Worker
 *
 * Consumes LEAVE_CASH_OUT jobs from the 'cashout-settlement' BullMQ queue
 * and executes walletService.settleCashOut() in a Postgres transaction.
 *
 * This decouples the Red Cable (Gateway) from the Blue Cable (Postgres)
 * ensuring the WebSocket handler stays under <50ms while the Yellow Cable
 * handles the durable settlement with built-in retry mechanics.
 *
 * Architecture:
 *   Red Cable (Gateway) → XADD → BullMQ Queue → This Worker → Blue Cable (Postgres)
 *
 * Idempotency:
 *   - walletService.settleCashOut() already handles P2002 (unique constraint on [referenceId, type])
 *   - BullMQ retries are safe — duplicate attempts resolve gracefully
 *
 * @see ARCHITECTURE.md §3.2 The State Sync (Write-Behind)
 * @see ARCHITECTURE.md §3 The 3 Commandments of Yellow
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../../wallet/wallet.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@poker/shared';

@Processor('cashout-settlement')
@Injectable()
export class CashOutProcessor extends WorkerHost {
    private readonly logger = new Logger(CashOutProcessor.name);

    constructor(
        private readonly walletService: WalletService,
        private readonly auditService: AuditService,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        const { userId, amount, tableId, referenceId, source } = job.data;

        if (job.name !== 'settle-cashout') {
            this.logger.warn(`Unknown job name: ${job.name}. Skipping.`);
            return;
        }

        this.logger.log(
            `🟡 Processing cashout settlement: user ${userId}, $${amount} from table ${tableId} ` +
            `(source: ${source || 'unknown'}, attempt: ${job.attemptsMade + 1})`,
        );

        // ── Validation ──
        if (!userId || typeof userId !== 'string') {
            this.logger.error(`Invalid userId in cashout job: ${userId}. Discarding.`);
            return; // Don't retry — bad data
        }

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            this.logger.warn(`Zero or invalid amount in cashout job for ${userId}. Skipping.`);
            return; // Nothing to refund
        }

        if (!tableId || typeof tableId !== 'string') {
            this.logger.error(`Invalid tableId in cashout job: ${tableId}. Discarding.`);
            return;
        }

        // ── Execute Settlement (Blue Cable) ──
        try {
            await this.walletService.settleCashOut(userId, amount, tableId, referenceId);

            this.logger.log(
                `✅ Cashout settled: user ${userId} +$${amount.toLocaleString()} from table ${tableId}`,
            );
        } catch (err: any) {
            // P2002 = Idempotency shield caught a duplicate — resolve gracefully
            if (err?.code === 'P2002') {
                this.logger.warn(
                    `[IDEMPOTENCY] Duplicate cashout blocked for ${userId} on table ${tableId}. ` +
                    `Already processed. Resolving gracefully.`,
                );
                return; // Don't retry — already settled
            }

            // Any other error: log and re-throw to trigger BullMQ retry
            this.logger.error(
                `❌ Cashout settlement FAILED for ${userId} ($${amount} from ${tableId}): ${err.message}`,
            );
            throw err; // BullMQ will retry with backoff
        }
    }
}
