/**
 * reverse-over-refund.ts — Surgical Reversal of Run 2 Over-Refund
 *
 * THE PROBLEM:
 *   Run 1 (04:30:48): Correctly refunded 2 orphaned BUY_INs → $2,200,000
 *   Run 2 (04:59:15): Re-refunded ALL 16 orphaned BUY_INs → $8,890,000
 *   Total credited: $11,090,000 | Should have been: $8,890,000 max
 *   Result: +$8,521,000 positive drift (wallets > pool)
 *
 * THE FIX:
 *   Identify the 16 CASH_OUTs from Run 2 (timestamp 04:59:15)
 *   For each, create a precise ADMIN_DEBIT offsetting that exact amount
 *   Log OVERPAYMENT_REVERSAL in AuditLog linking the erroneous txn ID
 *   DO NOT delete the original CASH_OUT rows — immutable ledger
 *
 * Run:     docker exec cardgames-api npx ts-node scripts/reverse-over-refund.ts
 * Dry-run: docker exec cardgames-api npx ts-node scripts/reverse-over-refund.ts --dry-run
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// Run 1 timestamp (keep these — they are valid)
const RUN1_CUTOFF = new Date('2026-03-16T04:45:00.000Z');

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🔪 SURGICAL REVERSAL: Run 2 Over-Refund ($8,890,000)');
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no mutations)' : '⚡ LIVE (will mutate database)'}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // ── Step 1: Isolate Run 2's 16 erroneous CASH_OUTs ──
    // Run 1 happened at 04:30:48, Run 2 at 04:59:15
    // We keep Run 1 (created before cutoff), reverse Run 2 (created after cutoff)
    const run2Transactions = await prisma.transaction.findMany({
        where: {
            type: 'CASH_OUT',
            status: 'COMPLETED',
            description: { contains: 'Ghost Chip Refund' },
            createdAt: { gt: RUN1_CUTOFF },
        },
        include: {
            wallet: {
                include: {
                    user: { select: { id: true, username: true } },
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Phase 1: Isolated ${run2Transactions.length} Run 2 CASH_OUTs\n`);

    if (run2Transactions.length === 0) {
        console.log('✅ No Run 2 transactions found. Nothing to reverse.');
        await prisma.$disconnect();
        return;
    }

    // Show the target list
    console.log('  ┌────────────────────┬───────────────┬──────────────────────┐');
    console.log('  │ User               │ Overpaid      │ Transaction ID       │');
    console.log('  ├────────────────────┼───────────────┼──────────────────────┤');

    let totalOverpaid = new Prisma.Decimal(0);
    for (const txn of run2Transactions) {
        const amt = new Prisma.Decimal(txn.amount.toString()).abs();
        totalOverpaid = totalOverpaid.plus(amt);
        console.log(
            `  │ ${txn.wallet.user.username.padEnd(18)} │ $${Number(amt).toLocaleString().padStart(11)} │ ${txn.id.slice(0, 20)}│`,
        );
    }
    console.log('  └────────────────────┴───────────────┴──────────────────────┘');
    console.log(`\n  Total to reverse: $${Number(totalOverpaid).toLocaleString()}`);
    console.log(`  Affected users: ${new Set(run2Transactions.map(t => t.wallet.user.id)).size}\n`);

    if (DRY_RUN) {
        console.log('🔍 DRY RUN complete. No mutations made.');
        console.log('   Run without --dry-run to execute the surgical reversal.\n');

        // Show what balances would look like after
        console.log('  ── Projected Balance Changes ──');
        const userTotals = new Map<string, { username: string; reversal: Prisma.Decimal }>();
        for (const txn of run2Transactions) {
            const uid = txn.wallet.user.id;
            const existing = userTotals.get(uid) || { username: txn.wallet.user.username, reversal: new Prisma.Decimal(0) };
            existing.reversal = existing.reversal.plus(new Prisma.Decimal(txn.amount.toString()).abs());
            userTotals.set(uid, existing);
        }
        for (const [uid, data] of userTotals) {
            const wallet = await prisma.wallet.findFirst({ where: { userId: uid }, select: { realBalance: true } });
            const currentBal = new Prisma.Decimal(wallet?.realBalance?.toString() || '0');
            const newBal = currentBal.minus(data.reversal);
            console.log(`    ${data.username.padEnd(18)} | Current: $${Number(currentBal).toLocaleString().padStart(12)} → After: $${Number(newBal).toLocaleString().padStart(12)} (debit: $${Number(data.reversal).toLocaleString()})`);
        }

        await prisma.$disconnect();
        return;
    }

    // ── Step 2: Execute Surgical Reversals ──
    console.log('⚡ Executing surgical reversals...\n');

    let reversedCount = 0;
    let reversedTotal = new Prisma.Decimal(0);
    const errors: string[] = [];

    // Track per-user results for summary
    const results: {
        username: string;
        originalRefund: string;
        reversalDebit: string;
        balanceBefore: string;
        balanceAfter: string;
        erroneousTxnId: string;
    }[] = [];

    for (const txn of run2Transactions) {
        const debitAmount = new Prisma.Decimal(txn.amount.toString()).abs();
        const userId = txn.wallet.user.id;
        const username = txn.wallet.user.username;

        try {
            await prisma.$transaction(async (tx) => {
                // ── Lock the wallet row ──
                const [wallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                    SELECT id, "realBalance"
                    FROM "Wallet"
                    WHERE "userId" = ${userId}
                    FOR UPDATE
                `;

                if (!wallet) throw new Error(`Wallet not found for user ${userId}`);

                const balanceBefore = new Prisma.Decimal(wallet.realBalance.toString());
                const balanceAfter = balanceBefore.minus(debitAmount);

                // ── Debit the overpayment from wallet ──
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { realBalance: balanceAfter },
                });

                // ── Create ADMIN_DEBIT transaction record (immutable offsetting entry) ──
                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'ADMIN_DEBIT',
                        amount: debitAmount.negated(), // ADMIN_DEBIT stored as negative
                        status: 'COMPLETED',
                        description: `Overpayment Reversal: Offset erroneous CASH_OUT ${txn.id} from Run 2 refund batch`,
                        balanceBefore,
                        balanceAfter,
                        referenceId: txn.referenceId, // Link to same game session
                    },
                });

                // ── Immutable AuditLog entry ──
                await tx.auditLog.create({
                    data: {
                        userId: userId, // The affected user — FK constraint requires real User ID
                        action: 'OVERPAYMENT_REVERSAL',
                        payload: {
                            erroneousTransactionId: txn.id,
                            erroneousType: 'CASH_OUT',
                            erroneousAmount: debitAmount.toString(),
                            reversalAmount: debitAmount.toString(),
                            affectedUser: username,
                            affectedUserId: userId,
                            balanceBefore: balanceBefore.toString(),
                            balanceAfter: balanceAfter.toString(),
                            reason: 'Run 2 refund script re-applied refund for BUY_IN already compensated by Run 1',
                            originalReferenceId: txn.referenceId,
                        },
                    },
                });

                // Record for summary
                results.push({
                    username,
                    originalRefund: `$${Number(debitAmount).toLocaleString()}`,
                    reversalDebit: `- $${Number(debitAmount).toLocaleString()}`,
                    balanceBefore: `$${Number(balanceBefore).toLocaleString()}`,
                    balanceAfter: `$${Number(balanceAfter).toLocaleString()}`,
                    erroneousTxnId: txn.id.slice(0, 12) + '...',
                });
            });

            reversedCount++;
            reversedTotal = reversedTotal.plus(debitAmount);
            console.log(`  ✅ ${username.padEnd(18)} -$${Number(debitAmount).toLocaleString().padStart(11)} (txn: ${txn.id.slice(0, 12)}...)`);
        } catch (err: any) {
            errors.push(`${username}: ${err.message}`);
            console.log(`  ❌ ${username.padEnd(18)} FAILED: ${err.message}`);
        }
    }

    // ── Step 3: Verification Summary ──
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  📊 REVERSAL SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Reversals executed:  ${reversedCount}/${run2Transactions.length}`);
    console.log(`  Total debited:       $${Number(reversedTotal).toLocaleString()}`);
    console.log(`  Errors:              ${errors.length}`);

    if (errors.length > 0) {
        console.log('\n  ── Errors ──');
        for (const err of errors) {
            console.log(`    ❌ ${err}`);
        }
    }

    // Tabulated per-user breakdown
    console.log('\n  ── Per-User Ledger ──');
    console.log('  ┌────────────────────┬───────────────┬───────────────┬───────────────┬───────────────┐');
    console.log('  │ User               │ Original Ref  │ Reversal      │ Bal Before    │ Bal After     │');
    console.log('  ├────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤');
    for (const r of results) {
        console.log(
            `  │ ${r.username.padEnd(18)} │ ${r.originalRefund.padStart(13)} │ ${r.reversalDebit.padStart(13)} │ ${r.balanceBefore.padStart(13)} │ ${r.balanceAfter.padStart(13)} │`,
        );
    }
    console.log('  └────────────────────┴───────────────┴───────────────┴───────────────┴───────────────┘');

    // Show final wallet balances
    console.log('\n  ── Final Wallet Balances ──');
    const userIds = [...new Set(run2Transactions.map(t => t.wallet.user.id))];
    for (const uid of userIds) {
        const wallet = await prisma.wallet.findFirst({
            where: { userId: uid },
            include: { user: { select: { username: true } } },
        });
        if (wallet) {
            console.log(`    ${wallet.user.username.padEnd(18)} | $${Number(wallet.realBalance).toLocaleString()}`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  NEXT STEPS:');
    console.log('  1. Force Audit → Admin > System Reconciliation > ⚡ Force Audit');
    console.log('  2. Verify MATCH status (drift should be $0.00)');
    console.log('  3. Run Drift Inspector → confirm 0 orphans');
    console.log('  4. Lift lockdown if all clear');
    console.log('═══════════════════════════════════════════════════════════\n');

    await prisma.$disconnect();
}

main().catch((err) => {
    console.error('Reversal script failed:', err);
    prisma.$disconnect();
    process.exit(1);
});
