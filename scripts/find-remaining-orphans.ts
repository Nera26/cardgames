/**
 * find-remaining-orphans.ts — Expanded Orphan Finder
 * Searches ALL BUY_INs across all time to find the remaining $369K drift.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Searching ALL orphaned BUY_INs (no time filter)...\n');

    const allBuyIns = await prisma.transaction.findMany({
        where: { type: 'BUY_IN', status: 'COMPLETED' },
        include: { wallet: { include: { user: { select: { id: true, username: true } } } } },
        orderBy: { createdAt: 'asc' },
    });

    let orphanTotal = 0;
    let orphanCount = 0;

    for (const b of allBuyIns) {
        if (!b.referenceId) continue;
        const cashOut = await prisma.transaction.findFirst({
            where: { referenceId: b.referenceId, type: 'CASH_OUT', status: 'COMPLETED' },
        });
        if (!cashOut) {
            orphanCount++;
            const amt = Math.abs(Number(b.amount));
            orphanTotal += amt;
            console.log(
                `  ${b.wallet.user.username.padEnd(20)} | $${amt.toLocaleString().padStart(12)} | ${b.createdAt.toISOString()} | ref: ${b.referenceId}`
            );
        }
    }

    console.log(`\n  Orphaned BUY_INs: ${orphanCount}`);
    console.log(`  Total ghost money: $${orphanTotal.toLocaleString()}`);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
