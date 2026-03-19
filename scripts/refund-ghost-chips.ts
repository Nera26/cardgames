/**
 * refund-ghost-chips.ts — Financial Correction Script (Prompt 4)
 *
 * One-off migration to refund the $2,180,000 trapped in orphaned BUY_IN
 * transactions. Finds BUY_INs with no matching CASH_OUT and credits
 * the corresponding Postgres wallets.
 *
 * SAFETY:
 *   - Uses prisma.$transaction for atomicity
 *   - Uses SELECT ... FOR UPDATE for row-level locking
 *   - Creates CASH_OUT transaction records for audit trail
 *   - Creates AuditLog entries for each refund
 *   - Idempotent: unique constraint on [referenceId, type] prevents double-refund
 *
 * Run inside Docker:
 *   docker exec -it cardgames-api npx ts-node scripts/refund-ghost-chips.ts
 *
 * DRY RUN (no mutations):
 *   docker exec -it cardgames-api npx ts-node scripts/refund-ghost-chips.ts --dry-run
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════
// CONFIG: Incident time window
// ════════════════════════════════════════════════════
// Expanded to cover ALL orphaned BUY_INs since inception
const WINDOW_START = new Date('2026-01-01T00:00:00+08:00');
const WINDOW_END = new Date('2027-01-01T00:00:00+08:00');
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  💰 FINANCIAL CORRECTION: Ghost Chip Refund');
    console.log(`  Window: ${WINDOW_START.toISOString()} → ${WINDOW_END.toISOString()}`);
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no mutations)' : '⚡ LIVE (will mutate database)'}`);
    console.log('═══════════════════════════════════════════════════\n');

    // ── Step 1: Find orphaned BUY_IN transactions ──
    // These are BUY_INs where funds were deducted from wallets but never refunded
    const orphanedBuyIns = await prisma.$queryRaw<{
        id: string;
        walletId: string;
        amount: any;
        referenceId: string | null;
        userId: string;
        username: string;
        createdAt: Date;
    }[]>`
        SELECT 
            t.id,
            t."walletId",
            t.amount,
            t."referenceId",
            u.id as "userId",
            u.username,
            t."createdAt"
        FROM "Transaction" t
        INNER JOIN "Wallet" w ON w.id = t."walletId"
        INNER JOIN "User" u ON u.id = w."userId"
        WHERE t.type = 'BUY_IN'
          AND t.status = 'COMPLETED'
          AND t."createdAt" >= ${WINDOW_START}
          AND t."createdAt" <= ${WINDOW_END}
          AND NOT EXISTS (
              SELECT 1 FROM "Transaction" co
              WHERE co."referenceId" = t."referenceId"
                AND co.type = 'CASH_OUT'
                AND co.status = 'COMPLETED'
          )
        ORDER BY t."createdAt" ASC
    `;

    console.log(`📊 Found ${orphanedBuyIns.length} orphaned BUY_IN transaction(s).\n`);

    if (orphanedBuyIns.length === 0) {
        console.log('✅ No orphaned transactions found. System may already be reconciled.');
        console.log('\nChecking full day for context...');
        
        // Extended search
        const fullDayStart = new Date('2026-03-15T00:00:00+08:00');
        const fullDayEnd = new Date('2026-03-16T00:00:00+08:00');

        const allBuyIns = await prisma.transaction.count({
            where: {
                type: 'BUY_IN',
                status: 'COMPLETED',
                createdAt: { gte: fullDayStart, lte: fullDayEnd },
            },
        });

        const allCashOuts = await prisma.transaction.count({
            where: {
                type: 'CASH_OUT',
                status: 'COMPLETED',
                createdAt: { gte: fullDayStart, lte: fullDayEnd },
            },
        });

        console.log(`  Full day BUY_INs: ${allBuyIns}`);
        console.log(`  Full day CASH_OUTs: ${allCashOuts}`);
        await prisma.$disconnect();
        return;
    }

    // ── Step 2: Calculate totals ──
    let totalRefund = new Prisma.Decimal(0);
    for (const buyIn of orphanedBuyIns) {
        const amount = new Prisma.Decimal(buyIn.amount.toString());
        totalRefund = totalRefund.plus(amount.abs());
        console.log(
            `  ${buyIn.username.padEnd(20)} | $${Number(amount.abs()).toLocaleString().padStart(12)} | ` +
            `ref: ${buyIn.referenceId || 'N/A'} | ${buyIn.createdAt.toISOString()}`,
        );
    }

    console.log(`\n  Total to refund: $${Number(totalRefund).toLocaleString()}`);
    console.log(`  Affected users:  ${new Set(orphanedBuyIns.map(b => b.userId)).size}\n`);

    if (DRY_RUN) {
        console.log('🔍 DRY RUN complete. No mutations made.');
        console.log('   Run without --dry-run to execute refunds.');
        await prisma.$disconnect();
        return;
    }

    // ── Step 3: Execute refunds in a single Prisma transaction ──
    console.log('⚡ Executing refunds...\n');

    let refundedCount = 0;
    let refundedTotal = new Prisma.Decimal(0);
    const errors: string[] = [];

    for (const buyIn of orphanedBuyIns) {
        const refundAmount = new Prisma.Decimal(buyIn.amount.toString()).abs();

        try {
            await prisma.$transaction(async (tx) => {
                // ── Lock the wallet row (prevents concurrent modifications) ──
                const [wallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                    SELECT id, "realBalance" 
                    FROM "Wallet" 
                    WHERE "userId" = ${buyIn.userId} 
                    FOR UPDATE
                `;

                if (!wallet) {
                    throw new Error(`Wallet not found for user ${buyIn.userId} (${buyIn.username})`);
                }

                const balanceBefore = new Prisma.Decimal(wallet.realBalance.toString());
                const balanceAfter = balanceBefore.plus(refundAmount);

                // ── Credit the wallet ──
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { realBalance: balanceAfter },
                });

                // ── Create CASH_OUT transaction record ──
                // Uses the same referenceId as the BUY_IN for traceability
                // The unique constraint on [referenceId, type] prevents double-refund
                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'CASH_OUT',
                        amount: refundAmount,
                        status: 'COMPLETED',
                        description: `Reconciliation Fix: Ghost Chip Refund (original BUY_IN: ${buyIn.id})`,
                        balanceBefore,
                        balanceAfter,
                        referenceId: buyIn.referenceId,
                    },
                });

                // ── Create AuditLog entry ──
                await tx.auditLog.create({
                    data: {
                        userId: buyIn.userId,
                        action: 'RECONCILIATION_REFUND',
                        payload: {
                            originalBuyInId: buyIn.id,
                            refundAmount: refundAmount.toString(),
                            referenceId: buyIn.referenceId,
                            balanceBefore: balanceBefore.toString(),
                            balanceAfter: balanceAfter.toString(),
                            reason: 'Ghost Chip Refund — force_cleanup.lua refunded Redis but not Postgres',
                            fixedAt: new Date().toISOString(),
                        },
                    },
                });
            });

            refundedCount++;
            refundedTotal = refundedTotal.plus(refundAmount);
            console.log(
                `  ✅ ${buyIn.username.padEnd(20)} +$${Number(refundAmount).toLocaleString().padStart(12)} (ref: ${buyIn.referenceId || 'N/A'})`,
            );
        } catch (err: any) {
            // P2002 = unique constraint violation = already refunded
            if (err?.code === 'P2002') {
                console.log(
                    `  ⏭️  ${buyIn.username.padEnd(20)} SKIPPED (already refunded)`,
                );
            } else {
                errors.push(`${buyIn.username} (${buyIn.userId}): ${err.message}`);
                console.log(
                    `  ❌ ${buyIn.username.padEnd(20)} FAILED: ${err.message}`,
                );
            }
        }
    }

    // ── Step 4: Final Summary ──
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  📊 REFUND SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Refunds executed:  ${refundedCount}/${orphanedBuyIns.length}`);
    console.log(`  Total refunded:    $${Number(refundedTotal).toLocaleString()}`);
    console.log(`  Errors:            ${errors.length}`);

    if (errors.length > 0) {
        console.log('\n  ── Errors ──');
        for (const err of errors) {
            console.log(`    ❌ ${err}`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  NEXT STEPS:');
    console.log('  1. Run a fresh financial audit to verify MATCH status');
    console.log('  2. Check Admin > System Reconciliation dashboard');
    console.log('  3. Lift maintenance lockdown if audit passes');
    console.log('═══════════════════════════════════════════════════\n');

    await prisma.$disconnect();
}

main().catch((err) => {
    console.error('Refund script failed:', err);
    prisma.$disconnect();
    process.exit(1);
});
