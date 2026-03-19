/**
 * audit-ghost-transactions.ts — Vault Audit Script (Prompt 1)
 *
 * Traces the $2,180,000 ghost money discrepancy by identifying
 * BUY_IN transactions that were never matched by a CASH_OUT.
 *
 * Run inside Docker:
 *   docker exec -it cardgames-api npx ts-node scripts/audit-ghost-transactions.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════
// CONFIG: Incident time window (Mar 15, 22:10 – 22:20 UTC+8)
// Adjust timezone offset as needed for your Postgres server
// ════════════════════════════════════════════════════
const WINDOW_START = new Date('2026-03-15T22:10:00+08:00');
const WINDOW_END = new Date('2026-03-15T22:20:00+08:00');

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🔍 VAULT AUDIT: Ghost Transaction Trace');
    console.log(`  Window: ${WINDOW_START.toISOString()} → ${WINDOW_END.toISOString()}`);
    console.log('═══════════════════════════════════════════════════\n');

    // ── Step 1: Fetch all BUY_IN transactions in the window ──
    const buyIns = await prisma.transaction.findMany({
        where: {
            type: 'BUY_IN',
            status: 'COMPLETED',
            createdAt: {
                gte: WINDOW_START,
                lte: WINDOW_END,
            },
        },
        include: {
            wallet: {
                include: {
                    user: { select: { id: true, username: true, email: true } },
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    console.log(`📥 Found ${buyIns.length} BUY_IN transactions in window.\n`);

    if (buyIns.length === 0) {
        console.log('No BUY_IN transactions found. Expanding search to full day...\n');

        // Fallback: search the full day
        const fullDayStart = new Date('2026-03-15T00:00:00+08:00');
        const fullDayEnd = new Date('2026-03-16T00:00:00+08:00');

        const allBuyIns = await prisma.transaction.findMany({
            where: {
                type: 'BUY_IN',
                status: 'COMPLETED',
                createdAt: {
                    gte: fullDayStart,
                    lte: fullDayEnd,
                },
            },
            include: {
                wallet: {
                    include: {
                        user: { select: { id: true, username: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log(`📥 Full day scan: ${allBuyIns.length} BUY_IN transactions.\n`);

        if (allBuyIns.length === 0) {
            console.log('✅ No BUY_IN transactions found. No ghost money from this vector.');
            await prisma.$disconnect();
            return;
        }

        await analyzeOrphans(allBuyIns);
    } else {
        await analyzeOrphans(buyIns);
    }

    // ── Step 2: Check for deposits/withdrawals in the window ──
    console.log('\n── Additional Context: Other Transactions in Window ──\n');

    const otherTxns = await prisma.transaction.findMany({
        where: {
            type: { in: ['DEPOSIT', 'WITHDRAW', 'CASH_OUT', 'ADMIN_CREDIT', 'ADMIN_DEBIT'] },
            status: 'COMPLETED',
            createdAt: {
                gte: WINDOW_START,
                lte: WINDOW_END,
            },
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

    if (otherTxns.length === 0) {
        console.log('No other transactions in window.');
    } else {
        for (const tx of otherTxns) {
            console.log(
                `  ${tx.type.padEnd(14)} | $${Number(tx.amount).toLocaleString().padStart(12)} | ` +
                `${tx.wallet.user.username.padEnd(20)} | ${tx.createdAt.toISOString()} | ${tx.description || ''}`,
            );
        }
    }

    // ── Step 3: Current wallet state snapshot ──
    console.log('\n── Current Wallet Snapshot (All Players) ──\n');

    const [walletSummary] = await prisma.$queryRaw<{ count: bigint; total: any }[]>`
        SELECT COUNT(*) as count, COALESCE(SUM(w."realBalance"), 0) as total
        FROM "Wallet" w
        INNER JOIN "User" u ON u.id = w."userId"
        WHERE u.type = 'PLAYER'
    `;

    console.log(`  Player wallets: ${walletSummary.count}`);
    console.log(`  Total balance:  $${Number(walletSummary.total).toLocaleString()}`);

    // ── Step 4: Latest reconciliation reports ──
    console.log('\n── Latest Reconciliation Reports ──\n');

    const reports = await prisma.reconciliationReport.findMany({
        orderBy: { timestamp: 'desc' },
        take: 5,
    });

    for (const r of reports) {
        const disc = Number(r.systemDiscrepancy);
        const status = r.status === 'MATCH' ? '✅ MATCH' : '🔴 DRIFT';
        console.log(
            `  ${r.timestamp.toISOString()} | ${status} | ` +
            `Wallets: $${Number(r.totalWalletBalance).toLocaleString()} | ` +
            `Chips: $${Number(r.totalChipsInPlay).toLocaleString()} | ` +
            `Expected: $${Number(r.expectedBalance).toLocaleString()} | ` +
            `Discrepancy: $${disc.toLocaleString()}`,
        );
    }

    await prisma.$disconnect();
}

/**
 * Analyze BUY_IN transactions and find orphans (no matching CASH_OUT).
 */
async function analyzeOrphans(buyIns: any[]) {
    let orphanCount = 0;
    let orphanTotal = 0;
    const affectedUsers: Map<string, { username: string; total: number; transactions: string[] }> = new Map();

    console.log('── Checking for orphaned BUY_INs (no matching CASH_OUT) ──\n');

    for (const buyIn of buyIns) {
        const refId = buyIn.referenceId;
        const amount = Math.abs(Number(buyIn.amount));
        const user = buyIn.wallet.user;

        // Find matching CASH_OUT with same referenceId
        let matchingCashOut = null;
        if (refId) {
            matchingCashOut = await prisma.transaction.findFirst({
                where: {
                    referenceId: refId,
                    type: 'CASH_OUT',
                    status: 'COMPLETED',
                },
            });
        }

        const status = matchingCashOut ? '✅ MATCHED' : '❌ ORPHANED';

        console.log(
            `  ${status} | BUY_IN $${amount.toLocaleString().padStart(12)} | ` +
            `${user.username.padEnd(20)} | ref: ${refId || 'N/A'} | ${buyIn.createdAt.toISOString()}`,
        );

        if (!matchingCashOut) {
            orphanCount++;
            orphanTotal += amount;

            const existing = affectedUsers.get(user.id) || {
                username: user.username,
                total: 0,
                transactions: [],
            };
            existing.total += amount;
            existing.transactions.push(buyIn.id);
            affectedUsers.set(user.id, existing);
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  📊 AUDIT SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Total BUY_INs analyzed:  ${buyIns.length}`);
    console.log(`  Orphaned (no CASH_OUT):  ${orphanCount}`);
    console.log(`  Ghost money total:       $${orphanTotal.toLocaleString()}`);
    console.log(`  Affected users:          ${affectedUsers.size}`);

    if (affectedUsers.size > 0) {
        console.log('\n── Affected Users Detail ──\n');
        for (const [userId, data] of affectedUsers) {
            console.log(
                `  ${data.username.padEnd(20)} | $${data.total.toLocaleString().padStart(12)} | ` +
                `${data.transactions.length} transaction(s) | userId: ${userId}`,
            );
        }
    }

    console.log('═══════════════════════════════════════════════════\n');
}

main().catch((err) => {
    console.error('Audit script failed:', err);
    prisma.$disconnect();
    process.exit(1);
});
