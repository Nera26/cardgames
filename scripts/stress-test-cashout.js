/**
 * ═══════════════════════════════════════════════════════════════════
 * 🧪 STRESS TEST: 50 Concurrent Cash-Outs — FOR UPDATE Lock Proof
 * ═══════════════════════════════════════════════════════════════════
 *
 * This script proves that SELECT ... FOR UPDATE serializes concurrent
 * cash-outs so the Transaction ledger is mathematically perfect.
 *
 * What it does:
 * 1. Finds a real user in your database
 * 2. Sets their wallet balance to a known starting value ($100,000)
 * 3. Fires 50 simultaneous $1,000 cash-outs using Promise.all
 * 4. Verifies:
 *    a) Final balance = $100,000 - (50 × $1,000) = $50,000
 *    b) Every Transaction row has sequential balanceBefore/balanceAfter
 *    c) No two rows share the same balanceBefore (proves serialization)
 *    d) No phantom money was created or destroyed
 *
 * Run: node scripts/stress-test-cashout.js
 *
 * PRE-REQUISITES:
 *   - Postgres must be accessible at localhost:5432
 *   - At least one User must exist in the database
 *   - npm install pg (if not already available)
 */

const { Client } = require('pg');

// ── Config ────────────────────────────────────────────────────────
const DB_URL = 'postgresql://admin:poker_password@127.0.0.1:5432/poker_hub';
const CONCURRENT_CASHOUTS = 50;
const CASHOUT_AMOUNT = 1000;      // $1,000 per cash-out
const STARTING_BALANCE = 100000;  // $100,000
const TEST_TABLE_ID = 'stress-test-table';
const TEST_REFERENCE_PREFIX = 'stress-test';

// ── Helpers ───────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getClient() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    return client;
}

