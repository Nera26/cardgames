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
var HandHistoryProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandHistoryProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../audit/audit.service");
const shared_1 = require("@poker/shared");
let HandHistoryProcessor = HandHistoryProcessor_1 = class HandHistoryProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, audit) {
        super();
        this.prisma = prisma;
        this.audit = audit;
        this.logger = new common_1.Logger(HandHistoryProcessor_1.name);
    }
    async process(job) {
        const { handId, tableId, winners, pot, rake, communityCards, participants, timestamp } = job.data;
        if (job.name === 'archive-hand') {
            this.logger.log(`Processing hand-persistence for hand ${handId} (table ${tableId})`);
            try {
                const existing = await this.prisma.handHistory.findUnique({
                    where: { id: handId },
                });
                if (existing) {
                    this.logger.warn(`Duplicate hand detected: ${handId}. Skipping.`);
                    return;
                }
                await this.prisma.$transaction(async (tx) => {
                    var _a;
                    const hand = await tx.handHistory.create({
                        data: {
                            id: handId,
                            tableId,
                            endTime: new Date(timestamp * 1000),
                            communityCards: communityCards,
                            pot,
                            rake: rake || 0,
                        },
                    });
                    const playerResults = [];
                    for (const p of participants) {
                        const winner = winners.find((w) => w.seat === p.seatNumber);
                        const winAmount = winner ? winner.amount : 0;
                        const netProfit = winAmount - (p.totalContribution || 0);
                        playerResults.push({
                            handId: hand.id,
                            userId: p.id,
                            seat: p.seatNumber,
                            winAmount,
                            netProfit,
                            handDescription: winner ? (winner.handDescription || null) : null,
                        });
                        if (p.id) {
                            if (winAmount > 0) {
                                await tx.wallet.update({
                                    where: { userId: p.id },
                                    data: { realBalance: { increment: winAmount } }
                                });
                                await tx.user.update({
                                    where: { id: p.id },
                                    data: { lifetimeEarnings: { increment: winAmount } }
                                });
                            }
                            if (rake > 0 && pot > 0 && p.totalContribution > 0) {
                                const rakeShare = Math.floor(rake * (p.totalContribution / pot));
                                if (rakeShare > 0) {
                                    await tx.user.update({
                                        where: { id: p.id },
                                        data: { lifetimeRake: { increment: rakeShare } }
                                    });
                                }
                            }
                        }
                    }
                    await tx.handPlayerResult.createMany({
                        data: playerResults,
                    });
                    if (rake > 0) {
                        const houseUser = await tx.user.findUnique({
                            where: { username: 'HOUSE_TREASURY' },
                            select: { id: true }
                        });
                        if (houseUser) {
                            await tx.wallet.update({
                                where: { userId: houseUser.id },
                                data: { realBalance: { increment: rake } }
                            });
                            const houseWallet = await tx.wallet.findUnique({
                                where: { userId: houseUser.id },
                                select: { id: true }
                            });
                            if (houseWallet) {
                                await tx.transaction.create({
                                    data: {
                                        walletId: houseWallet.id,
                                        type: 'RAKE',
                                        amount: rake,
                                        status: 'COMPLETED',
                                        description: `Rake from Hand #${handId} (Table: ${tableId})`,
                                    }
                                });
                            }
                            this.logger.log(`💰 Credited House Treasury with $${rake} rake from hand ${handId}`);
                        }
                        else {
                            this.logger.warn(`⚠️ HOUSE_TREASURY user not found! Rake of $${rake} not credited.`);
                        }
                    }
                    const auditUserId = ((_a = participants[0]) === null || _a === void 0 ? void 0 : _a.id) || 'system';
                    await this.audit.record({
                        userId: auditUserId,
                        action: shared_1.AuditAction.HAND_ARCHIVED,
                        payload: {
                            handId,
                            tableId,
                            pot,
                            rake: rake || 0,
                            winnerCount: winners.length,
                        },
                    }, tx);
                });
                this.logger.log(`Successfully archived hand ${handId} and synced wallets`);
            }
            catch (error) {
                this.logger.error(`Failed to archive hand ${handId}: ${error.stack}`);
                throw error;
            }
        }
    }
};
exports.HandHistoryProcessor = HandHistoryProcessor;
exports.HandHistoryProcessor = HandHistoryProcessor = HandHistoryProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('hand-persistence'),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], HandHistoryProcessor);
//# sourceMappingURL=hand-history.processor.js.map