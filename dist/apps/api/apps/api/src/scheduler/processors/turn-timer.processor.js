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
var TurnTimerProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnTimerProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const lua_runner_service_1 = require("../../game/lua-runner.service");
const timer_service_1 = require("../timer.service");
const game_gateway_1 = require("../../game/game.gateway");
const audit_service_1 = require("../../audit/audit.service");
const shared_1 = require("@poker/shared");
let TurnTimerProcessor = TurnTimerProcessor_1 = class TurnTimerProcessor extends bullmq_1.WorkerHost {
    constructor(luaRunner, timerService, gameGateway, auditService) {
        super();
        this.luaRunner = luaRunner;
        this.timerService = timerService;
        this.gameGateway = gameGateway;
        this.auditService = auditService;
        this.logger = new common_1.Logger(TurnTimerProcessor_1.name);
    }
    async process(job) {
        var _a;
        const { tableId, seat } = job.data;
        if (job.name === 'turn-timeout') {
            this.logger.log(`Processing turn timeout for Table ${tableId}, Seat ${seat}`);
            const redis = this.luaRunner.getClient();
            const currentTurnSeat = await redis.hget(`table:${tableId}`, 'turnSeat');
            if (currentTurnSeat === String(seat)) {
                this.logger.warn(`Turn timeout trigger for Table ${tableId}, Seat ${seat}. Invoking The Judge (timeout.lua)`);
                try {
                    const result = await this.luaRunner.runScript('timeout', [`table:${tableId}`, `table:${tableId}:players`], [seat]);
                    const response = JSON.parse(result);
                    if (!response.success) {
                        this.logger.error(`Timeout script failed: ${response.message}`);
                        return;
                    }
                    if (response.action === 'extended') {
                        const durationMs = response.durationMs || 30000;
                        this.logger.log(`LIFELINE: Seat ${seat} time bank activated. Duration: ${durationMs}ms, Balance: ${response.timeBankBalance}s`);
                        await this.timerService.scheduleTimeout(tableId, seat, durationMs);
                        this.gameGateway.server.to(`table:${tableId}`).emit('time_bank_activated', {
                            seat,
                            durationMs,
                            timeBankBalance: response.timeBankBalance,
                        });
                        this.gameGateway.server.to(`table:${tableId}`).emit('your_turn', {
                            seat,
                            timeoutMs: durationMs,
                            isTimeBank: true,
                        });
                    }
                    else if (response.action === 'folded') {
                        this.logger.log(`FOLDED: Seat ${seat} bank depleted. Moving turn.`);
                        this.gameGateway.server.to(`table:${tableId}`).emit('player_action', {
                            seat,
                            action: 'fold',
                            reason: 'timeout'
                        });
                        if (response.benched) {
                            this.gameGateway.server.to(`table:${tableId}`).emit('player_status_update', {
                                seat,
                                status: 'sitting_out',
                            });
                            this.auditService.record({
                                userId: response.playerId || 'unknown',
                                action: shared_1.AuditAction.PLAYER_TIMEOUT,
                                payload: { tableId, seat, reason: 'time_bank_depleted' },
                                ipAddress: null,
                            }).catch(err => this.logger.error(`Audit failed: ${err}`));
                        }
                        const redis = this.luaRunner.getClient();
                        const tableData = await redis.hgetall(`table:${tableId}`);
                        const players = [];
                        for (let i = 0; i < 10; i++) {
                            const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                            if (pData) {
                                players.push(JSON.parse(pData));
                            }
                        }
                        const freshState = {
                            table: Object.assign(Object.assign({}, tableData), { pot: Number(tableData.pot || 0), currentBet: Number(tableData.currentBet || 0), turnSeat: Number((_a = tableData.turnSeat) !== null && _a !== void 0 ? _a : -1), dealerSeat: Number(tableData.dealerSeat || 0), smallBlindSeat: Number(tableData.smallBlindSeat || 0), bigBlindSeat: Number(tableData.bigBlindSeat || 0), communityCards: JSON.parse(tableData.communityCards || '[]') }),
                            players,
                        };
                        await this.gameGateway.broadcastTableState(tableId, freshState);
                        if (response.handComplete) {
                            this.logger.log(`Hand complete via timeout fold. Winner: Seat ${response.winningSeat}`);
                            this.gameGateway.server.to(`table:${tableId}`).emit('hand_result', {
                                winningSeat: response.winningSeat,
                                message: 'Hand complete via timeout fold',
                                nextHandDelay: 5000,
                                nextHandTimestamp: Date.now() + 5000,
                            });
                            setTimeout(() => this.gameGateway.startNewHand(tableId), 5000);
                        }
                        else if (response.nextStreet && !response.handComplete) {
                            await this.gameGateway.advanceStreet(tableId);
                        }
                        else {
                            if (typeof response.nextTurn === 'number' && response.nextTurn >= 0) {
                                const turnTimeCfg = await redis.hget(`table:${tableId}:config`, 'turnTime');
                                const turnTimeMs = (parseInt(turnTimeCfg || '30', 10)) * 1000;
                                await this.timerService.scheduleTimeout(tableId, response.nextTurn, turnTimeMs);
                                this.gameGateway.server.to(`table:${tableId}`).emit('your_turn', {
                                    seat: response.nextTurn,
                                    timeoutMs: turnTimeMs,
                                });
                            }
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to handle timeout for Seat ${seat}: ${error.message}`);
                }
            }
            else {
                this.logger.debug(`Timeout fired but turn changed (Current: ${currentTurnSeat}, Job: ${seat}). Skipping.`);
            }
        }
    }
};
exports.TurnTimerProcessor = TurnTimerProcessor;
exports.TurnTimerProcessor = TurnTimerProcessor = TurnTimerProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('game-turn-timer'),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => lua_runner_service_1.LuaRunnerService))),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => timer_service_1.TimerService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [lua_runner_service_1.LuaRunnerService,
        timer_service_1.TimerService,
        game_gateway_1.GameGateway,
        audit_service_1.AuditService])
], TurnTimerProcessor);
//# sourceMappingURL=turn-timer.processor.js.map