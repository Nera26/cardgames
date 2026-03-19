import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    // ════════════════════════════════════════════════════════════════
    // 🟡 YELLOW CABLE: Global Financial Invariant (Proof of Reserves)
    //
    // THE MASTER EQUATION:
    //   Total Deposits - Total Withdrawals
    //     ===
    //   Sum(Player Wallets) + Sum(Table Chips) + House Profit
    //
    // If this equation is off by even $0.01, a bug has occurred,
    // phantom money exists, and the platform must instantly shut down.
    // ════════════════════════════════════════════════════════════════

    async runAudit() {
        this.logger.log('Starting Global Financial Invariant audit...');
        try {
            // ── Step 1: Calculate The Pool (Money In - Money Out) ──
            const pool = await this.calculateSystemPool();

            // ── Step 2: Calculate System Liabilities ──
            const playerWallets = await this.calculatePlayerWallets();
            const houseBalance = await this.calculateHouseBalance();
            const redisChips = await this.sumChipsFromRedis();

            // ── Step 3: The Invariant Equation ──
            // ALL math uses Prisma Decimal — no JavaScript floating-point!
            const totalPool = pool.netPool; // Decimal: Deposits + Withdrawals (withdrawals are negative)
            const totalLiabilities = playerWallets.total
                .plus(houseBalance.total)
                .plus(new Prisma.Decimal(redisChips.total));

            const discrepancy = totalLiabilities.minus(totalPool);
            const status = discrepancy.isZero() ? 'MATCH' : 'DRIFT';

            // ── Step 4: Persist the Report ──
            const report = await this.prisma.reconciliationReport.create({
                data: {
                    totalWalletBalance: playerWallets.total.plus(houseBalance.total),
                    totalChipsInPlay: new Prisma.Decimal(redisChips.total),
                    expectedBalance: totalPool,
                    systemDiscrepancy: discrepancy,
                    status,
                    details: {
                        // Full breakdown for forensic analysis
                        deposits: pool.totalDeposits.toString(),
                        withdrawals: pool.totalWithdrawals.toString(),
                        adminCredits: pool.totalAdminCredits.toString(),
                        adminDebits: pool.totalAdminDebits.toString(),
                        netPool: pool.netPool.toString(),
                        playerWallets: playerWallets.total.toString(),
                        playerWalletReal: playerWallets.real.toString(),
                        playerWalletBonus: playerWallets.bonus.toString(),
                        houseBalance: houseBalance.total.toString(),
                        houseBalanceReal: houseBalance.real.toString(),
                        redisChips: redisChips.total,
                        tableCount: redisChips.count,
                    } as any,
                },
            });

            if (status === 'DRIFT') {
                this.logger.error(
                    `🚨 CRITICAL DRIFT DETECTED! Discrepancy: $${discrepancy.toString()}\n` +
                    `   Pool (Deposits - Withdrawals): $${totalPool.toString()}\n` +
                    `   Player Wallets: $${playerWallets.total.toString()}\n` +
                    `   House Balance: $${houseBalance.total.toString()}\n` +
                    `   Redis Chips: $${redisChips.total}\n` +
                    `   Total Liabilities: $${totalLiabilities.toString()}`
                );

                // ════════════════════════════════════════════════════════
                // 🟡→🔴 KILL SWITCH: Trigger maintenance lockdown via
                // Redis PubSub. The GameGateway subscribes to this channel
                // and freezes all tables immediately.
                // Decoupled via PubSub to avoid circular dependency.
                // ════════════════════════════════════════════════════════
                try {
                    const lockdownPayload = JSON.stringify({
                        reason: 'FINANCIAL_DRIFT',
                        discrepancy: discrepancy.toString(),
                        reportId: report.id,
                        triggeredAt: new Date().toISOString(),
                    });
                    await this.redisService.getClient().publish(
                        'system:maintenance',
                        lockdownPayload,
                    );
                    this.logger.error('🔒 KILL SWITCH ACTIVATED: Published system:maintenance lockdown');
                } catch (pubErr) {
                    this.logger.error(`Failed to publish kill switch: ${pubErr}`);
                }

                // Emergency WebSocket Alert to Admin dashboards
                try {
                    const alertPayload = {
                        target: 'GLOBAL',
                        payload: {
                            type: 'FINANCIAL_DRIFT',
                            title: '🚨 Financial Drift Detected — LOCKDOWN ACTIVATED',
                            message: `System discrepancy of $${discrepancy.toString()} detected. ` +
                                `Pool: $${totalPool.toString()}, ` +
                                `Liabilities: $${totalLiabilities.toString()}. ` +
                                `All tables frozen.`,
                            severity: 'CRITICAL',
                            reportId: report.id,
                            timestamp: new Date().toISOString(),
                        },
                    };
                    await this.redisService.getClient().publish(
                        'global_alerts',
                        JSON.stringify(alertPayload),
                    );
                    this.logger.log('Emergency drift alert published to global_alerts');
                } catch (alertErr) {
                    this.logger.error(`Failed to publish drift alert: ${alertErr}`);
                }

                // Permanent audit log record
                try {
                    await this.prisma.auditLog.create({
                        data: {
                            userId: 'SYSTEM',
                            action: 'FINANCIAL_DRIFT',
                            payload: {
                                reportId: report.id,
                                discrepancy: discrepancy.toString(),
                                pool: totalPool.toString(),
                                playerWallets: playerWallets.total.toString(),
                                houseBalance: houseBalance.total.toString(),
                                redisChips: redisChips.total,
                            },
                        },
                    });
                } catch (auditErr) {
                    this.logger.error(`Failed to write drift audit log: ${auditErr}`);
                }
            } else {
                this.logger.log(
                    `✅ Audit Complete: System BALANCED (Report: ${report.id})\n` +
                    `   Pool: $${totalPool.toString()} | ` +
                    `Wallets: $${playerWallets.total.toString()} | ` +
                    `House: $${houseBalance.total.toString()} | ` +
                    `Chips: $${redisChips.total}`
                );
            }

            return report;
        } catch (error) {
            this.logger.error('Failed to run financial audit', error.stack);
            throw error;
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 🔵 BLUE CABLE: Raw SQL Aggregators
    // Uses SUM() at the database level — never fetches individual rows.
    // Returns Prisma Decimal for exact arithmetic.
    // ════════════════════════════════════════════════════════════════

    /**
     * Calculate the System Pool: Total money that entered minus total that left.
     * Withdrawals are stored as negative amounts, so a single SUM gives net.
     * Uses separate queries for deposits and withdrawals for the breakdown.
     */
    private async calculateSystemPool(): Promise<{
        totalDeposits: Prisma.Decimal;
        totalWithdrawals: Prisma.Decimal;
        totalAdminCredits: Prisma.Decimal;
        totalAdminDebits: Prisma.Decimal;
        netPool: Prisma.Decimal;
    }> {
        const [depositResult] = await this.prisma.$queryRaw<{ total: any }[]>`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM "Transaction"
            WHERE type = 'DEPOSIT' AND status = 'COMPLETED'
        `;

        // Withdrawals are stored as NEGATIVE amounts.
        // Use ABS() so totalWithdrawals is a positive number for display clarity.
        const [withdrawResult] = await this.prisma.$queryRaw<{ total: any }[]>`
            SELECT COALESCE(SUM(ABS(amount)), 0) as total
            FROM "Transaction"
            WHERE type = 'WITHDRAW' AND status = 'COMPLETED'
        `;

        // Admin Credits = System-injected money (treated like deposits)
        const [adminCreditResult] = await this.prisma.$queryRaw<{ total: any }[]>`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM "Transaction"
            WHERE type = 'ADMIN_CREDIT' AND status = 'COMPLETED'
        `;

        // Admin Debits = System-removed money (treated like withdrawals)
        // Stored as negative amounts, use ABS() for display clarity.
        const [adminDebitResult] = await this.prisma.$queryRaw<{ total: any }[]>`
            SELECT COALESCE(SUM(ABS(amount)), 0) as total
            FROM "Transaction"
            WHERE type = 'ADMIN_DEBIT' AND status = 'COMPLETED'
        `;

        const totalDeposits = new Prisma.Decimal(depositResult.total?.toString() || '0');
        const totalWithdrawals = new Prisma.Decimal(withdrawResult.total?.toString() || '0');
        const totalAdminCredits = new Prisma.Decimal(adminCreditResult.total?.toString() || '0');
        const totalAdminDebits = new Prisma.Decimal(adminDebitResult.total?.toString() || '0');

        // Pool = (Money In) - (Money Out)
        //      = (Deposits + Admin Credits) - (Withdrawals + Admin Debits)
        const netPool = totalDeposits.plus(totalAdminCredits)
            .minus(totalWithdrawals)
            .minus(totalAdminDebits);

        this.logger.debug(
            `Pool: Deposits=$${totalDeposits}, Withdrawals=$${totalWithdrawals}, ` +
            `AdminCredits=$${totalAdminCredits}, AdminDebits=$${totalAdminDebits}, Net=$${netPool}`
        );

        return { totalDeposits, totalWithdrawals, totalAdminCredits, totalAdminDebits, netPool };
    }

    /**
     * Sum all PLAYER-type user wallets (excludes HOUSE and BOT).
     */
    private async calculatePlayerWallets(): Promise<{
        real: Prisma.Decimal;
        bonus: Prisma.Decimal;
        total: Prisma.Decimal;
    }> {
        const [result] = await this.prisma.$queryRaw<{ real: any; bonus: any }[]>`
            SELECT
                COALESCE(SUM(w."realBalance"), 0) as real,
                COALESCE(SUM(w."bonusBalance"), 0) as bonus
            FROM "Wallet" w
            INNER JOIN "User" u ON u.id = w."userId"
            WHERE u.type = 'PLAYER'
        `;

        const real = new Prisma.Decimal(result.real?.toString() || '0');
        const bonus = new Prisma.Decimal(result.bonus?.toString() || '0');
        return { real, bonus, total: real.plus(bonus) };
    }

    /**
     * Sum HOUSE-type user wallets (platform revenue / rake).
     */
    private async calculateHouseBalance(): Promise<{
        real: Prisma.Decimal;
        total: Prisma.Decimal;
    }> {
        const [result] = await this.prisma.$queryRaw<{ real: any }[]>`
            SELECT COALESCE(SUM(w."realBalance"), 0) as real
            FROM "Wallet" w
            INNER JOIN "User" u ON u.id = w."userId"
            WHERE u."type" = 'HOUSE'
        `;

        const real = new Prisma.Decimal(result.real?.toString() || '0');
        this.logger.debug(`House Balance: $${real.toString()} (raw query result: ${JSON.stringify(result)})`);
        return { real, total: real };
    }

    /**
     * Sum all chips currently on Redis tables (player stacks + pots).
     * Scans all table:* keys and aggregates player chips + pot.
     */
    private async sumChipsFromRedis(): Promise<{ total: number; count: number }> {
        const redis = this.redisService.getClient();
        let total = 0;
        let tableCount = 0;
        let cursor = '0';

        // Known suffixes that are NOT the main table hash
        const suffixes = [':players', ':deck', ':config', ':stream'];

        do {
            const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'table:*', 'COUNT', 100);
            cursor = newCursor;

            for (const key of keys) {
                // Skip sub-keys (e.g., table:{uuid}:players, table:{uuid}:deck)
                if (suffixes.some(s => key.endsWith(s))) continue;

                // Also skip keys with more than one colon segment after "table:"
                const afterPrefix = key.substring(6); // Remove "table:"
                if (afterPrefix.includes(':')) continue;

                tableCount++;

                // Sum the pot from the main table hash
                const tableData = await redis.hgetall(key);
                const pot = parseInt(tableData.pot || '0', 10);
                let tableChips = pot;

                // Sum chips from players at this table
                // Each player is stored in table:{id}:players as seat_0, seat_1,..
                // Player JSON contains: chips (their stack) + currentBet (bet this street)
                // During a hand, bet chips leave the stack but aren't in the pot yet
                const playersData = await redis.hgetall(`${key}:players`);
                const playerEntries = Object.entries(playersData);
                let playerChipCount = 0;

                for (const [seatKey, playerJson] of playerEntries) {
                    try {
                        const player = JSON.parse(playerJson);
                        const chips = Number(player.chips) || 0;
                        const currentBet = Number(player.currentBet) || 0;
                        playerChipCount += chips + currentBet;
                    } catch (e) {
                        this.logger.warn(
                            `Failed to parse player in ${key}:players field ${seatKey}: ${e}`
                        );
                    }
                }

                tableChips += playerChipCount;
                total += tableChips;

                this.logger.debug(
                    `Table ${key}: pot=$${pot}, playerChips=$${playerChipCount}, ` +
                    `totalOnTable=$${tableChips}, players=${playerEntries.length}`
                );
            }
        } while (cursor !== '0');

        this.logger.log(`Redis Chips Total: $${total} across ${tableCount} tables`);
        return { total, count: tableCount };
    }

    // ════════════════════════════════════════════════════════════════
    // 🟡 YELLOW CABLE: Auto-Healer — Autonomous Ghost Money Sweep
    //
    // Runs every hour. Finds orphaned BUY_IN transactions (no CASH_OUT)
    // older than 2 hours AND not actively seated in Redis.
    // Automatically refunds them and notifies admins.
    // ════════════════════════════════════════════════════════════════

    /**
     * Prompt 1: The Safe Auto-Sweep Query
     * Finds BUY_IN transactions with no matching CASH_OUT that are:
     *   - Older than SAFETY_THRESHOLD_HOURS (2h)
     *   - NOT from players currently seated at any Redis table
     */
    private async findOrphanedTransactions(): Promise<{
        id: string;
        walletId: string;
        userId: string;
        username: string;
        amount: any;
        referenceId: string | null;
        createdAt: Date;
    }[]> {
        const SAFETY_THRESHOLD_HOURS = 2;
        const cutoffDate = new Date(Date.now() - SAFETY_THRESHOLD_HOURS * 60 * 60 * 1000);

        // Step 1: Find stale orphaned BUY_INs from Postgres
        const orphans = await this.prisma.$queryRaw<{
            id: string;
            walletId: string;
            userId: string;
            username: string;
            amount: any;
            referenceId: string | null;
            createdAt: Date;
        }[]>`
            SELECT
                t.id,
                t."walletId",
                u.id as "userId",
                u.username,
                t.amount,
                t."referenceId",
                t."createdAt"
            FROM "Transaction" t
            INNER JOIN "Wallet" w ON w.id = t."walletId"
            INNER JOIN "User" u ON u.id = w."userId"
            WHERE t.type = 'BUY_IN'
              AND t.status = 'COMPLETED'
              AND t."referenceId" IS NOT NULL
              AND t."createdAt" < ${cutoffDate}
              AND NOT EXISTS (
                  SELECT 1 FROM "Transaction" co
                  WHERE co."referenceId" = t."referenceId"
                    AND co.type = 'CASH_OUT'
                    AND co.status = 'COMPLETED'
              )
            ORDER BY t."createdAt" ASC
        `;

        if (orphans.length === 0) return [];

        // Step 2: Redis Safety Lock — Exclude players currently seated
        const redis = this.redisService.getClient();
        const activeUserIds = new Set<string>();

        // Scan all table:*:players keys
        let cursor = '0';
        do {
            const [next, keys] = await redis.scan(cursor, 'MATCH', 'table:*:players', 'COUNT', '100');
            cursor = next;
            for (const key of keys) {
                const playersData = await redis.hgetall(key);
                for (const [seatKey, json] of Object.entries(playersData)) {
                    if (!seatKey.startsWith('seat_')) continue;
                    try {
                        const player = JSON.parse(json as string);
                        if (player.id) activeUserIds.add(player.id);
                    } catch { /* skip */ }
                }
            }
        } while (cursor !== '0');

        // Filter out any users still actively seated
        const safeOrphans = orphans.filter(o => !activeUserIds.has(o.userId));

        if (safeOrphans.length < orphans.length) {
            this.logger.log(
                `🛡️ Auto-Healer safety lock: ${orphans.length - safeOrphans.length} orphans ` +
                `excluded (players still seated in Redis)`
            );
        }

        return safeOrphans;
    }

    /**
     * Prompt 2: The Auto-Healer Cron Job
     * Called every hour by BullMQ. Finds and refunds ghost money.
     */
    async autoResolveGhostMoney(): Promise<void> {
        this.logger.log('🩺 Auto-Healer: Starting ghost money sweep...');

        const orphans = await this.findOrphanedTransactions();

        if (orphans.length === 0) {
            this.logger.log('🩺 Auto-Healer: No orphaned transactions found. System clean.');
            return;
        }

        this.logger.warn(`🩺 Auto-Healer: Found ${orphans.length} orphaned BUY_INs to auto-refund`);

        let refundedCount = 0;
        let totalRefunded = 0;
        const errors: string[] = [];

        for (const orphan of orphans) {
            try {
                const refundAmount = new Prisma.Decimal(orphan.amount.toString()).abs();

                await this.prisma.$transaction(async (tx) => {
                    // Lock wallet row
                    const [wallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                        SELECT id, "realBalance"
                        FROM "Wallet"
                        WHERE "userId" = ${orphan.userId}
                        FOR UPDATE
                    `;

                    if (!wallet) throw new Error(`Wallet not found for user ${orphan.userId}`);

                    const balanceBefore = new Prisma.Decimal(wallet.realBalance.toString());
                    const balanceAfter = balanceBefore.plus(refundAmount);

                    // Credit wallet
                    await tx.wallet.update({
                        where: { id: wallet.id },
                        data: { realBalance: balanceAfter },
                    });

                    // Create matching CASH_OUT record
                    await tx.transaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'CASH_OUT',
                            amount: refundAmount,
                            status: 'COMPLETED',
                            description: `Auto-Healer: Autonomous ghost chip reconciliation (BuyIn: ${orphan.id})`,
                            balanceBefore,
                            balanceAfter,
                            referenceId: orphan.referenceId,
                        },
                    });

                    // Audit log
                    await tx.auditLog.create({
                        data: {
                            userId: 'SYSTEM',
                            action: 'AUTO_RECONCILIATION_REFUND',
                            payload: {
                                originalBuyInId: orphan.id,
                                refundAmount: refundAmount.toString(),
                                referenceId: orphan.referenceId,
                                affectedUser: orphan.username,
                                affectedUserId: orphan.userId,
                                balanceBefore: balanceBefore.toString(),
                                balanceAfter: balanceAfter.toString(),
                                source: 'AUTO_HEALER_CRON',
                                description: 'Autonomous system heal for orphaned ghost chips.',
                            },
                        },
                    });
                });

                refundedCount++;
                totalRefunded += Number(refundAmount);
                this.logger.log(
                    `🩺 Auto-Healer: Refunded ${orphan.username}: +$${Number(refundAmount).toLocaleString()} ` +
                    `(ref: ${orphan.referenceId})`
                );
            } catch (err: any) {
                if (err?.code === 'P2002') {
                    // Duplicate — already refunded by manual action
                    continue;
                }
                errors.push(`ref ${orphan.referenceId}: ${err.message}`);
                this.logger.error(`🩺 Auto-Healer: Refund failed for ref ${orphan.referenceId}: ${err.message}`);
            }
        }

        // Summary log
        this.logger.log(
            `🩺 Auto-Healer complete: ${refundedCount} refunded ($${totalRefunded.toLocaleString()}), ` +
            `${errors.length} errors`
        );

        // Prompt 3: Admin Notification via global_alerts PubSub
        if (refundedCount > 0) {
            try {
                const alertPayload = {
                    target: 'GLOBAL',
                    payload: {
                        type: 'AUTO_HEAL_COMPLETE',
                        title: '🩺 System Auto-Healed',
                        message: `$${totalRefunded.toLocaleString()} in ghost chips successfully reconciled. ` +
                            `${refundedCount} orphaned BUY_IN(s) auto-refunded.`,
                        severity: 'INFO',
                        timestamp: new Date().toISOString(),
                        details: {
                            refundedCount,
                            totalRefunded,
                            errorCount: errors.length,
                        },
                    },
                };
                await this.redisService.getClient().publish(
                    'global_alerts',
                    JSON.stringify(alertPayload),
                );
                this.logger.log('🩺 Auto-Healer: Admin notification published to global_alerts');
            } catch (alertErr) {
                this.logger.error(`🩺 Auto-Healer: Failed to publish admin alert: ${alertErr}`);
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 🟡 YELLOW CABLE: The Reaper — Hand History Data Retention
    //
    // Runs daily at 3:00 AM. Strips heavy JSON replay data
    // (actionLog, communityCards) from hands older than 90 days.
    // Financial data (pot, rake, netProfit, winAmount) is PERMANENT.
    // ════════════════════════════════════════════════════════════════

    /**
     * Reap old hand history replay data to prevent database bloat.
     * Strips actionLog and communityCards (heavy JSON blobs) in batches
     * of 1000 to avoid locking Postgres during the purge.
     */
    async reapOldHandHistory(): Promise<void> {
        const RETENTION_DAYS = 90;
        const BATCH_SIZE = 1000;
        const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

        this.logger.log(
            `💀 Reaper: Starting hand history purge for records older than ${RETENTION_DAYS} days ` +
            `(before ${cutoffDate.toISOString()})...`
        );

        let totalStripped = 0;
        let batchCount = 0;

        // Loop in batches until no more records to strip
        while (true) {
            // Find batch of old hands that still have actionLog or communityCards
            const result = await this.prisma.$executeRaw`
                UPDATE "HandHistory"
                SET "actionLog" = NULL, "communityCards" = NULL
                WHERE id IN (
                    SELECT id FROM "HandHistory"
                    WHERE "endTime" < ${cutoffDate}
                      AND ("actionLog" IS NOT NULL OR "communityCards" IS NOT NULL)
                    LIMIT ${BATCH_SIZE}
                )
            `;

            if (result === 0) break;

            totalStripped += result;
            batchCount++;
            this.logger.log(
                `💀 Reaper: Batch ${batchCount} — stripped ${result} records (total: ${totalStripped})`
            );

            // Small yield to prevent blocking the event loop
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (totalStripped === 0) {
            this.logger.log('💀 Reaper: No old hand history to purge. Database clean.');
            return;
        }

        this.logger.log(
            `💀 Reaper complete: ${totalStripped} hand records stripped across ${batchCount} batches.`
        );

        // Admin notification via global_alerts
        try {
            const alertPayload = {
                target: 'GLOBAL',
                payload: {
                    type: 'HAND_HISTORY_REAPED',
                    title: '💀 Hand History Reaper Complete',
                    message: `${totalStripped} hand replay records older than ${RETENTION_DAYS} days ` +
                        `stripped of actionLog/communityCards data. Financial totals preserved.`,
                    severity: 'INFO',
                    timestamp: new Date().toISOString(),
                    details: {
                        totalStripped,
                        batchCount,
                        retentionDays: RETENTION_DAYS,
                        cutoffDate: cutoffDate.toISOString(),
                    },
                },
            };
            await this.redisService.getClient().publish(
                'global_alerts',
                JSON.stringify(alertPayload),
            );
            this.logger.log('💀 Reaper: Admin notification published to global_alerts');
        } catch (alertErr) {
            this.logger.error(`💀 Reaper: Failed to publish admin alert: ${alertErr}`);
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 🟡 YELLOW CABLE: Leaderboard Aggregator
    //
    // Runs periodically to aggregate HandPlayerResult data into the
    // LeaderboardStat snapshot table. Fully idempotent via upsert.
    // ════════════════════════════════════════════════════════════════

    /**
     * Refresh leaderboard stats for all timeframes and game modes.
     * Called by the leaderboard-refresh cron job.
     */
    async refreshLeaderboard(): Promise<void> {
        this.logger.log('📊 Leaderboard Aggregator: Starting refresh...');

        const timeframes = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
        const gameModes = ['CASH'] as const; // TOURNAMENT wired when tournament system is ready

        let totalUpserted = 0;

        for (const timeframe of timeframes) {
            for (const gameMode of gameModes) {
                try {
                    const count = await this.aggregateTimeframeBucket(timeframe, gameMode);
                    totalUpserted += count;
                } catch (err: any) {
                    this.logger.error(
                        `📊 Leaderboard Aggregator: Failed for ${timeframe}/${gameMode}: ${err.message}`,
                    );
                }
            }
        }

        this.logger.log(`📊 Leaderboard Aggregator: Complete — ${totalUpserted} rows upserted`);
    }

    /**
     * Aggregate stats for a single (timeframe, gameMode) bucket.
     * Uses raw SQL GROUP BY on HandPlayerResult + HandHistory for performance,
     * then upserts each row into LeaderboardStat.
     */
    private async aggregateTimeframeBucket(
        timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY',
        gameMode: 'CASH' | 'TOURNAMENT',
    ): Promise<number> {
        const now = new Date();
        const periodEnd = now;
        let periodStart: Date;

        switch (timeframe) {
            case 'DAILY':
                periodStart = new Date(now);
                periodStart.setHours(0, 0, 0, 0); // Start of today
                break;
            case 'WEEKLY':
                periodStart = new Date(now);
                periodStart.setDate(periodStart.getDate() - periodStart.getDay()); // Start of week (Sunday)
                periodStart.setHours(0, 0, 0, 0);
                break;
            case 'MONTHLY':
                periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
                break;
        }

        // Aggregate from HandPlayerResult + HandHistory
        // winAmount = total chips won, gamesPlayed = count of distinct hands
        const aggregated = await this.prisma.$queryRaw<{
            userId: string;
            totalWinnings: any;
            gamesPlayed: any;
            gamesWon: any;
        }[]>`
            SELECT
                hpr."userId",
                COALESCE(SUM(hpr."winAmount"), 0) as "totalWinnings",
                COUNT(DISTINCT hpr."handId") as "gamesPlayed",
                COUNT(DISTINCT CASE WHEN hpr."winAmount" > 0 THEN hpr."handId" END) as "gamesWon"
            FROM "HandPlayerResult" hpr
            INNER JOIN "HandHistory" hh ON hh.id = hpr."handId"
            INNER JOIN "User" u ON u.id = hpr."userId"
            WHERE hh."endTime" >= ${periodStart}
              AND hh."endTime" <= ${periodEnd}
              AND u.type = 'PLAYER'
            GROUP BY hpr."userId"
        `;

        if (aggregated.length === 0) {
            this.logger.debug(`📊 Leaderboard: No data for ${timeframe}/${gameMode}`);
            return 0;
        }

        // Upsert each player's stats — idempotent via @@unique([userId, timeframe, gameMode])
        let upsertCount = 0;
        for (const row of aggregated) {
            const gamesPlayed = Number(row.gamesPlayed);
            const gamesWon = Number(row.gamesWon);
            const winRate = gamesPlayed > 0
                ? parseFloat(((gamesWon / gamesPlayed) * 100).toFixed(2))
                : 0;

            await this.prisma.leaderboardStat.upsert({
                where: {
                    userId_timeframe_gameMode: {
                        userId: row.userId,
                        timeframe,
                        gameMode,
                    },
                },
                update: {
                    totalWinnings: Number(row.totalWinnings),
                    gamesPlayed,
                    gamesWon,
                    winRate,
                    periodStart,
                    periodEnd,
                    computedAt: now,
                },
                create: {
                    userId: row.userId,
                    timeframe,
                    gameMode,
                    totalWinnings: Number(row.totalWinnings),
                    gamesPlayed,
                    gamesWon,
                    winRate,
                    periodStart,
                    periodEnd,
                },
            });
            upsertCount++;
        }

        this.logger.log(
            `📊 Leaderboard: ${timeframe}/${gameMode} — ${upsertCount} players upserted ` +
            `(window: ${periodStart.toISOString()} → ${periodEnd.toISOString()})`,
        );

        return upsertCount;
    }
}
