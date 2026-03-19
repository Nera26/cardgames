/**
 * find-gap-owner.ts — Find which wallets are out of sync with the pool
 */
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('=== PER-USER POOL CONTRIBUTION vs WALLET ===\n');

    // Get all wallets
    const wallets = await prisma.wallet.findMany({
        include: { user: { select: { id: true, username: true, type: true } } },
    });

    let totalExpected = 0;
    let totalActual = 0;

    for (const w of wallets) {
        // Pool-affecting transactions for this user:
        // IN: DEPOSIT, ADMIN_CREDIT, BONUS
        // OUT: WITHDRAW, ADMIN_DEBIT
        // NEUTRAL (wallet ↔ table): BUY_IN, CASH_OUT, RAKE

        const txns = await prisma.transaction.findMany({
            where: { walletId: w.id, status: 'COMPLETED' },
        });

        // Expected wallet = sum of all completed transaction amounts
        let expectedFromLedger = 0;
        let poolIn = 0;   // DEP + AC + BONUS
        let poolOut = 0;  // WD + AD
        let tableIn = 0;  // CASH_OUT
        let tableOut = 0; // BUY_IN (negative)
        let rake = 0;

        for (const t of txns) {
            const amt = Number(t.amount);
            expectedFromLedger += amt;

            switch (t.type) {
                case 'DEPOSIT': case 'ADMIN_CREDIT': case 'BONUS': poolIn += amt; break;
                case 'WITHDRAW': case 'ADMIN_DEBIT': poolOut += Math.abs(amt); break;
                case 'CASH_OUT': tableIn += amt; break;
                case 'BUY_IN': tableOut += Math.abs(amt); break;
                case 'RAKE': rake += Math.abs(amt); break;
            }
        }

        const actual = Number(w.realBalance);
        const gap = actual - expectedFromLedger;

        totalExpected += expectedFromLedger;
        totalActual += actual;

        // Only show users with a gap or significant activity
        if (Math.abs(gap) > 0.01 || poolIn > 0 || actual !== 0) {
            const marker = Math.abs(gap) > 0.01 ? '🔴' : '✅';
            console.log(`${marker} ${w.user.username.padEnd(18)} [${w.user.type}]`);
            console.log(`   Pool In:  +$${poolIn.toLocaleString()} | Pool Out: -$${poolOut.toLocaleString()} | Net Pool Contribution: $${(poolIn - poolOut).toLocaleString()}`);
            console.log(`   Table:    BUY_IN -$${tableOut.toLocaleString()} | CASH_OUT +$${tableIn.toLocaleString()} | Rake: $${rake.toLocaleString()}`);
            console.log(`   Expected: $${expectedFromLedger.toLocaleString()} | Actual: $${actual.toLocaleString()} | Gap: $${gap.toLocaleString()}\n`);
        }
    }

    console.log('════════════════════════════════════');
    console.log(`Total expected (all wallets): $${totalExpected.toLocaleString()}`);
    console.log(`Total actual (all wallets):   $${totalActual.toLocaleString()}`);
    console.log(`Total gap:                    $${(totalActual - totalExpected).toLocaleString()}`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