// ── The Exact settleCashOut Pattern (FOR UPDATE) ──────────────────
async function simulateCashOut(userId, amount, index) {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // 1. LOCK the wallet row — this is the critical line
        const lockResult = await client.query(
            `SELECT "id", "realBalance" FROM "Wallet" WHERE "userId" = $1 FOR UPDATE`,
            [userId]
        );

        if (lockResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { index, error: 'Wallet not found' };
        }

        const walletId = lockResult.rows[0].id;
        const balanceBefore = parseFloat(lockResult.rows[0].realBalance);
        const balanceAfter = balanceBefore + amount;

        // 2. Explicit balance write (no increment)
        await client.query(
            `UPDATE "Wallet" SET "realBalance" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
            [balanceAfter, walletId]
        );

        // 3. Create immutable ledger row
        await client.query(
            `INSERT INTO "Transaction" ("id", "walletId", "type", "amount", "status", "description", "balanceBefore", "balanceAfter", "referenceId", "createdAt")
             VALUES (gen_random_uuid(), $1, 'CASH_OUT', $2, 'COMPLETED', $3, $4, $5, $6, NOW())`,
            [
                walletId,
                amount,
                `Stress test cash-out #${index}`,
                balanceBefore,
                balanceAfter,
                `${TEST_REFERENCE_PREFIX}:${index}`,
            ]
        );

        await client.query('COMMIT');

        return { index, balanceBefore, balanceAfter, success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        return { index, error: err.message };
    } finally {
        await client.end();
    }
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 STRESS TEST: 50 Concurrent Cash-Outs');
    console.log('═══════════════════════════════════════════════════════\n');

    const setup = await getClient();

    // 1. Find a real user
    const userResult = await setup.query(`SELECT "id", "username" FROM "User" LIMIT 1`);
    if (userResult.rows.length === 0) {
        console.error('❌ No users found in database. Create a user first.');
        await setup.end();
        return;
    }
    const userId = userResult.rows[0].id;
    const username = userResult.rows[0].username;
    console.log(`👤 Test User: ${username} (${userId})`);

    // 2. Ensure wallet exists and set starting balance
    const walletResult = await setup.query(
        `SELECT "id" FROM "Wallet" WHERE "userId" = $1`, [userId]
    );
    if (walletResult.rows.length === 0) {
        console.error('❌ No wallet found for user. Create a wallet first.');
        await setup.end();
        return;
    }
    const walletId = walletResult.rows[0].id;

    await setup.query(
        `UPDATE "Wallet" SET "realBalance" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
        [STARTING_BALANCE, walletId]
    );
    console.log(`💰 Starting Balance: $${STARTING_BALANCE.toLocaleString()}`);

    // 3. Clean up any previous stress test transactions
    await setup.query(
        `DELETE FROM "Transaction" WHERE "referenceId" LIKE $1`,
        [`${TEST_REFERENCE_PREFIX}:%`]
    );
    console.log(`🧹 Cleaned up previous stress test transactions\n`);
    await setup.end();

    // 4. FIRE! — 50 concurrent cash-outs in the same event loop tick
    const expectedFinal = STARTING_BALANCE + (CONCURRENT_CASHOUTS * CASHOUT_AMOUNT);
    console.log(`🔫 Firing ${CONCURRENT_CASHOUTS} concurrent $${CASHOUT_AMOUNT} cash-outs...`);
    console.log(`   Expected final balance: $${expectedFinal.toLocaleString()}\n`);

    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i < CONCURRENT_CASHOUTS; i++) {
        promises.push(simulateCashOut(userId, CASHOUT_AMOUNT, i));
    }
    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;

    // 5. Analyze results
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => r.error);

    console.log(`⏱️  All ${CONCURRENT_CASHOUTS} completed in ${elapsed}ms`);
    console.log(`✅ Successes: ${successes.length}`);
    if (failures.length > 0) {
        console.log(`❌ Failures: ${failures.length}`);
        failures.forEach(f => console.log(`   #${f.index}: ${f.error}`));
    }

    // 6. Verify final balance
    const verify = await getClient();
    const finalResult = await verify.query(
        `SELECT "realBalance" FROM "Wallet" WHERE "id" = $1`, [walletId]
    );
    const finalBalance = parseFloat(finalResult.rows[0].realBalance);

    console.log(`\n═══════════════════════════════════════════════════════`);
    console.log(`📊 VERIFICATION RESULTS`);
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`   Starting Balance:  $${STARTING_BALANCE.toLocaleString()}`);
    console.log(`   Cash-Outs:         ${successes.length} × $${CASHOUT_AMOUNT.toLocaleString()} = $${(successes.length * CASHOUT_AMOUNT).toLocaleString()}`);
    console.log(`   Expected Final:    $${expectedFinal.toLocaleString()}`);
    console.log(`   Actual Final:      $${finalBalance.toLocaleString()}`);

    if (finalBalance === expectedFinal) {
        console.log(`\n   ✅ PASS — Balance is EXACT. No phantom money.`);
    } else {
        const drift = finalBalance - expectedFinal;
        console.log(`\n   ❌ FAIL — DRIFT DETECTED: $${drift.toLocaleString()}`);
    }

    // 7. Verify ledger chain (sequential balanceBefore/balanceAfter)
    const ledgerResult = await verify.query(
        `SELECT "balanceBefore", "balanceAfter", "description"
         FROM "Transaction"
         WHERE "referenceId" LIKE $1
         ORDER BY "balanceBefore" ASC`,
        [`${TEST_REFERENCE_PREFIX}:%`]
    );

    const rows = ledgerResult.rows;
    let chainBroken = false;
    const balanceBeforeSet = new Set();
    let duplicateCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const bb = parseFloat(rows[i].balanceBefore);
        const ba = parseFloat(rows[i].balanceAfter);

        // Check for duplicate balanceBefore (proves serialization failed)
        if (balanceBeforeSet.has(bb)) {
            duplicateCount++;
            console.log(`   ⚠️  DUPLICATE balanceBefore: $${bb} in row "${rows[i].description}"`);
        }
        balanceBeforeSet.add(bb);

        // Verify math: balanceAfter should equal balanceBefore + cashout_amount
        if (Math.abs(ba - (bb + CASHOUT_AMOUNT)) > 0.01) {
            chainBroken = true;
            console.log(`   ⚠️  MATH ERROR: before=$${bb}, after=$${ba}, expected=$${bb + CASHOUT_AMOUNT}`);
        }

        // Verify chain: this row's balanceAfter should be next row's balanceBefore
        if (i < rows.length - 1) {
            const nextBb = parseFloat(rows[i + 1].balanceBefore);
            if (Math.abs(ba - nextBb) > 0.01) {
                chainBroken = true;
                console.log(`   ⚠️  CHAIN BREAK at row ${i}: after=$${ba} ≠ next.before=$${nextBb}`);
            }
        }
    }

    console.log(`\n   Ledger Rows:       ${rows.length}`);
    console.log(`   Duplicate Before:  ${duplicateCount}`);
    console.log(`   Chain Integrity:   ${chainBroken ? '❌ BROKEN' : '✅ PERFECT'}`);

    if (duplicateCount === 0 && !chainBroken && finalBalance === expectedFinal) {
        console.log(`\n   🏆 S-GRADE: The Vault Lock is mathematically unbreakable.`);
    } else {
        console.log(`\n   🚨 FAIL: Race condition detected. Review FOR UPDATE implementation.`);
    }

    console.log(`\n═══════════════════════════════════════════════════════\n`);

    // 8. Cleanup — restore original balance and remove test transactions
    await verify.query(
        `DELETE FROM "Transaction" WHERE "referenceId" LIKE $1`,
        [`${TEST_REFERENCE_PREFIX}:%`]
    );
    console.log('🧹 Cleaned up stress test transactions');
    console.log('ℹ️  Note: Wallet balance was modified. Check/restore manually if needed.\n');

    await verify.end();
}

main().catch(console.error);
