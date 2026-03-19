import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { LuaRunnerService } from '../../game/lua-runner.service';
import { TimerService } from '../timer.service';
import { GameGateway } from '../../game/game.gateway';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@poker/shared';

@Processor('game-turn-timer')
export class TurnTimerProcessor extends WorkerHost {
    private readonly logger = new Logger(TurnTimerProcessor.name);

    constructor(
        @Inject(forwardRef(() => LuaRunnerService))
        private readonly luaRunner: LuaRunnerService,
        @Inject(forwardRef(() => TimerService))
        private readonly timerService: TimerService,
        @Inject(forwardRef(() => GameGateway))
        private readonly gameGateway: GameGateway,
        private readonly auditService: AuditService,
    ) {
        super();
    }

    async process(job: Job<{ tableId: string; seat: number }>): Promise<void> {
        const { tableId, seat } = job.data;

        if (job.name === 'turn-timeout') {
            this.logger.log(`Processing turn timeout for Table ${tableId}, Seat ${seat}`);

            const redis = this.luaRunner.getClient();
            const currentTurnSeat = await redis.hget(`table:${tableId}`, 'turnSeat');

            if (currentTurnSeat === String(seat)) {
                this.logger.warn(`Turn timeout trigger for Table ${tableId}, Seat ${seat}. Invoking The Judge (timeout.lua)`);

                try {
                    // Execute timeout.lua - The Judge of Time
                    const result = await this.luaRunner.runScript<string>(
                        'timeout',
                        [`table:${tableId}`, `table:${tableId}:players`],
                        [seat]
                    );

                    const response = JSON.parse(result);

                    if (!response.success) {
                        this.logger.error(`Timeout script failed: ${response.message}`);
                        return;
                    }

                    if (response.action === 'extended') {
                        const durationMs = response.durationMs || 30000;
                        this.logger.log(`LIFELINE: Seat ${seat} time bank activated. Duration: ${durationMs}ms, Balance: ${response.timeBankBalance}s`);

                        // 1. Restart the Node.js Timer (full time bank balance)
                        await this.timerService.scheduleTimeout(tableId, seat, durationMs);

                        // 2. Broadcast time bank activation to all clients
                        this.gameGateway.server.to(`table:${tableId}`).emit('time_bank_activated', {
                            tableId,
                            seat,
                            durationMs,
                            timeBankBalance: response.timeBankBalance,
                        });

                        // 3. Emit your_turn with isTimeBank flag for the active player's ring
                        this.gameGateway.server.to(`table:${tableId}`).emit('your_turn', {
                            tableId,
                            seat,
                            timeoutMs: durationMs,
                            isTimeBank: true,
                        });

                        // 3. Broadcast updated table state (for updated time_bank display)
                        // Note: timeout.lua doesn't return full state in this current version yet, 
                        // but it updated the player in Redis. We can fetch it or just rely on the next action.
                        // For production feel, let's fetch and broadcast.
                    } else if (response.action === 'folded') {
                        this.logger.log(`FOLDED: Seat ${seat} bank depleted. Moving turn.`);

                        // Emit fold action to frontend
                        this.gameGateway.server.to(`table:${tableId}`).emit('player_action', {
                            tableId,
                            seat,
                            action: 'fold',
                            reason: 'timeout'
                        });

                        // BENCH NOTICE: Tell the room this player is sitting out
                        if (response.benched) {
                            this.gameGateway.server.to(`table:${tableId}`).emit('player_status_update', {
                                tableId,
                                seat,
                                status: 'sitting_out',
                            });

                            // YELLOW CABLE (§3): Audit timeout — fire-and-forget
                            if (response.playerId) {
                                this.auditService.record({
                                    userId: response.playerId,
                                    action: AuditAction.PLAYER_TIMEOUT,
                                    payload: { tableId, seat, reason: 'time_bank_depleted' },
                                    ipAddress: null,
                                }).catch(err => this.logger.error(`Audit failed: ${err}`));
                            }
                        }

                        // CRITICAL: Broadcast updated table state so frontend can render the fold
                        const redis = this.luaRunner.getClient();
                        const tableData = await redis.hgetall(`table:${tableId}`);
                        const players: Record<string, unknown>[] = [];
                        for (let i = 0; i < 10; i++) {
                            const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                            if (pData) {
                                players.push(JSON.parse(pData));
                            }
                        }
                        const freshState = {
                            table: {
                                ...tableData,
                                pot: Number(tableData.pot || 0),
                                currentBet: Number(tableData.currentBet || 0),
                                turnSeat: Number(tableData.turnSeat ?? -1),
                                dealerSeat: Number(tableData.dealerSeat || 0),
                                smallBlindSeat: Number(tableData.smallBlindSeat || 0),
                                bigBlindSeat: Number(tableData.bigBlindSeat || 0),
                                communityCards: JSON.parse(tableData.communityCards || '[]'),
                            },
                            players,
                        };
                        await (this.gameGateway as any).broadcastTableState(tableId, freshState);

                        // Handle street progression or hand completion
                        if (response.handComplete) {
                            this.logger.log(`Hand complete via timeout fold. Winner: Seat ${response.winningSeat}`);
                            this.gameGateway.server.to(`table:${tableId}`).emit('hand_result', {
                                tableId,
                                winningSeat: response.winningSeat,
                                message: 'Hand complete via timeout fold',
                                nextHandDelay: 5000,
                                nextHandTimestamp: Date.now() + 5000,
                            });
                            setTimeout(() => (this.gameGateway as any).startNewHand(tableId), 5000);
                        } else if (response.nextStreet && !response.handComplete) {
                            await (this.gameGateway as any).advanceStreet(tableId);
                        } else {
                            // Start timer for next player if turn moved
                            if (typeof response.nextTurn === 'number' && response.nextTurn >= 0) {
                                // Read dynamic turn time from config
                                const turnTimeCfg = await redis.hget(`table:${tableId}:config`, 'turnTime');
                                const turnTimeMs = (parseInt(turnTimeCfg || '30', 10)) * 1000;

                                await this.timerService.scheduleTimeout(tableId, response.nextTurn, turnTimeMs);
                                this.gameGateway.server.to(`table:${tableId}`).emit('your_turn', {
                                    tableId,
                                    seat: response.nextTurn,
                                    timeoutMs: turnTimeMs,
                                });
                            }
                        }
                    }

                } catch (error) {
                    this.logger.error(`Failed to handle timeout for Seat ${seat}: ${error.message}`);
                }
            } else {
                this.logger.debug(`Timeout fired but turn changed (Current: ${currentTurnSeat}, Job: ${seat}). Skipping.`);
            }
        }
    }
}
