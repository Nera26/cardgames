/**
 * Reconciliation Service — The Boot Janitor
 * 
 * Runs ONCE on server startup (OnModuleInit).
 * Scans Redis for all active tables and surgically resets them:
 *   - Snapshots all seated players' chip counts BEFORE cleanup
 *   - Refunds all seated players' chips back to their Redis wallet balance
 *   - Enqueues Yellow Cable cashout jobs to settle refunds in Postgres
 *   - Resets table state to clean "waiting"
 *   - Does NOT destroy user balances (unlike FLUSHALL)
 * 
 * This solves the "Zombie Lobby" problem: when Node crashes/restarts,
 * Redis still has stale table state with ghost players. The Janitor
 * evicts them cleanly before the game module accepts new connections.
 * 
 * PATCH (Ghost Money Fix): Previously, force_cleanup.lua refunded Redis
 * balances but never triggered a Postgres settlement — creating a one-way
 * money leak. Now we enqueue a cashout job for each refunded player so
 * the CashOutProcessor completes The Great Handoff.
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LuaRunnerService } from './lua-runner.service';

interface CleanupResult {
    success: boolean;
    playersRefunded: number;
    totalRefunded: number;
}

interface SnapshotPlayer {
    id: string;
    username: string;
    chips: number;
    currentBet: number;
    seatNumber: number;
}

@Injectable()
export class ReconciliationService implements OnModuleInit {
    private readonly logger = new Logger('🧹 Reconciliation');

    constructor(
        private readonly luaRunner: LuaRunnerService,
        @InjectQueue('cashout-settlement')
        private readonly cashoutQueue: Queue,
    ) { }

    async onModuleInit(): Promise<void> {
        // Small delay to ensure LuaRunnerService has finished connecting + loading scripts
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
            await this.cleanupStaleTables();
        } catch (error) {
            this.logger.error(`Boot reconciliation failed: ${error}`);
            // Non-fatal — server can still start, tables just won't be cleaned
        }
    }

    /**
     * Scan Redis for all table keys and run force_cleanup on each.
     * CRITICAL: Snapshot player data BEFORE cleanup so we can enqueue
     * Postgres settlements for refunded chips.
     */
    private async cleanupStaleTables(): Promise<void> {
        const redis = this.luaRunner.getClient();

        // ── Step 1: Find all table keys ──
        // Use SCAN (non-blocking) instead of KEYS (which blocks Redis)
        const tableIds = new Set<string>();
        let cursor = '0';

        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH', 'table:*',
                'COUNT', '100',
            );
            cursor = nextCursor;

            for (const key of keys) {
                // Extract table ID from keys like:
                //   table:{id}           → {id}
                //   table:{id}:players   → {id}
                //   table:{id}:deck      → {id}
                //   table:{id}:config    → {id}
                // But skip non-table keys like: table_config, etc.
                const match = key.match(/^table:([^:]+)/);
                if (match) {
                    const id = match[1];
                    tableIds.add(id);
                }
            }
        } while (cursor !== '0');

        if (tableIds.size === 0) {
            this.logger.log('No active tables found. Clean boot.');
            return;
        }

        this.logger.warn(`Found ${tableIds.size} table(s) in Redis. Starting cleanup...`);

        // ── Step 2: Snapshot players THEN run force_cleanup.lua ──
        let totalPlayers = 0;
        let totalChips = 0;
        let totalCashoutJobsEnqueued = 0;

        for (const tableId of tableIds) {
            try {
                // ── SNAPSHOT: Capture player data BEFORE force_cleanup wipes it ──
                const playersData = await redis.hgetall(`table:${tableId}:players`);
                const seatedPlayers: SnapshotPlayer[] = [];

                for (const [key, value] of Object.entries(playersData)) {
                    if (!key.startsWith('seat_')) continue;
                    try {
                        const p = JSON.parse(value);
                        const chips = Number(p.chips || 0);
                        const currentBet = Number(p.currentBet || 0);
                        const refundable = chips + currentBet;
                        if (p.id && refundable > 0) {
                            seatedPlayers.push({
                                id: p.id,
                                username: p.username || 'unknown',
                                chips,
                                currentBet,
                                seatNumber: Number(p.seatNumber ?? key.replace('seat_', '')),
                            });
                        }
                    } catch { /* skip unparseable player data */ }
                }

                // ── CLEANUP: Run force_cleanup.lua (refunds Redis balances) ──
                const result = await this.luaRunner.runScript<string>(
                    'force_cleanup',
                    [
                        `table:${tableId}`,
                        `table:${tableId}:players`,
                    ],
                    [],
                );

                const parsed: CleanupResult = JSON.parse(result);

                if (parsed.playersRefunded > 0) {
                    this.logger.warn(
                        `  Table ${tableId}: ${parsed.playersRefunded} player(s) refunded, ` +
                        `${parsed.totalRefunded} chips returned to Redis wallets`
                    );
                    totalPlayers += parsed.playersRefunded;
                    totalChips += parsed.totalRefunded;

                    // ── SETTLEMENT: Enqueue Yellow Cable cashout for each player ──
                    // This closes The Great Handoff: Redis ←→ Postgres
                    for (const player of seatedPlayers) {
                        const refundable = player.chips + player.currentBet;
                        try {
                            const jobId = `reconciliation:${player.id}:${tableId}:${Date.now()}`;
                            await this.cashoutQueue.add('settle-cashout', {
                                userId: player.id,
                                amount: refundable,
                                tableId,
                                source: 'boot_reconciliation',
                            }, { jobId });

                            totalCashoutJobsEnqueued++;
                            this.logger.log(
                                `    🟡 Enqueued settlement: ${player.username} +$${refundable.toLocaleString()} (job: ${jobId})`
                            );
                        } catch (queueErr: any) {
                            this.logger.error(
                                `    ❌ Failed to enqueue cashout for ${player.username} ($${refundable}): ${queueErr.message}`
                            );
                        }
                    }
                } else {
                    this.logger.log(`  Table ${tableId}: already clean (no players)`);
                }
            } catch (error) {
                this.logger.error(`  Table ${tableId}: cleanup failed — ${error}`);
                // Continue to next table, don't abort the whole sweep
            }
        }

        // ── Step 3: Summary ──
        if (totalPlayers > 0) {
            this.logger.warn(
                `✅ Reconciliation complete: ${totalPlayers} zombie player(s) evicted, ` +
                `${totalChips} total chips refunded across ${tableIds.size} table(s). ` +
                `${totalCashoutJobsEnqueued} cashout job(s) enqueued for Postgres settlement.`
            );
        } else {
            this.logger.log(`✅ Reconciliation complete: all ${tableIds.size} table(s) were already clean`);
        }
    }
}

