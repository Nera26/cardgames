#!/usr/bin/env npx ts-node
/**
 * 🔴 9-Max Stress Test — Rapid-Fire Socket Event Simulator
 *
 * Simulates 9 concurrent players bombarding the server with game actions
 * to validate that the Smooth Gameplay performance patch holds under load.
 *
 * Usage:
 *   npx ts-node scripts/stress-test-9max.ts [tableId] [rounds]
 *
 * Defaults:
 *   tableId = "test-table-1"
 *   rounds  = 50 (rapid-fire action cycles)
 *
 * What it tests:
 *   1. Connection burst — 9 sockets connect within 100ms
 *   2. Subscribe storm — all 9 subscribe to table_state simultaneously
 *   3. Rapid actions — fold/check/call/raise at 50ms intervals
 *   4. Measures round-trip latency per event
 *   5. Reports P50/P95/P99 latencies + dropped events
 */

import { io, Socket } from 'socket.io-client';

// ── CONFIG ──────────────────────────────────────────────────
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TABLE_ID = process.argv[2] || 'test-table-1';
const ROUNDS = parseInt(process.argv[3] || '50', 10);
const NUM_PLAYERS = 9;
const ACTION_INTERVAL_MS = 50; // Time between rapid-fire actions

// ── METRICS ─────────────────────────────────────────────────
interface Metrics {
    latencies: number[];
    stateUpdatesReceived: number;
    errors: number;
    connectionTimeMs: number;
}

const metrics: Metrics = {
    latencies: [],
    stateUpdatesReceived: 0,
    errors: 0,
    connectionTimeMs: 0,
};

// ── HELPERS ─────────────────────────────────────────────────
function percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)] || 0;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── PLAYER SIMULATION ───────────────────────────────────────
async function createPlayer(seatIndex: number, token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
        const socket = io(`${API_URL}/game`, {
            transports: ['websocket'],
            auth: { token },
            timeout: 5000,
        });

        socket.on('connect', () => {
            console.log(`  ✅ Seat ${seatIndex} connected (${socket.id})`);
            resolve(socket);
        });

        socket.on('connect_error', (err) => {
            console.error(`  ❌ Seat ${seatIndex} connection failed: ${err.message}`);
            metrics.errors++;
            reject(err);
        });

        // Count state updates
        socket.on('table_state', () => {
            metrics.stateUpdatesReceived++;
        });

        socket.on('error', (err: any) => {
            metrics.errors++;
            console.error(`  ⚠️ Seat ${seatIndex} error: ${err?.message || err}`);
        });
    });
}

async function simulateAction(socket: Socket, seatIndex: number, action: string): Promise<number> {
    const start = performance.now();

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            // If no response in 2s, count as dropped
            metrics.errors++;
            resolve(2000);
        }, 2000);

        socket.emit('player_action', { tableId: TABLE_ID, action, amount: 0 }, () => {
            clearTimeout(timeout);
            const latency = performance.now() - start;
            metrics.latencies.push(latency);
            resolve(latency);
        });
    });
}

// ── STRESS TEST PHASES ──────────────────────────────────────

async function phase1_ConnectionBurst(tokens: string[]): Promise<Socket[]> {
    console.log('\n🔴 Phase 1: Connection Burst (9 sockets in 100ms)');
    const start = performance.now();

    const connectionPromises = tokens.map((token, i) => createPlayer(i, token));
    const sockets = await Promise.allSettled(connectionPromises);

    metrics.connectionTimeMs = performance.now() - start;
    console.log(`  ⏱️ All connections resolved in ${metrics.connectionTimeMs.toFixed(1)}ms`);

    return sockets
        .filter((r): r is PromiseFulfilledResult<Socket> => r.status === 'fulfilled')
        .map((r) => r.value);
}

async function phase2_SubscribeStorm(sockets: Socket[]): Promise<void> {
    console.log('\n🔴 Phase 2: Subscribe Storm (all 9 subscribe simultaneously)');
    const start = performance.now();

    const subscribePromises = sockets.map(
        (socket) =>
            new Promise<void>((resolve) => {
                socket.emit('subscribe_table', { tableId: TABLE_ID }, () => resolve());
                // Fallback if no ack
                setTimeout(resolve, 1000);
            }),
    );

    await Promise.all(subscribePromises);
    const elapsed = performance.now() - start;
    console.log(`  ⏱️ All subscriptions completed in ${elapsed.toFixed(1)}ms`);
    console.log(`  📊 State updates received so far: ${metrics.stateUpdatesReceived}`);
}

