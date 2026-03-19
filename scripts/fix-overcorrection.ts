/**
 * fix-overcorrection.ts — Reverses the $2,200,000 duplicate refund from Run 1.
 *
 * Run 1 (narrow window) created 2 CASH_OUT entries.
 * Run 2 (expanded window) created 16 CASH_OUT entries including the same 2 referenceIds.
 * This script finds and reverses the duplicate CASH_OUTs by:
 *   1. Finding referenceIds that have >1 CASH_OUT
 *   2. Deducting the excess from the wallets
 *   3. Soft-deleting (marking as FAILED) the duplicate CASH_OUT entries
 *
 * Run: docker exec cardgames-api npx ts-node scripts/fix-overcorrection.ts
 * Dry: docker exec cardgames-api npx ts-node scripts/fix-overcorrection.ts --dry-run
 */
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🔧 FIX OVERCORRECTION: Reverse Duplicate CASH_OUTs');
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN' : '⚡ LIVE'}`);
    console.log('═══════════════════════════════════════════════════\n');

    // Find referenceIds that have more than 1 CASH_OUT (duplicates)
    const duplicates = await prisma.$queryRaw<{
        referenceId: string;
        cashout_count: bigint;
    }[]>`
        SELECT "referenceId", COUNT(*) as cashout_count
        FROM "Transaction"
        WHERE type = 'CASH_OUT' AND status = 'COMPLETED' AND "referenceId" IS NOT NULL
        GROUP BY "referenceId"
        HAVING COUNT(*) > 1
        ORDER BY "referenceId"
    `;

    console.log(`Found ${duplicates.length} referenceIds with duplicate CASH_OUTs.\n`);

    if (duplicates.length === 0) {
        console.log('✅ No duplicates found. System is clean.');
        await prisma.$disconnect();
        return;
    }

    let totalReversed = 0;
    let reversedCount = 0;

    for (const dup of duplicates) {
        // Get all CASH_OUTs for this referenceId, ordered by creation time
        const cashOuts = await prisma.transaction.findMany({
            where: {
                referenceId: dup.referenceId,
                type: 'CASH_OUT',
                status: 'COMPLETED',
            },
            include: {
                wallet: { include: { user: { select: { id: true, username: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Keep the first one (from Run 1), reverse the rest
        const [keep, ...extras] = cashOuts;
        console.log(`  ref: ...${dup.referenceId.slice(-20)} | ${keep.wallet.user.username} | ${cashOuts.length} CASH_OUTs → removing ${extras.length}`);

        for (const extra of extras) {
            const amount = new Prisma.Decimal(extra.amount.toString()).abs();
            console.log(`    ↩️  Reversing $${Number(amount).toLocaleString()} (txn: ${extra.id.slice(0, 8)}...)`);

            if (!DRY_RUN) {
                await prisma.$transaction(async (tx) => {
                    // Lock wallet
                    const [wallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                        SELECT id, "realBalance" FROM "Wallet"
                        WHERE "userId" = ${extra.wallet.user.id}
                        FOR UPDATE
                    `;

                    const currentBalance = new Prisma.Decimal(wallet.realBalance.toString());
                    const newBalance = currentBalance.minus(amount);

                    // Deduct from wallet
                    await tx.wallet.update({
                        where: { id: wallet.id },
                        data: { realBalance: newBalance },
                    });

                    // Mark duplicate CASH_OUT as FAILED
                    await tx.transaction.update({
                        where: { id: extra.id },
                        data: {
                            status: 'REJECTED',
                            description: `[REVERSED] ${extra.description} — duplicate removed by fix-overcorrection`,
                        },
                    });

                    // Audit trail
                    await tx.auditLog.create({
                        data: {
                            userId: 'SYSTEM',
                            action: 'RECONCILIATION_REFUND',
                            payload: {
                                type: 'OVERCORRECTION_FIX',
                                reversedTransactionId: extra.id,
                                amount: amount.toString(),
                                referenceId: dup.referenceId,
                                user: extra.wallet.user.username,
                                balanceBefore: currentBalance.toString(),
                                balanceAfter: newBalance.toString(),
                            },
                        },
                    });
                });
            }

            totalReversed += Number(amount);
            reversedCount++;
        }
    }

    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`  Reversed: ${reversedCount} duplicate CASH_OUTs`);
    console.log(`  Total deducted: $${totalReversed.toLocaleString()}`);
    console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (applied)'}`);
    console.log(`═══════════════════════════════════════════════════\n`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
