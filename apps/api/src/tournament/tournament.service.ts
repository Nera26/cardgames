/**
 * Tournament Service (Phase 7 - Blue Cable)
 *
 * Core business logic for tournament CRUD, lobby queries,
 * and ACID-compliant player registration.
 */

import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import {
    CreateTournamentDto,
    UpdateTournamentDto,
    TournamentResponseDto,
    TournamentListQueryDto,
    TournamentEntryResponseDto,
    TransactionType,
    TransactionStatus,
} from '@poker/shared';
import { Prisma, TournamentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TournamentService {
    private readonly logger = new Logger(TournamentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {}

    // ============================================================
    // Admin CRUD Operations (Blue Cable)
    // ============================================================

    async create(dto: CreateTournamentDto, adminId: string): Promise<TournamentResponseDto> {
        const tournament = await this.prisma.tournament.create({
            data: {
                name: dto.name,
                description: dto.description ?? null,
                password: dto.password ?? null,
                gameType: dto.gameType as any,
                entryFormat: dto.entryFormat as any,
                buyIn: new Prisma.Decimal(dto.buyIn),
                fee: new Prisma.Decimal(dto.fee),
                guaranteedPrizePool: new Prisma.Decimal(dto.guaranteedPrizePool),
                bountyAmount: dto.bountyAmount != null ? new Prisma.Decimal(dto.bountyAmount) : null,
                startingChips: dto.startingChips,
                blindStructure: dto.blindStructure as any,
                seatCap: dto.seatCap ?? null,
                minPlayersToStart: dto.minPlayersToStart,
                payoutStructure: dto.payoutStructure as any,
                startTime: dto.startTime,
                lateRegistration: dto.lateRegistration as any,
                autoStart: dto.autoStart,
                rebuyEnabled: dto.rebuyEnabled,
                rebuyCost: dto.rebuyCost != null ? new Prisma.Decimal(dto.rebuyCost) : null,
                rebuyChips: dto.rebuyChips ?? null,
                addonEnabled: dto.addonEnabled,
                addonCost: dto.addonCost != null ? new Prisma.Decimal(dto.addonCost) : null,
                addonChips: dto.addonChips ?? null,
                maxReEntries: dto.maxReEntries ?? null,
                reEntryWindow: dto.reEntryWindow ?? null,
                createdById: adminId,
            },
        });

        this.logger.log(`Tournament created: ${tournament.name} (${tournament.id}) by admin ${adminId}`);
        return this.toResponseDto(tournament);
    }

    async update(id: string, dto: UpdateTournamentDto): Promise<TournamentResponseDto> {
        const existing = await this.prisma.tournament.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Tournament not found');

        // Prevent editing tournaments that are already RUNNING or FINISHED
        const immutableStatuses: TournamentStatus[] = ['RUNNING', 'ON_BREAK', 'FINISHED', 'CANCELLED'];
        if (immutableStatuses.includes(existing.status)) {
            throw new ForbiddenException(`Cannot edit tournament in ${existing.status} state`);
        }

        const updateData: any = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.password !== undefined) updateData.password = dto.password;
        if (dto.gameType !== undefined) updateData.gameType = dto.gameType;
        if (dto.entryFormat !== undefined) updateData.entryFormat = dto.entryFormat;
        if (dto.buyIn !== undefined) updateData.buyIn = new Prisma.Decimal(dto.buyIn);
        if (dto.fee !== undefined) updateData.fee = new Prisma.Decimal(dto.fee);
        if (dto.guaranteedPrizePool !== undefined) updateData.guaranteedPrizePool = new Prisma.Decimal(dto.guaranteedPrizePool);
        if (dto.bountyAmount !== undefined) updateData.bountyAmount = dto.bountyAmount != null ? new Prisma.Decimal(dto.bountyAmount) : null;
        if (dto.startingChips !== undefined) updateData.startingChips = dto.startingChips;
        if (dto.blindStructure !== undefined) updateData.blindStructure = dto.blindStructure;
        if (dto.seatCap !== undefined) updateData.seatCap = dto.seatCap;
        if (dto.minPlayersToStart !== undefined) updateData.minPlayersToStart = dto.minPlayersToStart;
        if (dto.payoutStructure !== undefined) updateData.payoutStructure = dto.payoutStructure;
        if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
        if (dto.lateRegistration !== undefined) updateData.lateRegistration = dto.lateRegistration;
        if (dto.autoStart !== undefined) updateData.autoStart = dto.autoStart;
        if (dto.rebuyEnabled !== undefined) updateData.rebuyEnabled = dto.rebuyEnabled;
        if (dto.rebuyCost !== undefined) updateData.rebuyCost = dto.rebuyCost != null ? new Prisma.Decimal(dto.rebuyCost) : null;
        if (dto.rebuyChips !== undefined) updateData.rebuyChips = dto.rebuyChips;
        if (dto.addonEnabled !== undefined) updateData.addonEnabled = dto.addonEnabled;
        if (dto.addonCost !== undefined) updateData.addonCost = dto.addonCost != null ? new Prisma.Decimal(dto.addonCost) : null;
        if (dto.addonChips !== undefined) updateData.addonChips = dto.addonChips;
        if (dto.maxReEntries !== undefined) updateData.maxReEntries = dto.maxReEntries;
        if (dto.reEntryWindow !== undefined) updateData.reEntryWindow = dto.reEntryWindow;

        const updated = await this.prisma.tournament.update({
            where: { id },
            data: updateData,
        });

        this.logger.log(`Tournament updated: ${updated.name} (${updated.id})`);
        return this.toResponseDto(updated);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.tournament.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Tournament not found');

        // Prevent deleting tournaments that are RUNNING
        if (existing.status === 'RUNNING' || existing.status === 'ON_BREAK') {
            throw new ForbiddenException('Cannot delete a running tournament');
        }

        await this.prisma.tournament.delete({ where: { id } });
        this.logger.warn(`Tournament deleted: ${existing.name} (${id})`);
    }

    async findById(id: string): Promise<TournamentResponseDto> {
        const tournament = await this.prisma.tournament.findUnique({ where: { id } });
        if (!tournament) throw new NotFoundException('Tournament not found');
        return this.toResponseDto(tournament);
    }

    // ============================================================
    // Lobby Queries (Public Blue Cable)
    // ============================================================

    async listForLobby(query: TournamentListQueryDto) {
        const { status, gameType, entryFormat, search, page, limit } = query;
        const skip = (page - 1) * limit;

        // Only show public-facing statuses in the lobby
        const lobbyStatuses: TournamentStatus[] = ['ANNOUNCED', 'REGISTERING', 'LATE_REG', 'RUNNING'];

        const where: Prisma.TournamentWhereInput = {
            status: status ? { equals: status as TournamentStatus } : { in: lobbyStatuses },
            ...(gameType && { gameType: gameType as any }),
            ...(entryFormat && { entryFormat: entryFormat as any }),
            ...(search && {
                name: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
            }),
        };

        const [total, tournaments] = await Promise.all([
            this.prisma.tournament.count({ where }),
            this.prisma.tournament.findMany({
                where,
                orderBy: { startTime: 'asc' },
                skip,
                take: limit,
            }),
        ]);

        return {
            data: tournaments.map((t) => this.toResponseDto(t)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // Admin List (all statuses)
    // ============================================================

    async listForAdmin(query: TournamentListQueryDto) {
        const { status, gameType, entryFormat, search, page, limit } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TournamentWhereInput = {
            ...(status && { status: status as TournamentStatus }),
            ...(gameType && { gameType: gameType as any }),
            ...(entryFormat && { entryFormat: entryFormat as any }),
            ...(search && {
                name: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
            }),
        };

        const [total, tournaments] = await Promise.all([
            this.prisma.tournament.count({ where }),
            this.prisma.tournament.findMany({
                where,
                orderBy: { startTime: 'desc' },
                skip,
                take: limit,
                include: {
                    _count: { select: { entries: true } },
                    createdBy: { select: { id: true, username: true } },
                },
            }),
        ]);

        return {
            data: tournaments.map((t) => ({
                ...this.toResponseDto(t),
                createdBy: (t as any).createdBy,
                entryCount: (t as any)._count?.entries ?? 0,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // Layer 4: Financial Gateway (ACID Registration)
    // ============================================================

    async registerPlayer(userId: string, tournamentId: string): Promise<TournamentEntryResponseDto> {
        return this.prisma.$transaction(async (tx) => {
            // Step 1: Lock and fetch wallet
            const [lockedWallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                SELECT "id", "realBalance" FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE
            `;
            if (!lockedWallet) {
                throw new NotFoundException('Wallet not found');
            }

            // Step 2: Fetch tournament
            const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
            if (!tournament) {
                throw new NotFoundException('Tournament not found');
            }

            // Step 3: Validate tournament state
            const registrableStatuses: TournamentStatus[] = ['REGISTERING', 'LATE_REG'];
            if (!registrableStatuses.includes(tournament.status)) {
                throw new BadRequestException(`Tournament is not open for registration (status: ${tournament.status})`);
            }

            // Step 4: Check seat cap
            if (tournament.seatCap && tournament.totalEntries >= tournament.seatCap) {
                throw new BadRequestException('Tournament is full');
            }

            // Step 5: Check duplicate entry
            const existingEntry = await tx.tournamentEntry.findUnique({
                where: { tournamentId_userId: { tournamentId, userId } },
            });
            if (existingEntry && existingEntry.isActive) {
                throw new ConflictException('Already registered for this tournament');
            }

            // Step 6: Calculate total cost
            const buyIn = Number(tournament.buyIn);
            const fee = Number(tournament.fee);
            const totalCost = buyIn + fee;
            const walletBalance = Number(lockedWallet.realBalance);

            if (totalCost > 0 && walletBalance < totalCost) {
                throw new BadRequestException(
                    `Insufficient funds. Required: $${totalCost.toFixed(2)}, Balance: $${walletBalance.toFixed(2)}`
                );
            }

            // Step 7: Deduct funds (conditional — skip for freeroll)
            let balanceBefore = walletBalance;
            let balanceAfter = walletBalance;

            if (totalCost > 0) {
                balanceAfter = walletBalance - totalCost;

                // Atomic wallet update with condition
                const updatedBatch = await tx.wallet.updateMany({
                    where: {
                        id: lockedWallet.id,
                        realBalance: { gte: new Prisma.Decimal(totalCost) },
                    },
                    data: {
                        realBalance: { decrement: new Prisma.Decimal(totalCost) },
                    },
                });

                if (updatedBatch.count === 0) {
                    throw new BadRequestException('Insufficient funds (Race Condition Detected)');
                }

                // Create TOURNAMENT_BUY_IN ledger entry
                await tx.transaction.create({
                    data: {
                        walletId: lockedWallet.id,
                        type: TransactionType.TOURNAMENT_BUY_IN,
                        amount: new Prisma.Decimal(-totalCost),
                        status: TransactionStatus.COMPLETED,
                        description: `Tournament buy-in: ${tournament.name} ($${buyIn} + $${fee} fee)`,
                        balanceBefore,
                        balanceAfter,
                        referenceId: `tournament:${tournamentId}:${Date.now()}`,
                    },
                });
            }

            // Step 8: Create TournamentEntry
            const entry = await tx.tournamentEntry.create({
                data: {
                    tournamentId,
                    userId,
                    isActive: true,
                },
            });

            // Step 9: Increment tournament counters + recalculate prize pool
            const newTotalEntries = tournament.totalEntries + 1;
            const collectedPool = buyIn * newTotalEntries;
            const gtd = Number(tournament.guaranteedPrizePool);
            const actualPrizePool = Math.max(collectedPool, gtd);

            await tx.tournament.update({
                where: { id: tournamentId },
                data: {
                    totalEntries: { increment: 1 },
                    playersRemaining: { increment: 1 },
                    actualPrizePool: new Prisma.Decimal(actualPrizePool),
                },
            });

            this.logger.log(
                `🎫 Player ${userId} registered for "${tournament.name}" | ` +
                `Cost: $${totalCost} | Entries: ${newTotalEntries} | Pool: $${actualPrizePool}`
            );

            // Step 10: Push balance update via Redis (non-fatal)
            if (totalCost > 0) {
                try {
                    const payload = {
                        type: 'WALLET_BALANCE_UPDATED',
                        userId,
                        newBalance: balanceAfter,
                        delta: -totalCost,
                        transactionType: TransactionType.TOURNAMENT_BUY_IN,
                        message: `Tournament Buy-In: -$${totalCost.toFixed(2)} (${tournament.name})`,
                    };
                    await this.redis.getClient().publish(
                        `user_alerts:${userId}`,
                        JSON.stringify({ target: 'USER', userId, payload }),
                    );
                } catch (err: any) {
                    this.logger.error(`Failed to push balance update: ${err.message}`);
                }
            }

            return {
                id: entry.id,
                tournamentId: entry.tournamentId,
                userId: entry.userId,
                isActive: entry.isActive,
                rebuysUsed: entry.rebuysUsed,
                addonsUsed: entry.addonsUsed,
                reEntriesUsed: entry.reEntriesUsed,
                finishPosition: entry.finishPosition,
                prizeWon: entry.prizeWon != null ? Number(entry.prizeWon) : null,
                createdAt: entry.createdAt.toISOString(),
            };
        });
    }

    // ============================================================
    // Unregister (before tournament starts)
    // ============================================================

    async unregisterPlayer(userId: string, tournamentId: string): Promise<void> {
        return this.prisma.$transaction(async (tx) => {
            const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
            if (!tournament) throw new NotFoundException('Tournament not found');

            // Can only unregister before tournament is RUNNING
            const unregisterableStatuses: TournamentStatus[] = ['ANNOUNCED', 'REGISTERING'];
            if (!unregisterableStatuses.includes(tournament.status)) {
                throw new ForbiddenException('Cannot unregister from a running tournament');
            }

            const entry = await tx.tournamentEntry.findUnique({
                where: { tournamentId_userId: { tournamentId, userId } },
            });
            if (!entry || !entry.isActive) {
                throw new NotFoundException('No active registration found');
            }

            // Delete entry
            await tx.tournamentEntry.delete({ where: { id: entry.id } });

            // Refund buy-in + fee
            const totalRefund = Number(tournament.buyIn) + Number(tournament.fee);
            if (totalRefund > 0) {
                const wallet = await tx.wallet.findUnique({ where: { userId } });
                if (wallet) {
                    const balanceBefore = Number(wallet.realBalance);
                    const balanceAfter = balanceBefore + totalRefund;

                    await tx.wallet.update({
                        where: { id: wallet.id },
                        data: { realBalance: { increment: new Prisma.Decimal(totalRefund) } },
                    });

                    await tx.transaction.create({
                        data: {
                            walletId: wallet.id,
                            type: TransactionType.TOURNAMENT_REFUND,
                            amount: new Prisma.Decimal(totalRefund),
                            status: TransactionStatus.COMPLETED,
                            description: `Tournament refund: ${tournament.name}`,
                            balanceBefore,
                            balanceAfter,
                            referenceId: `tournament:${tournamentId}:refund:${Date.now()}`,
                        },
                    });
                }
            }

            // Decrement tournament counters
            const newTotalEntries = Math.max(0, tournament.totalEntries - 1);
            const buyIn = Number(tournament.buyIn);
            const collectedPool = buyIn * newTotalEntries;
            const gtd = Number(tournament.guaranteedPrizePool);
            const actualPrizePool = Math.max(collectedPool, gtd);

            await tx.tournament.update({
                where: { id: tournamentId },
                data: {
                    totalEntries: { decrement: 1 },
                    playersRemaining: { decrement: 1 },
                    actualPrizePool: new Prisma.Decimal(actualPrizePool),
                },
            });

            this.logger.log(`Player ${userId} unregistered from "${tournament.name}" | Refund: $${totalRefund}`);
        });
    }

    // ============================================================
    // Status Transition (Used by Yellow Cable Cron)
    // ============================================================

    async transitionStatus(tournamentId: string, newStatus: TournamentStatus): Promise<void> {
        const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
        if (!tournament) throw new NotFoundException('Tournament not found');

        // Prevent invalid transitions
        if (tournament.status === newStatus) {
            this.logger.debug(`Tournament ${tournamentId} already in ${newStatus} — skipping`);
            return; // Idempotent
        }

        const finishData: any = {};
        if (newStatus === 'FINISHED') {
            finishData.finishedAt = new Date();
        }

        await this.prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: newStatus, ...finishData },
        });

        // Publish state change via Redis for real-time UI updates
        try {
            await this.redis.getClient().publish(
                'tournament_state_changes',
                JSON.stringify({
                    tournamentId,
                    oldStatus: tournament.status,
                    newStatus,
                    timestamp: new Date().toISOString(),
                }),
            );
        } catch (err: any) {
            this.logger.error(`Failed to publish tournament state change: ${err.message}`);
        }

        this.logger.log(
            `🏆 Tournament "${tournament.name}" transitioned: ${tournament.status} → ${newStatus}`
        );
    }

    // ============================================================
    // Helper: Convert Prisma model → Response DTO
    // ============================================================

    private toResponseDto(tournament: any): TournamentResponseDto {
        return {
            id: tournament.id,
            name: tournament.name,
            description: tournament.description,
            gameType: tournament.gameType,
            entryFormat: tournament.entryFormat,
            buyIn: tournament.buyIn instanceof Decimal ? tournament.buyIn.toNumber() : Number(tournament.buyIn),
            fee: tournament.fee instanceof Decimal ? tournament.fee.toNumber() : Number(tournament.fee),
            guaranteedPrizePool: tournament.guaranteedPrizePool instanceof Decimal
                ? tournament.guaranteedPrizePool.toNumber()
                : Number(tournament.guaranteedPrizePool),
            actualPrizePool: tournament.actualPrizePool instanceof Decimal
                ? tournament.actualPrizePool.toNumber()
                : Number(tournament.actualPrizePool),
            bountyAmount: tournament.bountyAmount != null
                ? (tournament.bountyAmount instanceof Decimal ? tournament.bountyAmount.toNumber() : Number(tournament.bountyAmount))
                : null,
            startingChips: tournament.startingChips,
            blindStructure: tournament.blindStructure,
            seatCap: tournament.seatCap,
            minPlayersToStart: tournament.minPlayersToStart,
            payoutStructure: tournament.payoutStructure,
            startTime: tournament.startTime instanceof Date ? tournament.startTime.toISOString() : tournament.startTime,
            lateRegistration: tournament.lateRegistration,
            autoStart: tournament.autoStart,
            rebuyEnabled: tournament.rebuyEnabled,
            addonEnabled: tournament.addonEnabled,
            status: tournament.status,
            totalEntries: tournament.totalEntries,
            playersRemaining: tournament.playersRemaining,
            currentBlindLevel: tournament.currentBlindLevel,
            tablesActive: tournament.tablesActive,
            isPrivate: !!tournament.password,
            createdAt: tournament.createdAt instanceof Date ? tournament.createdAt.toISOString() : tournament.createdAt,
        };
    }
}
