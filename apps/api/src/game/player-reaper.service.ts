/**
 * Player Reaper Service — The Dead Man's Switch (v2: Two-Tier)
 * 
 * Runs a sweep every 30 seconds with two separate rules:
 * 
 * RULE A (Crash): connection == 'offline' AND last_seen > 60s → Kick
 *   - Player lost connection, had 60s to reconnect, didn't.
 * 
 * RULE B (AFK): status == 'sitting_out' AND sit_out_start > 10 min → Kick
 *   - Player went AFK (timeout fold), had 10 min to return, didn't.
 * 
 * When kicked: runs leave_table.lua → refunds chips → broadcasts state → system chat.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LuaRunnerService } from './lua-runner.service';
import { GameGateway } from './game.gateway';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@poker/shared';

const SWEEP_INTERVAL_MS = 30_000;       // Sweep every 30 seconds
const CRASH_THRESHOLD_MS = 60_000;      // 60s for crash recovery
const AFK_THRESHOLD_MS = 10 * 60_000;   // 10 minutes for AFK

interface LuaResponse {
    success: boolean;
    message: string;
    tableState?: unknown;
}

@Injectable()
export class PlayerReaperService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger('💀 Reaper');
    private sweepInterval: NodeJS.Timeout | null = null;

    constructor(
        private readonly luaRunner: LuaRunnerService,
        @Inject(forwardRef(() => GameGateway))
        private readonly gameGateway: GameGateway,
        private readonly auditService: AuditService,
        @InjectQueue('cashout-settlement')
        private readonly cashoutQueue: Queue,
    ) { }

    async onModuleInit(): Promise<void> {
        // Start the sweep loop after a startup delay
        // (gives clients time to reconnect after a restart)
        setTimeout(() => {
            this.sweepInterval = setInterval(
                () => this.sweep().catch(err => this.logger.error(`Sweep failed: ${err}`)),
                SWEEP_INTERVAL_MS,
            );
            this.logger.log(
                `Reaper armed — sweeping every ${SWEEP_INTERVAL_MS / 1000}s | ` +
                `Crash: ${CRASH_THRESHOLD_MS / 1000}s | AFK: ${AFK_THRESHOLD_MS / 60000}min`
            );
        }, 10_000); // 10s grace period on boot
    }

    onModuleDestroy(): void {
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
            this.sweepInterval = null;
            this.logger.log('Reaper disarmed');
        }
    }

    /**
     * The Sweep — scan all active tables for zombie players.
     */
    private async sweep(): Promise<void> {
        const redis = this.luaRunner.getClient();
        const now = Date.now();

        // ── Step 1: Discover all table IDs with seated players ──
        const tableIds = new Set<string>();
        let cursor = '0';

        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH', 'table:*:players',
                'COUNT', '100',
            );
            cursor = nextCursor;

            for (const key of keys) {
                const match = key.match(/^table:([^:]+):players$/);
                if (match) tableIds.add(match[1]);
            }
        } while (cursor !== '0');

        if (tableIds.size === 0) return;

        // ── Step 2: Check each table's players ──
        for (const tableId of tableIds) {
            try {
                await this.sweepTable(tableId, redis, now);
            } catch (err) {
                this.logger.error(`Error sweeping table ${tableId}: ${err}`);
            }
        }
    }

    /**
     * Sweep a single table: check all seated players with two-tier rules.
     */
    private async sweepTable(
        tableId: string,
        redis: ReturnType<LuaRunnerService['getClient']>,
        now: number,
    ): Promise<void> {
        const playersKey = `table:${tableId}:players`;
        const playersData = await redis.hgetall(playersKey);

        for (const [seatKey, playerJson] of Object.entries(playersData)) {
            if (!seatKey.startsWith('seat_')) continue;

            const seatNum = parseInt(seatKey.replace('seat_', ''), 10);
            let player: {
                id: string;
                status: string;
                username?: string;
                connection?: string;
                disconnected_at?: string;
                sit_out_start?: string;
                chips?: string;
            };

            try {
                player = JSON.parse(playerJson as string);
            } catch {
                continue; // Corrupt data — skip
            }

            let shouldKick = false;
            let reason = '';
            let offlineDurationMs = 0;

            // ── RULE A: Crash Detection (Explicit State Tracking) ──
            // Primary: disconnected_at from set_offline.lua (exact socket break time)
            // Fallback: last_seen heartbeat key (legacy/graceful)
            if (player.connection === 'offline') {
                if (player.disconnected_at) {
                    // PRECISE: disconnected_at is Unix seconds from Redis TIME
                    const disconnectedAtMs = parseInt(player.disconnected_at, 10) * 1000;
                    offlineDurationMs = now - disconnectedAtMs;

                    if (offlineDurationMs >= CRASH_THRESHOLD_MS) {
                        shouldKick = true;
                        reason = `crash — offline for ${Math.round(offlineDurationMs / 1000)}s (disconnected_at)`;
                    }
                } else {
                    // FALLBACK: No disconnected_at (legacy) — use heartbeat inference
                    const lastSeenKey = `last_seen:${tableId}:${seatNum}`;
                    const lastSeenStr = await redis.get(lastSeenKey);

                    if (lastSeenStr) {
                        offlineDurationMs = now - parseInt(lastSeenStr, 10);
                        if (offlineDurationMs >= CRASH_THRESHOLD_MS) {
                            shouldKick = true;
                            reason = `crash — offline for ${Math.round(offlineDurationMs / 1000)}s (last_seen fallback)`;
                        }
                    } else {
                        // No heartbeat ever AND offline — check active sockets
                        const sessions = this.gameGateway.getActiveSessions();
                        let hasActiveSocket = false;
                        for (const [, session] of sessions) {
                            if (session.tableId === tableId && session.seat === seatNum) {
                                hasActiveSocket = true;
                                break;
                            }
                        }

                        if (!hasActiveSocket) {
                            shouldKick = true;
                            reason = 'crash — no socket, no heartbeat, marked offline';
                        }
                    }
                }
            }

            // ── RULE B: AFK Detection ──
            // Player has status == 'sitting_out' with sit_out_start > 10 min
            if (!shouldKick && player.status === 'sitting_out' && player.sit_out_start) {
                const sitOutStart = parseInt(player.sit_out_start, 10) * 1000;
                const elapsed = now - sitOutStart;

                if (elapsed >= AFK_THRESHOLD_MS) {
                    shouldKick = true;
                    offlineDurationMs = elapsed;
                    reason = `AFK — sitting out for ${Math.round(elapsed / 60000)}min`;
                }
            }

            if (!shouldKick) continue;

            // ── Execute the kick ──
            this.logger.warn(
                `[ZOMBIE] ${player.username || player.id} at table ${tableId} seat ${seatNum} — ${reason}. Kicking...`
            );

            try {
                const result = await this.luaRunner.runScript<string>(
                    'leave_table',
                    [
                        `table:${tableId}`,
                        `table:${tableId}:players`,
                        `user:${player.id}:balance`,
                    ],
                    [seatNum.toString(), player.id, 'false'],
                );

                const response: LuaResponse = JSON.parse(result);

                if (response.success) {
                    this.logger.warn(
                        `[REAPED] ${player.username || player.id} removed from table ${tableId} seat ${seatNum} (${reason})`
                    );

                    // Broadcast updated state
                    if (response.tableState) {
                        await this.gameGateway.broadcastTableState(tableId, response.tableState as any);
                    }

                    // System chat: tell the room what happened
                    const server = this.gameGateway.server;
                    if (server) {
                        server.to(`table:${tableId}`).emit('chat_message', {
                            system: true,
                            text: `${player.username || 'A player'} timed out and was removed.`,
                        });
                    }

                    // Clean up auxiliary keys
                    await redis.del(`last_seen:${tableId}:${seatNum}`);
                    await redis.hdel(`user:${player.id}:seats`, tableId);

                    // 🟡 YELLOW CABLE: Enqueue cashout settlement (Write-Behind Sync)
                    // Without this, reaped players' chips vanish into the void.
                    const refundedChips = parseFloat(player.chips || '0');
                    if (refundedChips > 0) {
                        try {
                            const jobId = `reaper:${player.id}:${tableId}:${Date.now()}`;
                            await this.cashoutQueue.add('settle-cashout', {
                                userId: player.id,
                                amount: refundedChips,
                                tableId,
                                source: 'player_reaper',
                            }, { jobId });
                            this.logger.log(`🟡 Enqueued cashout (reaper): ${player.id} +$${refundedChips} from ${tableId}`);
                        } catch (queueErr: any) {
                            this.logger.error(`[REAPER] Failed to enqueue cashout for ${player.id}: ${queueErr.message}`);
                        }
                    }

                    // YELLOW CABLE (§3): Audit the kick — fire-and-forget
                    this.auditService.record({
                        userId: player.id,
                        action: AuditAction.PLAYER_KICKED,
                        payload: {
                            tableId,
                            seat: seatNum,
                            reason,
                            durationOffline: offlineDurationMs,
                            chipsAtKick: player.chips || '0',
                            username: player.username || 'unknown',
                        },
                        ipAddress: null,
                    }).catch(err => this.logger.error(`[REAPER] Audit failed: ${err}`));

                    // POST-KICK AUTO-START: If 2+ active players remain and phase is waiting, deal!
                    const postKickPlayers = await redis.hgetall(playersKey);
                    let activeAfterKick = 0;
                    for (const [k, v] of Object.entries(postKickPlayers)) {
                        if (!k.startsWith('seat_')) continue;
                        try {
                            const p = JSON.parse(v as string);
                            if (p.status === 'waiting' || p.status === 'active') activeAfterKick++;
                        } catch { /* skip */ }
                    }
                    const postPhase = await redis.hget(`table:${tableId}`, 'phase');
                    if (activeAfterKick >= 2 && (postPhase === 'waiting' || postPhase === 'showdown')) {
                        this.logger.log(`[REAPER] Auto-starting hand after kick (${activeAfterKick} active players)`);
                        setTimeout(() => this.gameGateway.startNewHand(tableId), 3000);
                    }
                } else {
                    this.logger.warn(`[REAPER] leave_table failed for ${player.id}: ${response.message}`);
                }
            } catch (err) {
                this.logger.error(`[REAPER] Error kicking ${player.id} from ${tableId}: ${err}`);
            }
        }
    }
}
