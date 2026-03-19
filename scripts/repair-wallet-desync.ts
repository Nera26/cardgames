/**
 * repair-wallet-desync.ts — Materialized State Repair
 *
 * PROBLEM:
 *   Some wallet balances have desynced from their transactional ledger.
 *   The ledger (Transaction table) is the source of truth.
 *   The wallet (Wallet.realBalance) is a materialized view that drifted.
 *
 * FIX:
 *   1. Sweep ALL wallets in the database
 *   2. For each, SUM all COMPLETED transactions → "True Ledger Balance"
 *   3. Compare to wallet.realBalance
 *   4. If they differ, force-update the wallet to match the ledger
 *   5. Log a WALLET_SYNC_REPAIR entry in AuditLog (no new Transaction row)
 *
 * SAFETY:
 *   - prisma.$transaction with SELECT ... FOR UPDATE row locking
 *   - AuditLog captures old/new balance for full forensic traceability
 *   - --dry-run flag for safe pre-execution verification
 *   - No new Transaction rows created (ledger is already correct)
 *
 * Run:     docker exec cardgames-api npx ts-node scripts/repair-wallet-desync.ts
 * Dry-run: docker exec cardgames-api npx ts-node scripts/repair-wallet-desync.ts --dry-run
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🔧 MATERIALIZED STATE REPAIR: Wallet ↔ Ledger Sync');
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no mutations)' : '⚡ LIVE (will mutate database)'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ── Phase 1: Global Wallet Sweep ──
    console.log('── Phase 1: Global Wallet Sweep ──\n');

    const wallets = await prisma.wallet.findMany({
        include: { user: { select: { id: true, username: true, type: true } } },
    });

    console.log(`  Scanning ${wallets.length} wallet(s)...\n`);

    type DesyncRecord = {
        userId: string;
        username: string;
        userType: string;
        walletId: string;
        currentBalance: Prisma.Decimal;
        ledgerBalance: Prisma.Decimal;
        delta: Prisma.Decimal;
    };

    const desyncs: DesyncRecord[] = [];
    const synced: string[] = [];

    for (const wallet of wallets) {
        // Calculate the True Ledger Balance: SUM of all COMPLETED transactions
        const txnSum = await prisma.transaction.aggregate({
            where: { walletId: wallet.id, status: 'COMPLETED' },
            _sum: { amount: true },
        });

        const ledgerBalance = new Prisma.Decimal(txnSum._sum.amount?.toString() || '0');
        const currentBalance = new Prisma.Decimal(wallet.realBalance.toString());
        const delta = currentBalance.minus(ledgerBalance);

        if (!delta.isZero()) {
            desyncs.push({
                userId: wallet.user.id,
                username: wallet.user.username,
                userType: wallet.user.type,
                walletId: wallet.id,
                currentBalance,
                ledgerBalance,
                delta,
            });
        } else {
            synced.push(wallet.user.username);
        }
    }

    // Show synced wallets
    console.log(`  ✅ Synced wallets (${synced.length}): ${synced.join(', ')}\n`);

    // Show desynced wallets
    if (desyncs.length === 0) {
        console.log('  ✅ All wallets are perfectly synced with their ledger history.');
        console.log('     No repair needed.\n');
        await prisma.$disconnect();
        return;
    }

    console.log(`  🔴 Desynced wallets: ${desyncs.length}\n`);
    console.log('  ┌────────────────────┬──────────┬───────────────────┬───────────────────┬───────────────────┐');
    console.log('  │ User               │ Type     │ Wallet Balance    │ Ledger Balance    │ Delta             │');
    console.log('  ├────────────────────┼──────────┼───────────────────┼───────────────────┼───────────────────┤');

    let totalDelta = new Prisma.Decimal(0);
    for (const d of desyncs) {
        const direction = d.delta.isPositive() ? '↑ surplus' : '↓ deficit';
        console.log(
            `  │ ${d.username.padEnd(18)} │ ${d.userType.padEnd(8)} │ $${Number(d.currentBalance).toLocaleString().padStart(15)} │ $${Number(d.ledgerBalance).toLocaleString().padStart(15)} │ $${Number(d.delta).toLocaleString().padStart(12)} ${direction.padEnd(3)}│`,
        );
        totalDelta = totalDelta.plus(d.delta);
    }

    console.log('  └────────────────────┴──────────┴───────────────────┴───────────────────┴───────────────────┘');
    console.log(`\n  Net wallet delta: $${Number(totalDelta).toLocaleString()}`);
    console.log(`  (This is the total amount wallets are OVER their ledger truth)\n`);

    // ── Phase 2: Transaction breakdown for each desynced wallet ──
    console.log('── Phase 2: Transaction Breakdown (Desynced Wallets) ──\n');

    for (const d of desyncs) {
        const types = ['DEPOSIT', 'WITHDRAW', 'BUY_IN', 'CASH_OUT', 'BONUS', 'RAKE', 'ADMIN_CREDIT', 'ADMIN_DEBIT'];
        console.log(`  📋 ${d.username} (${d.userType}):`);

        for (const type of types) {
            const agg = await prisma.transaction.aggregate({
                where: { walletId: d.walletId, type: type as any, status: 'COMPLETED' },
                _sum: { amount: true },
                _count: true,
            });
            if (agg._count > 0) {
                console.log(`    ${type.padEnd(14)} | Count: ${String(agg._count).padStart(3)} | Sum: $${Number(agg._sum.amount || 0).toLocaleString()}`);
            }
        }

        console.log(`    ─────────────────────────────────────────`);
        console.log(`    Ledger balance:  $${Number(d.ledgerBalance).toLocaleString()}`);
        console.log(`    Wallet balance:  $${Number(d.currentBalance).toLocaleString()}`);
        console.log(`    Delta to fix:    $${Number(d.delta).toLocaleString()}\n`);
    }

    if (DRY_RUN) {
        console.log('🔍 DRY RUN complete. No mutations made.');
        console.log(`   Would repair ${desyncs.length} wallet(s).`);
        console.log('   Run without --dry-run to execute the materialized state repair.\n');

        // Projected post-repair drift
        console.log('  ── Projected Post-Repair Drift ──');
        const deposits = Number((await prisma.transaction.aggregate({ where: { type: 'DEPOSIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
        const adminCredits = Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_CREDIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
        const withdrawals = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'WITHDRAW', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));
        const adminDebits = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_DEBIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));
        const pool = deposits + adminCredits - withdrawals - adminDebits;

        // After repair, wallet total will be (current total - total delta)
        const walletAgg = await prisma.wallet.aggregate({ _sum: { realBalance: true, bonusBalance: true } });
        const currentWalletTotal = Number(walletAgg._sum.realBalance || 0) + Number(walletAgg._sum.bonusBalance || 0);
        const repairedWalletTotal = currentWalletTotal - Number(totalDelta);

        console.log(`    Pool:              $${pool.toLocaleString()}`);
        console.log(`    Current wallets:   $${currentWalletTotal.toLocaleString()}`);
        console.log(`    Repaired wallets:  $${repairedWalletTotal.toLocaleString()}`);
        console.log(`    Current drift:     $${(currentWalletTotal - pool).toLocaleString()}`);
        console.log(`    Projected drift:   $${(repairedWalletTotal - pool).toLocaleString()}\n`);

        await prisma.$disconnect();
        return;
    }

    // ── Phase 3: Execute Materialized State Repair ──
    console.log('⚡ Executing materialized state repair...\n');

    let repairedCount = 0;
    const errors: string[] = [];

    const results: {
        username: string;
        userType: string;
        oldBalance: string;
        newBalance: string;
        delta: string;
    }[] = [];

    for (const d of desyncs) {
        try {
            await prisma.$transaction(async (tx) => {
                // ── Lock the wallet row ──
                const [wallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                    SELECT id, "realBalance"
                    FROM "Wallet"
                    WHERE "userId" = ${d.userId}
                    FOR UPDATE
                `;

                if (!wallet) throw new Error(`Wallet not found for user ${d.userId}`);

                const currentBal = new Prisma.Decimal(wallet.realBalance.toString());

                // Recompute inside the transaction (in case of concurrent changes)
                const txnSum = await tx.transaction.aggregate({
                    where: { walletId: wallet.id, status: 'COMPLETED' },
                    _sum: { amount: true },
                });
                const trueLedgerBalance = new Prisma.Decimal(txnSum._sum.amount?.toString() || '0');

                // ── Force-update wallet to match ledger ──
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { realBalance: trueLedgerBalance },
                });

                // ── AuditLog entry (no Transaction row — ledger is already correct) ──
                await tx.auditLog.create({
                    data: {
                        userId: d.userId,
                        action: 'WALLET_SYNC_REPAIR',
                        payload: {
                            walletId: wallet.id,
                            oldBalance: currentBal.toString(),
                            newBalance: trueLedgerBalance.toString(),
                            delta: currentBal.minus(trueLedgerBalance).toString(),
                            reason: 'Repairing materialized wallet balance to match immutable ledger history. ' +
                                'A prior database operation created a transaction record but failed to update the wallet balance.',
                            repairedAt: new Date().toISOString(),
                        },
                    },
                });

                results.push({
                    username: d.username,
                    userType: d.userType,
                    oldBalance: `$${Number(currentBal).toLocaleString()}`,
                    newBalance: `$${Number(trueLedgerBalance).toLocaleString()}`,
                    delta: `$${Number(currentBal.minus(trueLedgerBalance)).toLocaleString()}`,
                });
            });

            repairedCount++;
            console.log(`  ✅ ${d.username.padEnd(18)} $${Number(d.currentBalance).toLocaleString()} → $${Number(d.ledgerBalance).toLocaleString()}`);
        } catch (err: any) {
            errors.push(`${d.username}: ${err.message}`);
            console.log(`  ❌ ${d.username.padEnd(18)} FAILED: ${err.message}`);
        }
    }

    // ── Phase 4: Verification Summary ──
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📊 REPAIR SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Wallets repaired:  ${repairedCount}/${desyncs.length}`);
    console.log(`  Errors:            ${errors.length}`);

    if (errors.length > 0) {
        console.log('\n  ── Errors ──');
        for (const err of errors) {
            console.log(`    ❌ ${err}`);
        }
    }

    // Results table
    console.log('\n  ── Per-Wallet Repair Ledger ──');
    console.log('  ┌────────────────────┬──────────┬───────────────────┬───────────────────┬──────────────────┐');
    console.log('  │ User               │ Type     │ Old Balance       │ New Balance       │ Delta            │');
    console.log('  ├────────────────────┼──────────┼───────────────────┼───────────────────┼──────────────────┤');
    for (const r of results) {
        console.log(
            `  │ ${r.username.padEnd(18)} │ ${r.userType.padEnd(8)} │ ${r.oldBalance.padStart(17)} │ ${r.newBalance.padStart(17)} │ ${r.delta.padStart(16)} │`,
        );
    }
    console.log('  └────────────────────┴──────────┴───────────────────┴───────────────────┴──────────────────┘');

    // Post-repair drift check
    console.log('\n  ── Post-Repair Drift Check ──');
    const deposits = Number((await prisma.transaction.aggregate({ where: { type: 'DEPOSIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    const adminCredits = Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_CREDIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    const withdrawals = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'WITHDRAW', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));
    const adminDebits = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_DEBIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));
    const pool = deposits + adminCredits - withdrawals - adminDebits;

    const walletAgg = await prisma.wallet.aggregate({ _sum: { realBalance: true, bonusBalance: true } });
    const walletTotal = Number(walletAgg._sum.realBalance || 0) + Number(walletAgg._sum.bonusBalance || 0);

    console.log(`    Pool:    $${pool.toLocaleString()}`);
    console.log(`    Wallets: $${walletTotal.toLocaleString()}`);
    console.log(`    Drift:   $${(walletTotal - pool).toLocaleString()}`);
    console.log(`    Status:  ${Math.abs(walletTotal - pool) < 0.01 ? '✅ MATCH' : '🔴 DRIFT'}`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  NEXT STEPS:');
    console.log('  1. Run diagnose-drift.ts → confirm Drift = $0');
    console.log('  2. Force Audit → Admin > System Reconciliation > ⚡ Force Audit');
    console.log('  3. Verify MATCH status on the dashboard');
    console.log('  4. Lift lockdown if all clear');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await prisma.$disconnect();
}

main().catch((err) => {
    console.error('Repair script failed:', err);
    prisma.$disconnect();
    process.exit(1);
});
