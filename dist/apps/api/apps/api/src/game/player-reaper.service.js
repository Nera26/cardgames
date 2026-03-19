"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerReaperService = void 0;
const common_1 = require("@nestjs/common");
const lua_runner_service_1 = require("./lua-runner.service");
const game_gateway_1 = require("./game.gateway");
const audit_service_1 = require("../audit/audit.service");
const shared_1 = require("@poker/shared");
const SWEEP_INTERVAL_MS = 30000;
const CRASH_THRESHOLD_MS = 60000;
const AFK_THRESHOLD_MS = 10 * 60000;
let PlayerReaperService = class PlayerReaperService {
    constructor(luaRunner, gameGateway, auditService) {
        this.luaRunner = luaRunner;
        this.gameGateway = gameGateway;
        this.auditService = auditService;
        this.logger = new common_1.Logger('💀 Reaper');
        this.sweepInterval = null;
    }
    async onModuleInit() {
        setTimeout(() => {
            this.sweepInterval = setInterval(() => this.sweep().catch(err => this.logger.error(`Sweep failed: ${err}`)), SWEEP_INTERVAL_MS);
            this.logger.log(`Reaper armed — sweeping every ${SWEEP_INTERVAL_MS / 1000}s | ` +
                `Crash: ${CRASH_THRESHOLD_MS / 1000}s | AFK: ${AFK_THRESHOLD_MS / 60000}min`);
        }, 10000);
    }
    onModuleDestroy() {
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
            this.sweepInterval = null;
            this.logger.log('Reaper disarmed');
        }
    }
    async sweep() {
        const redis = this.luaRunner.getClient();
        const now = Date.now();
        const tableIds = new Set();
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'table:*:players', 'COUNT', '100');
            cursor = nextCursor;
            for (const key of keys) {
                const match = key.match(/^table:([^:]+):players$/);
                if (match)
                    tableIds.add(match[1]);
            }
        } while (cursor !== '0');
        if (tableIds.size === 0)
            return;
        for (const tableId of tableIds) {
            try {
                await this.sweepTable(tableId, redis, now);
            }
            catch (err) {
                this.logger.error(`Error sweeping table ${tableId}: ${err}`);
            }
        }
    }
    async sweepTable(tableId, redis, now) {
        const playersKey = `table:${tableId}:players`;
        const playersData = await redis.hgetall(playersKey);
        for (const [seatKey, playerJson] of Object.entries(playersData)) {
            if (!seatKey.startsWith('seat_'))
                continue;
            const seatNum = parseInt(seatKey.replace('seat_', ''), 10);
            let player;
            try {
                player = JSON.parse(playerJson);
            }
            catch (_a) {
                continue;
            }
            let shouldKick = false;
            let reason = '';
            let offlineDurationMs = 0;
            if (player.connection === 'offline') {
                if (player.disconnected_at) {
                    const disconnectedAtMs = parseInt(player.disconnected_at, 10) * 1000;
                    offlineDurationMs = now - disconnectedAtMs;
                    if (offlineDurationMs >= CRASH_THRESHOLD_MS) {
                        shouldKick = true;
                        reason = `crash — offline for ${Math.round(offlineDurationMs / 1000)}s (disconnected_at)`;
                    }
                }
                else {
                    const lastSeenKey = `last_seen:${tableId}:${seatNum}`;
                    const lastSeenStr = await redis.get(lastSeenKey);
                    if (lastSeenStr) {
                        offlineDurationMs = now - parseInt(lastSeenStr, 10);
                        if (offlineDurationMs >= CRASH_THRESHOLD_MS) {
                            shouldKick = true;
                            reason = `crash — offline for ${Math.round(offlineDurationMs / 1000)}s (last_seen fallback)`;
                        }
                    }
                    else {
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
            if (!shouldKick && player.status === 'sitting_out' && player.sit_out_start) {
                const sitOutStart = parseInt(player.sit_out_start, 10) * 1000;
                const elapsed = now - sitOutStart;
                if (elapsed >= AFK_THRESHOLD_MS) {
                    shouldKick = true;
                    offlineDurationMs = elapsed;
                    reason = `AFK — sitting out for ${Math.round(elapsed / 60000)}min`;
                }
            }
            if (!shouldKick)
                continue;
            this.logger.warn(`[ZOMBIE] ${player.username || player.id} at table ${tableId} seat ${seatNum} — ${reason}. Kicking...`);
            try {
                const result = await this.luaRunner.runScript('leave_table', [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                    `user:${player.id}:balance`,
                ], [seatNum.toString(), player.id, 'false']);
                const response = JSON.parse(result);
                if (response.success) {
                    this.logger.warn(`[REAPED] ${player.username || player.id} removed from table ${tableId} seat ${seatNum} (${reason})`);
                    if (response.tableState) {
                        await this.gameGateway.broadcastTableState(tableId, response.tableState);
                    }
                    const server = this.gameGateway.server;
                    if (server) {
                        server.to(`table:${tableId}`).emit('chat_message', {
                            system: true,
                            text: `${player.username || 'A player'} timed out and was removed.`,
                        });
                    }
                    await redis.del(`last_seen:${tableId}:${seatNum}`);
                    await redis.del(`user:${player.id}:seat`);
                    this.auditService.record({
                        userId: player.id,
                        action: shared_1.AuditAction.PLAYER_KICKED,
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
                    const postKickPlayers = await redis.hgetall(playersKey);
                    let activeAfterKick = 0;
                    for (const [k, v] of Object.entries(postKickPlayers)) {
                        if (!k.startsWith('seat_'))
                            continue;
                        try {
                            const p = JSON.parse(v);
                            if (p.status === 'waiting' || p.status === 'active')
                                activeAfterKick++;
                        }
                        catch (_b) { }
                    }
                    const postPhase = await redis.hget(`table:${tableId}`, 'phase');
                    if (activeAfterKick >= 2 && (postPhase === 'waiting' || postPhase === 'showdown')) {
                        this.logger.log(`[REAPER] Auto-starting hand after kick (${activeAfterKick} active players)`);
                        setTimeout(() => this.gameGateway.startNewHand(tableId), 3000);
                    }
                }
                else {
                    this.logger.warn(`[REAPER] leave_table failed for ${player.id}: ${response.message}`);
                }
            }
            catch (err) {
                this.logger.error(`[REAPER] Error kicking ${player.id} from ${tableId}: ${err}`);
            }
        }
    }
};
exports.PlayerReaperService = PlayerReaperService;
exports.PlayerReaperService = PlayerReaperService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [lua_runner_service_1.LuaRunnerService,
        game_gateway_1.GameGateway,
        audit_service_1.AuditService])
], PlayerReaperService);
//# sourceMappingURL=player-reaper.service.js.map