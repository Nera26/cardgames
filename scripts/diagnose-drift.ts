/**
 * diagnose-drift.ts — Quick diagnostic to understand the exact source of drift
 */
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('=== DRIFT DIAGNOSTIC ===\n');

    // Count all transaction types
    const types = ['DEPOSIT', 'WITHDRAW', 'BUY_IN', 'CASH_OUT', 'BONUS', 'RAKE', 'ADMIN_CREDIT', 'ADMIN_DEBIT'];
    for (const type of types) {
        const result = await prisma.transaction.aggregate({
            where: { type: type as any, status: 'COMPLETED' },
            _count: true,
            _sum: { amount: true },
        });
        console.log(`${type.padEnd(15)} | Count: ${String(result._count).padStart(4)} | Sum: $${Number(result._sum.amount || 0).toLocaleString()}`);
    }

    console.log('\n=== WALLET TOTALS ===');
    const wallets = await prisma.wallet.aggregate({
        _sum: { realBalance: true, bonusBalance: true },
    });
    console.log(`Real balance total:  $${Number(wallets._sum.realBalance || 0).toLocaleString()}`);
    console.log(`Bonus balance total: $${Number(wallets._sum.bonusBalance || 0).toLocaleString()}`);

    console.log('\n=== GHOST CHIP REFUND CASH_OUTs ===');
    const refundCashOuts = await prisma.transaction.findMany({
        where: { type: 'CASH_OUT', status: 'COMPLETED', description: { contains: 'Reconciliation' } },
        select: { id: true, amount: true, referenceId: true, description: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });
    let refundTotal = 0;
    for (const c of refundCashOuts) {
        const amt = Number(c.amount);
        refundTotal += amt;
        console.log(`  $${amt.toLocaleString().padStart(12)} | ${c.createdAt.toISOString().slice(0,19)} | ${(c.description || '').slice(0,50)}`);
    }
    console.log(`  Total refund CASH_OUTs: ${refundCashOuts.length} → $${refundTotal.toLocaleString()}`);

    console.log('\n=== NORMAL CASH_OUTs (non-refund) ===');
    const normalCashOuts = await prisma.transaction.findMany({
        where: { 
            type: 'CASH_OUT', 
            status: 'COMPLETED', 
            OR: [
                { description: null },
                { description: { not: { contains: 'Reconciliation' } } },
            ],
        },
        select: { id: true, amount: true, referenceId: true, description: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });
    let normalTotal = 0;
    for (const c of normalCashOuts) {
        const amt = Number(c.amount);
        normalTotal += amt;
        console.log(`  $${amt.toLocaleString().padStart(12)} | ${c.createdAt.toISOString().slice(0,19)} | ${(c.description || 'N/A').slice(0,50)}`);
    }
    console.log(`  Total normal CASH_OUTs: ${normalCashOuts.length} → $${normalTotal.toLocaleString()}`);

    console.log('\n=== EXPECTED vs ACTUAL ===');
    const deposits = Number((await prisma.transaction.aggregate({ where: { type: 'DEPOSIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    const adminCredits = Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_CREDIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0);
    const withdrawals = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'WITHDRAW', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));
    const adminDebits = Math.abs(Number((await prisma.transaction.aggregate({ where: { type: 'ADMIN_DEBIT', status: 'COMPLETED' }, _sum: { amount: true } }))._sum.amount || 0));
    const pool = deposits + adminCredits - withdrawals - adminDebits;
    const walletTotal = Number(wallets._sum.realBalance || 0) + Number(wallets._sum.bonusBalance || 0);
    
    console.log(`Pool (Deposits + Credits - Withdrawals - Debits): $${pool.toLocaleString()}`);
    console.log(`Wallets (real + bonus): $${walletTotal.toLocaleString()}`);
    console.log(`Drift: $${(walletTotal - pool).toLocaleString()}`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
