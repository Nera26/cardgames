/**
 * deep-drift-diagnostic.ts — Understanding where the $369K gap lives
 */
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('=== DEEP DRIFT DIAGNOSTIC ===\n');

    // 1. REJECTED transactions (from fix-overcorrection.ts)
    const rejected = await prisma.transaction.findMany({
        where: { status: 'REJECTED' },
        include: { wallet: { include: { user: { select: { username: true } } } } },
    });
    console.log('── REJECTED Transactions ──');
    let rejTotal = 0;
    for (const t of rejected) {
        const amt = Math.abs(Number(t.amount));
        rejTotal += amt;
        console.log(`  ${t.type.padEnd(12)} | $${amt.toLocaleString().padStart(11)} | ${t.wallet.user.username.padEnd(15)} | ${(t.description || '').slice(0, 60)}`);
    }
    console.log(`  Total REJECTED: ${rejected.length} → $${rejTotal.toLocaleString()}\n`);

    // 2. Reclassified BUY_INs (ex-ADMIN_DEBITs from reclassify-reversals.ts)
    const reclassified = await prisma.transaction.findMany({
        where: { type: 'BUY_IN', description: { contains: 'Overpayment' } },
        include: { wallet: { include: { user: { select: { username: true } } } } },
    });
    console.log('── Reclassified BUY_INs (ex-ADMIN_DEBITs) ──');
    let reclTotal = 0;
    for (const t of reclassified) {
        const amt = Math.abs(Number(t.amount));
        reclTotal += amt;
        console.log(`  ${t.type.padEnd(12)} | $${amt.toLocaleString().padStart(11)} | ${t.wallet.user.username.padEnd(15)} | ref: ${(t.referenceId || 'null').slice(-10)}`);
    }
    console.log(`  Total reclassified: ${reclassified.length} → $${reclTotal.toLocaleString()}\n`);

    // 3. Current ADMIN_DEBITs
    const debits = await prisma.transaction.findMany({
        where: { type: 'ADMIN_DEBIT', status: 'COMPLETED' },
        include: { wallet: { include: { user: { select: { username: true } } } } },
    });
    console.log('── ADMIN_DEBIT Entries ──');
    for (const t of debits) {
        console.log(`  $${Number(t.amount).toLocaleString().padStart(13)} | ${t.wallet.user.username.padEnd(15)} | ${(t.description || '').slice(0, 70)}`);
    }
    console.log(`  Total: ${debits.length}\n`);

    // 4. Pool equation rebuilt with awareness of REJECTED rows
    console.log('── Rebuilt Pool Equation ──');
    const dep = Number((await prisma.transaction.aggregate({ where: { type: 'DEPOSIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    const ac = Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_CREDIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    const wd = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'WITHDRAW', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));
    const ad = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_DEBIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));

    // CASH_OUTs that are COMPLETED (incl. Ghost Chip Refund runs)
    const cashOutCompleted = Number((await prisma.transaction.aggregate({ where: { type: 'CASH_OUT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    const cashOutRejected = Number((await prisma.transaction.aggregate({ where: { type: 'CASH_OUT', status: 'REJECTED' }, _sum: { amount: true } }))._sum.amount || 0);
    const buyInCompleted = Number((await prisma.transaction.aggregate({ where: { type: 'BUY_IN', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    
    const wallets = await prisma.wallet.aggregate({ _sum: { realBalance: true, bonusBalance: true } });
    const walletTotal = Number(wallets._sum.realBalance || 0) + Number(wallets._sum.bonusBalance || 0);

    console.log(`  Deposits:          $${dep.toLocaleString()}`);
    console.log(`  Admin Credits:     $${ac.toLocaleString()}`);
    console.log(`  Withdrawals:       $${wd.toLocaleString()}`);
    console.log(`  Admin Debits:      $${ad.toLocaleString()}`);
    console.log(`  Pool:              $${(dep + ac - wd - ad).toLocaleString()}`);
    console.log(`  Wallet Total:      $${walletTotal.toLocaleString()}`);
    console.log(`  Drift:             $${(walletTotal - (dep + ac - wd - ad)).toLocaleString()}`);
    console.log('');
    console.log(`  CASH_OUT (COMPLETED sum): $${cashOutCompleted.toLocaleString()}`);
    console.log(`  CASH_OUT (REJECTED sum):  $${cashOutRejected.toLocaleString()}`);
    console.log(`  BUY_IN (COMPLETED sum):   $${buyInCompleted.toLocaleString()}`);

    // 5. The fix: what the pool SHOULD be if we account for REJECTED CASH_OUTs as wallet debits
    console.log('\n── Root Cause Analysis ──');
    console.log(`  REJECTED CASH_OUTs total: $${rejTotal.toLocaleString()}`);
    console.log(`  These represent wallet debits with no offsetting pool transaction.`);
    console.log(`  If we issue ADMIN_CREDITs of $${rejTotal.toLocaleString()} to match, drift goes to $${(walletTotal + rejTotal - (dep + ac + rejTotal - wd - ad)).toLocaleString()}`);
    console.log(`  OR: We adjust the pool equation to recognize these. The real fix is an ADMIN_CREDIT of $${(dep + ac - wd - ad - walletTotal).toLocaleString()} to the affected users.`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