async function phase3_RapidFireActions(sockets: Socket[]): Promise<void> {
    console.log(`\n🔴 Phase 3: Rapid-Fire Actions (${ROUNDS} rounds × ${sockets.length} players)`);

    const actions = ['fold', 'check', 'call', 'raise'];

    for (let round = 0; round < ROUNDS; round++) {
        // Each round: all players fire an action simultaneously
        const roundActions = sockets.map((socket, i) => {
            const action = actions[Math.floor(Math.random() * actions.length)];
            return simulateAction(socket, i, action);
        });

        await Promise.all(roundActions);

        // Brief pause between rounds (simulates real gameplay cadence)
        await sleep(ACTION_INTERVAL_MS);

        if ((round + 1) % 10 === 0) {
            const p50 = percentile(metrics.latencies, 50);
            console.log(
                `  Round ${round + 1}/${ROUNDS} — P50: ${p50.toFixed(1)}ms, ` +
                `updates: ${metrics.stateUpdatesReceived}, errors: ${metrics.errors}`,
            );
        }
    }
}

// ── REPORT ──────────────────────────────────────────────────
function generateReport(sockets: Socket[]): void {
    console.log('\n' + '═'.repeat(60));
    console.log('  🏁 STRESS TEST REPORT — 9-Max Rapid-Fire');
    console.log('═'.repeat(60));

    const totalActions = metrics.latencies.length;
    const p50 = percentile(metrics.latencies, 50);
    const p95 = percentile(metrics.latencies, 95);
    const p99 = percentile(metrics.latencies, 99);
    const avg = metrics.latencies.reduce((a, b) => a + b, 0) / totalActions || 0;

    console.log(`
  Config:
    Table:           ${TABLE_ID}
    Players:         ${sockets.length}/${NUM_PLAYERS}
    Rounds:          ${ROUNDS}
    Action Interval: ${ACTION_INTERVAL_MS}ms

  Connection:
    Burst Time:      ${metrics.connectionTimeMs.toFixed(1)}ms (for ${sockets.length} sockets)

  Latency (action round-trip):
    Average:         ${avg.toFixed(2)}ms
    P50:             ${p50.toFixed(2)}ms
    P95:             ${p95.toFixed(2)}ms
    P99:             ${p99.toFixed(2)}ms

  Throughput:
    Total Actions:   ${totalActions}
    State Updates:   ${metrics.stateUpdatesReceived}
    Errors/Dropped:  ${metrics.errors}

  Verdict:
    ${p95 < 16 ? '✅ S-GRADE — P95 under 16ms frame budget' : p95 < 50 ? '🟡 ACCEPTABLE — P95 under 50ms' : '🔴 NEEDS WORK — P95 exceeds 50ms'}
`);

    console.log('═'.repeat(60));
}

// ── MAIN ────────────────────────────────────────────────────
async function main(): Promise<void> {
    console.log('🃏 9-Max Stress Test — Smooth Gameplay Validation');
    console.log(`   Target: ${API_URL}`);
    console.log(`   Table:  ${TABLE_ID}`);
    console.log(`   Rounds: ${ROUNDS}`);

    // Generate mock JWT tokens (these won't pass real auth but test the socket layer)
    // In production, you'd authenticate first via /auth/login
    console.log('\n⚠️  This script requires valid JWT tokens to connect.');
    console.log('   Set TEST_TOKENS env var with comma-separated JWTs, or modify the tokens array below.\n');

    const tokenEnv = process.env.TEST_TOKENS || '';
    const tokens = tokenEnv
        ? tokenEnv.split(',').slice(0, NUM_PLAYERS)
        : Array.from({ length: NUM_PLAYERS }, (_, i) => `test-token-seat-${i}`);

    if (!tokenEnv) {
        console.log('   Using placeholder tokens (connections will likely fail without real auth).');
        console.log('   To use real tokens: TEST_TOKENS="jwt1,jwt2,...,jwt9" npx ts-node scripts/stress-test-9max.ts\n');
    }

    try {
        // Phase 1: Connection burst
        const sockets = await phase1_ConnectionBurst(tokens);

        if (sockets.length === 0) {
            console.error('\n❌ No connections established. Check your API_URL and tokens.');
            process.exit(1);
        }

        // Phase 2: Subscribe storm
        await phase2_SubscribeStorm(sockets);

        // Brief settle time
        await sleep(500);

        // Phase 3: Rapid-fire actions
        await phase3_RapidFireActions(sockets);

        // Report
        generateReport(sockets);

        // Cleanup
        console.log('🧹 Disconnecting all sockets...');
        sockets.forEach((s) => s.disconnect());

        await sleep(500);
        console.log('✅ Done.\n');
        process.exit(0);
    } catch (err: any) {
        console.error('\n💥 Fatal error:', err.message);
        process.exit(1);
    }
}

main();
