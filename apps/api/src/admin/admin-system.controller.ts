import { Controller, Post, Delete, Get, UseGuards, Logger, Body, Req } from '@nestjs/common';
import { RedisService } from '../common/redis.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CronService } from '../cron/cron.service';
import {
    DriftAnalysisResponse,
    OrphanedTransaction,
    ResolveDriftRequest,
    ResolveDriftResponse,
    ResolveDriftRequestSchema,
} from '@poker/shared';

// ════════════════════════════════════════════════════════════════
// 🔴 RED BUTTON: System-Level Admin Controls
//
// POST   /admin/system/lockdown  — Activate Kill Switch
// DELETE /admin/system/lockdown  — Lift lockdown (resolve drift)
// GET    /admin/system/lockdown  — Check current lockdown status
// GET    /admin/system/drift-analysis — Inspect orphaned BUY_INs
// POST   /admin/system/resolve-drift  — Refund orphaned BUY_INs
//
// Guarded by JWT + Admin/SuperAdmin role.
// ════════════════════════════════════════════════════════════════

@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminSystemController {
    private readonly logger = new Logger(AdminSystemController.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly prisma: PrismaService,
        private readonly cronService: CronService,
    ) { }

    /**
     * 🔒 ACTIVATE LOCKDOWN
     * Publishes to system:maintenance Redis channel.
     * GameGateway listens and immediately freezes all tables.
     */
    @Post('lockdown')
    async activateLockdown(
        @Body() body?: { reason?: string },
    ) {
        const reason = body?.reason || 'MANUAL_ADMIN_LOCKDOWN';

        const payload = JSON.stringify({
            reason,
            triggeredAt: new Date().toISOString(),
            source: 'ADMIN_API',
        });

        // Publish to the same channel the CronService uses
        await this.redisService.getClient().publish('system:maintenance', payload);

        // Also persist directly (in case the gateway missed the pub/sub)
        await this.redisService.getClient().set('maintenance:lockdown', payload);

        // Audit log
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: 'SYSTEM',
                    action: 'LOCKDOWN_ACTIVATED',
                    payload: { reason, source: 'ADMIN_API' },
                },
            });
        } catch (err) {
            this.logger.error(`Failed to write lockdown audit log: ${err}`);
        }

        this.logger.error(`🔒 LOCKDOWN ACTIVATED via Admin API: ${reason}`);
        return {
            success: true,
            message: 'System lockdown activated. All tables frozen.',
            reason,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * 🔓 LIFT LOCKDOWN
     * Removes the maintenance:lockdown key from Redis.
     * Note: GameGateway instances need to be notified to flip their in-memory flag.
     * We publish a 'system:maintenance:lift' message for that.
     */
    @Delete('lockdown')
    async liftLockdown() {
        // Remove the Redis lockdown key
        await this.redisService.getClient().del('maintenance:lockdown');

        // Publish lift event so GameGateway instances can clear their in-memory flag
        await this.redisService.getClient().publish('system:maintenance:lift', JSON.stringify({
            liftedAt: new Date().toISOString(),
            source: 'ADMIN_API',
        }));

        // Audit log
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: 'SYSTEM',
                    action: 'LOCKDOWN_LIFTED',
                    payload: { source: 'ADMIN_API' },
                },
            });
        } catch (err) {
            this.logger.error(`Failed to write lockdown lift audit log: ${err}`);
        }

        this.logger.log('🔓 LOCKDOWN LIFTED via Admin API');
        return {
            success: true,
            message: 'System lockdown lifted. Tables can resume.',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * 📊 CHECK LOCKDOWN STATUS
     * Returns whether the system is currently in lockdown.
     */
    @Get('lockdown')
    async getLockdownStatus() {
        const lockdownData = await this.redisService.getClient().get('maintenance:lockdown');
        const isLocked = !!lockdownData;

        let details = null;
        if (lockdownData) {
            try {
                details = JSON.parse(lockdownData);
            } catch { /* ignore */ }
        }

        return {
            locked: isLocked,
            details,
        };
    }

    /**
     * 📊 GET LATEST RECONCILIATION REPORTS
     * Returns the most recent financial audit reports for the Invariant display.
     */
    @Get('reconciliation')
    async getReconciliationReports() {
        const reports = await this.prisma.reconciliationReport.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10,
            select: {
                id: true,
                totalWalletBalance: true,
                totalChipsInPlay: true,
                expectedBalance: true,
                systemDiscrepancy: true,
                status: true,
                details: true,
                timestamp: true,
            },
        });

        return reports.map(r => ({
            id: r.id,
            timestamp: r.timestamp.toISOString(),
            totalWalletBalance: r.totalWalletBalance?.toString() || '0',
            totalChipsInPlay: r.totalChipsInPlay?.toString() || '0',
            expectedBalance: r.expectedBalance?.toString() || '0',
            systemDiscrepancy: r.systemDiscrepancy?.toString() || '0',
            status: r.status,
            details: r.details,
        }));
    }

    /**
     * 🔵 FORCE AUDIT
     * Triggers an immediate Financial Invariant audit, bypassing the cron schedule.
     * Returns the fresh reconciliation report.
     */
    @Post('audit/force')
    async forceAudit() {
        this.logger.log('🔵 Force audit triggered via Admin API');
        const report = await this.cronService.runAudit();
        return {
            id: report.id,
            timestamp: report.timestamp.toISOString(),
            totalWalletBalance: report.totalWalletBalance?.toString() || '0',
            totalChipsInPlay: report.totalChipsInPlay?.toString() || '0',
            expectedBalance: report.expectedBalance?.toString() || '0',
            systemDiscrepancy: report.systemDiscrepancy?.toString() || '0',
            status: report.status,
            details: report.details,
        };
    }

    // ════════════════════════════════════════════════════════════════
    // 🔍 DRIFT INSPECTOR: Analyze & Resolve Ghost Money
    // ════════════════════════════════════════════════════════════════

    /**
     * 🔍 DRIFT ANALYSIS
     * Returns all orphaned BUY_IN transactions (no matching CASH_OUT).
     * This is the "brain" of the audit-ghost-transactions.ts script,
     * now exposed as a secure admin API.
     */
    @Get('drift-analysis')
    async getDriftAnalysis(): Promise<DriftAnalysisResponse> {
        this.logger.log('🔍 Drift analysis requested via Admin API');

        // Find orphaned BUY_INs across all time
        const orphans = await this.prisma.$queryRaw<{
            id: string;
            userId: string;
            username: string;
            amount: any;
            referenceId: string | null;
            createdAt: Date;
        }[]>`
            SELECT 
                t.id,
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
              AND NOT EXISTS (
                  SELECT 1 FROM "Transaction" co
                  WHERE co."referenceId" = t."referenceId"
                    AND co.type = 'CASH_OUT'
                    AND co.status = 'COMPLETED'
              )
            ORDER BY t."createdAt" ASC
        `;

        // Extract tableId from referenceId format: {tableId}:{timestamp}
        const transactions: OrphanedTransaction[] = orphans.map(o => ({
            buyInId: o.id,
            userId: o.userId,
            username: o.username,
            amount: Math.abs(Number(o.amount)),
            referenceId: o.referenceId,
            tableId: o.referenceId?.split(':')[0] || null,
            createdAt: o.createdAt.toISOString(),
        }));

        const totalGhostMoney = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Get latest drift from reconciliation
        const latestReport = await this.prisma.reconciliationReport.findFirst({
            orderBy: { timestamp: 'desc' },
            select: { systemDiscrepancy: true },
        });

        return {
            orphanedTransactions: transactions,
            totalGhostMoney,
            affectedUsers: new Set(transactions.map(t => t.userId)).size,
            currentDrift: latestReport?.systemDiscrepancy?.toString() || '0',
            analyzedAt: new Date().toISOString(),
        };
    }

    /**
     * ⚡ RESOLVE DRIFT
     * Refunds selected orphaned BUY_IN transactions by creating matching CASH_OUT entries.
     * Uses prisma.$transaction for atomicity. Logs the admin's ID as executor.
     */
    @Post('resolve-drift')
    async resolveDrift(
        @Body() body: ResolveDriftRequest,
        @Req() req: any,
    ): Promise<ResolveDriftResponse> {
        const parsed = ResolveDriftRequestSchema.safeParse(body);
        if (!parsed.success) {
            return {
                success: false,
                refundedCount: 0,
                totalRefunded: 0,
                skippedCount: 0,
                errors: ['Invalid request: ' + parsed.error.message],
                resolvedAt: new Date().toISOString(),
            };
        }

        const adminUserId = req.user?.id || 'ADMIN';
        const { referenceIds } = parsed.data;

        this.logger.warn(`⚡ Drift resolution triggered by admin ${adminUserId} for ${referenceIds.length} transactions`);

        let refundedCount = 0;
        let totalRefunded = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const referenceId of referenceIds) {
            try {
                // Find the orphaned BUY_IN
                const buyIn = await this.prisma.transaction.findFirst({
                    where: {
                        referenceId,
                        type: 'BUY_IN',
                        status: 'COMPLETED',
                    },
                    include: {
                        wallet: { include: { user: { select: { id: true, username: true } } } },
                    },
                });

                if (!buyIn) {
                    errors.push(`BUY_IN not found for ref: ${referenceId}`);
                    continue;
                }

                // Check if already refunded
                const existingCashOut = await this.prisma.transaction.findFirst({
                    where: {
                        referenceId,
                        type: 'CASH_OUT',
                        status: 'COMPLETED',
                    },
                });

                if (existingCashOut) {
                    skippedCount++;
                    continue;
                }

                const refundAmount = new Prisma.Decimal(buyIn.amount.toString()).abs();

                await this.prisma.$transaction(async (tx) => {
                    // Lock wallet row
                    const [wallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                        SELECT id, "realBalance" 
                        FROM "Wallet" 
                        WHERE "userId" = ${buyIn.wallet.user.id} 
                        FOR UPDATE
                    `;

                    if (!wallet) throw new Error(`Wallet not found for user ${buyIn.wallet.user.id}`);

                    const balanceBefore = new Prisma.Decimal(wallet.realBalance.toString());
                    const balanceAfter = balanceBefore.plus(refundAmount);

                    // Credit wallet
                    await tx.wallet.update({
                        where: { id: wallet.id },
                        data: { realBalance: balanceAfter },
                    });

                    // Create CASH_OUT record
                    await tx.transaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'CASH_OUT',
                            amount: refundAmount,
                            status: 'COMPLETED',
                            description: `Admin Drift Resolution: Ghost Chip Refund (BuyIn: ${buyIn.id})`,
                            balanceBefore,
                            balanceAfter,
                            referenceId,
                        },
                    });

                    // Audit log with admin executor
                    await tx.auditLog.create({
                        data: {
                            userId: adminUserId,
                            action: 'RECONCILIATION_REFUND',
                            payload: {
                                originalBuyInId: buyIn.id,
                                refundAmount: refundAmount.toString(),
                                referenceId,
                                affectedUser: buyIn.wallet.user.username,
                                affectedUserId: buyIn.wallet.user.id,
                                balanceBefore: balanceBefore.toString(),
                                balanceAfter: balanceAfter.toString(),
                                source: 'ADMIN_DRIFT_INSPECTOR',
                            },
                        },
                    });
                });

                refundedCount++;
                totalRefunded += Number(refundAmount);
                this.logger.log(`✅ Refunded ${buyIn.wallet.user.username}: +$${Number(refundAmount).toLocaleString()} (ref: ${referenceId})`);
            } catch (err: any) {
                if (err?.code === 'P2002') {
                    skippedCount++;
                } else {
                    errors.push(`ref ${referenceId}: ${err.message}`);
                    this.logger.error(`❌ Refund failed for ref ${referenceId}: ${err.message}`);
                }
            }
        }

        this.logger.log(`Drift resolution complete: ${refundedCount} refunded, ${skippedCount} skipped, ${errors.length} errors`);

        return {
            success: errors.length === 0,
            refundedCount,
            totalRefunded,
            skippedCount,
            errors,
            resolvedAt: new Date().toISOString(),
        };
    }
}
