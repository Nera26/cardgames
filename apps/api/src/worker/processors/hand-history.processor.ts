import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@poker/shared';

@Processor('hand-persistence')
@Injectable()
export class HandHistoryProcessor extends WorkerHost {
    private readonly logger = new Logger(HandHistoryProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        const { handId, tableId, winners, pot, rake, communityCards, participants, actionLog, timestamp } = job.data;

        if (job.name === 'archive-hand') {
            this.logger.log(`Processing hand-persistence for hand ${handId} (table ${tableId})`);

            try {
                // Idempotency: Check if already exists
                const existing = await this.prisma.handHistory.findUnique({
                    where: { id: handId },
                });

                if (existing) {
                    this.logger.warn(`Duplicate hand detected: ${handId}. Skipping.`);
                    return;
                }

                // Transaction: Atomic persistence & Financial Sync
                await this.prisma.$transaction(async (tx) => {
                    // 1. Create HandHistory
                    const hand = await tx.handHistory.create({
                        data: {
                            id: handId,
                            tableId,
                            endTime: new Date(timestamp * 1000),
                            communityCards: communityCards,
                            pot,
                            rake: rake || 0,
                            actionLog: actionLog || [],
                        },
                    });

                    // 2. Create HandPlayerResults & Sync Winnings to Wallets
                    const playerResults = [];
                    for (const p of participants) {
                        const winner = winners.find((w: any) => w.seat === p.seatNumber);
                        const winAmount = winner ? winner.amount : 0;
                        const netProfit = winAmount - (p.totalContribution || 0);

                        playerResults.push({
                            handId: hand.id,
                            userId: p.id,
                            seat: p.seatNumber,
                            winAmount,
                            netProfit,
                            handDescription: p.handDescription || (winner ? (winner.handDescription || null) : null),
                            cards: Array.isArray(p.cards) ? p.cards : [],
                        });

                        // Stats: Atomic increment of pre-aggregated counters + financial tracking
                        // All merged into a single tx.user.update() per participant.
                        if (p.id) {
                            const updateData: any = {
                                handsPlayed: { increment: 1 },
                            };

                            // Winner: increment handsWon + lifetimeEarnings
                            if (winAmount > 0) {
                                updateData.handsWon = { increment: 1 };
                                updateData.lifetimeEarnings = { increment: winAmount };
                            }

                            // Proportional Rake Attribution
                            if (rake > 0 && pot > 0 && p.totalContribution > 0) {
                                const rakeShare = Math.floor(rake * (p.totalContribution / pot));
                                if (rakeShare > 0) {
                                    updateData.lifetimeRake = { increment: rakeShare };
                                }
                            }

                            await tx.user.update({
                                where: { id: p.id },
                                data: updateData,
                            });
                        }
                    }

                    await tx.handPlayerResult.createMany({
                        data: playerResults,
                    });

                    // 3. YELLOW CABLE: Credit House Treasury with Rake
                    if (rake > 0) {
                        const houseUser = await tx.user.findUnique({
                            where: { username: 'HOUSE_TREASURY' },
                            select: { id: true }
                        });

                        if (houseUser) {
                            // Credit the House wallet
                            await tx.wallet.update({
                                where: { userId: houseUser.id },
                                data: { realBalance: { increment: rake } }
                            });

                            // Create Transaction record for audit trail
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
                        } else {
                            this.logger.warn(`⚠️ HOUSE_TREASURY user not found! Rake of $${rake} not credited.`);
                        }
                    }

                    // 4. Create AuditLog
                    const auditUserId = participants[0]?.id || 'system';

                    await this.audit.record({
                        userId: auditUserId,
                        action: AuditAction.HAND_ARCHIVED,
                        payload: {
                            handId,
                            tableId,
                            pot,
                            rake: rake || 0,
                            winnerCount: winners.length,
                        },
                    }, tx as any);
                });

                this.logger.log(`Successfully archived hand ${handId} and synced wallets`);
            } catch (error) {
                this.logger.error(`Failed to archive hand ${handId}: ${error.stack}`);
                throw error; // Let BullMQ retry
            }
        }
    }
}
