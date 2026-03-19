/**
 * reclassify-reversals.ts — Fix the pool equation by reclassifying
 * the 16 reversal ADMIN_DEBIT entries to BUY_IN (pool-neutral).
 *
 * Two-step process:
 *   1. Null out the referenceId on each reversal entry (avoids [referenceId, type] unique constraint)
 *   2. Change type from ADMIN_DEBIT → BUY_IN
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('  🔄 RECLASSIFY: ADMIN_DEBIT → BUY_IN');
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN' : '⚡ LIVE'}`);
    console.log('═══════════════════════════════════════════════\n');

    // Find the 16 reversal ADMIN_DEBIT entries
    const reversals = await prisma.transaction.findMany({
        where: {
            type: 'ADMIN_DEBIT',
            status: 'COMPLETED',
            description: { contains: 'Overpayment Reversal' },
        },
        include: {
            wallet: { include: { user: { select: { username: true } } } },
        },
        orderBy: { createdAt: 'asc' },
    });

    console.log(`Found ${reversals.length} ADMIN_DEBIT reversal entries to reclassify.\n`);

    for (const r of reversals) {
        console.log(`  ${r.wallet.user.username.padEnd(18)} | $${Math.abs(Number(r.amount)).toLocaleString().padStart(11)} | ref: ${(r.referenceId || 'null').slice(-12)} | ${r.id.slice(0, 16)}...`);
    }

    if (reversals.length === 0) {
        console.log('✅ Nothing to reclassify.');
        await prisma.$disconnect();
        return;
    }

    if (DRY_RUN) {
        console.log(`\n🔍 DRY RUN: Would reclassify ${reversals.length} entries.`);
        await prisma.$disconnect();
        return;
    }

    // Step 1: Null out referenceIds (to avoid unique constraint on [referenceId, type])
    console.log('\n  Step 1: Clearing referenceIds...');
    for (const r of reversals) {
        await prisma.transaction.update({
            where: { id: r.id },
            data: { referenceId: null },
        });
    }
    console.log(`  ✅ Cleared ${reversals.length} referenceIds`);

    // Step 2: Reclassify to BUY_IN
    console.log('  Step 2: Reclassifying ADMIN_DEBIT → BUY_IN...');
    const result = await prisma.transaction.updateMany({
        where: {
            id: { in: reversals.map(r => r.id) },
        },
        data: {
            type: 'BUY_IN',
        },
    });

    console.log(`\n✅ Reclassified ${result.count} entries from ADMIN_DEBIT → BUY_IN`);
    console.log('   These are now pool-neutral. Force Audit should show $0 drift.\n');

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
