import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { LuaRunnerService } from './lua-runner.service';
import { GameGateway } from './game.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto, LobbyTableDto, TableFiltersDto, GameVariant } from '@poker/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);

    constructor(
        private readonly walletService: WalletService,
        private readonly luaRunner: LuaRunnerService,
        @Inject(forwardRef(() => GameGateway))
        private readonly gameGateway: GameGateway,
        private readonly prisma: PrismaService,
    ) { }

    // ============================================================
    // Blue Cable: Table Management (Postgres only, NO Redis)
    // ============================================================

    /**
     * Create a new table configuration in Postgres.
     * NOTE: Redis is NOT initialized here. It's lazy-loaded when first player joins.
     */
    async createTable(data: CreateTableDto): Promise<LobbyTableDto> {
        this.logger.log(`Creating table: ${data.name} (${data.variant})`);

        const table = await this.prisma.gameTable.create({
            data: {
                name: data.name,
                variant: data.variant as any, // Prisma enum
                maxSeats: data.maxSeats,
                smallBlind: new Decimal(data.smallBlind),
                bigBlind: new Decimal(data.bigBlind),
                minBuyIn: new Decimal(data.minBuyIn),
                maxBuyIn: new Decimal(data.maxBuyIn),
                // Pro-Tier Settings
                ante: new Decimal(data.ante ?? 0),
                turnTime: data.turnTime ?? 30,
                timeBank: data.timeBank ?? 60,
                isStraddleAllowed: data.isStraddleAllowed ?? false,
                password: data.password ?? null,
                // Pro-Tier: Rake (Yellow Cable)
                rakePercent: new Decimal(data.rakePercent ?? 0),
                rakeCap: new Decimal(data.rakeCap ?? 0),
                // Omaha Protocol
                holeCardsCount: data.holeCardsCount ?? 2,
                bettingLimit: (data.bettingLimit ?? 'NO_LIMIT') as any,
            },
        });

        return this.mapToLobbyTable(table, 0); // 0 players initially
    }

    /**
     * Get all active tables from Postgres.
     * Optionally filter by variant.
     */
    async getTables(filters?: TableFiltersDto): Promise<LobbyTableDto[]> {
        const tables = await this.prisma.gameTable.findMany({
            where: {
                isActive: filters?.isActive ?? true,
                ...(filters?.variant && { variant: filters.variant as any }),
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get player counts from Redis for each table
        const tablesWithPlayers = await Promise.all(
            tables.map(async (table) => {
                const playerCount = await this.getPlayerCount(table.id);
                return this.mapToLobbyTable(table, playerCount);
            })
        );

        return tablesWithPlayers;
    }

    /**
     * Get a single table by ID.
     */
    async getTableById(id: string): Promise<LobbyTableDto> {
        const table = await this.prisma.gameTable.findUnique({
            where: { id },
        });

        if (!table) {
            throw new NotFoundException(`Table not found: ${id}`);
        }

        const playerCount = await this.getPlayerCount(id);
        return this.mapToLobbyTable(table, playerCount);
    }

    /**
     * Get player count from Redis (if table is active in Redis).
     */
    private async getPlayerCount(tableId: string): Promise<number> {
        try {
            const redis = this.luaRunner.getClient();
            const playersKey = `table:${tableId}:players`;
            const playerData = await redis.hgetall(playersKey);

            // Count non-empty seats
            return Object.values(playerData).filter(p => {
                try {
                    const parsed = JSON.parse(p);
                    return parsed && parsed.status !== 'empty';
                } catch {
                    return false;
                }
            }).length;
        } catch {
            return 0; // Table not yet in Redis
        }
    }

    /**
     * Map Prisma GameTable to LobbyTableDto.
     */
    private mapToLobbyTable(table: any, playerCount: number): LobbyTableDto {
        return {
            id: table.id,
            name: table.name,
            variant: table.variant as GameVariant,
            stakes: `$${Number(table.smallBlind)}/$${Number(table.bigBlind)}`,
            players: playerCount,
            maxSeats: table.maxSeats,
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            holeCardsCount: table.holeCardsCount ?? 2,
            isActive: table.isActive,
            status: table.status,
            isPrivate: !!table.password, // True if password is set
            rakePercent: Number(table.rakePercent), // Exposed for UI display
            // TODO: Wire to Redis hand/pot tracker when aggregator is built
            handsPerHour: 0,
            avgPot: '$0',
        };
    }

    // ============================================================
    // Red Cable: Redis Configuration Seeder (Hot Sync Protocol)
    // ============================================================

    /**
     * Initialize table configuration in Redis from Postgres.
     * Called lazily on first player join - ensures Lua scripts can read config.
     * 
     * Seeds: table:{id}:config with rakePercent, rakeCap, turnTime, timeBank, blinds
     */
    async initializeTableRedis(tableId: string): Promise<void> {
        const redis = this.luaRunner.getClient();
        const configKey = `table:${tableId}:config`;

        // Check if already initialized (idempotent)
        const exists = await redis.exists(configKey);
        if (exists) {
            this.logger.debug(`Table ${tableId} Redis config already initialized`);
            return;
        }

        // Fetch config from Postgres (Blue Cable -> Red Cable handoff)
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
        });

        if (!table) {
            throw new NotFoundException(`Table not found: ${tableId}`);
        }

        // Seed Redis config hash (convert Decimals to numbers for Redis)
        await redis.hset(configKey, {
            rakePercent: Number(table.rakePercent),
            rakeCap: Number(table.rakeCap),
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            turnTime: table.turnTime,
            timeBank: table.timeBank,
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            // Multi-Variant Support (Red Cable Polymorphism)
            holeCardsCount: table.holeCardsCount,
            variant: table.variant,
            bettingLimit: table.bettingLimit,
        });

        // Also seed the main table hash with blinds for Lua
        await redis.hset(`table:${tableId}`, {
            id: tableId,
            name: table.name,
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            maxSeats: table.maxSeats,
            createdAt: table.createdAt.toISOString(),
        });

        this.logger.log(`Table ${tableId} Redis config initialized from Postgres`);
    }

    /**
     * Get the password for a table (null if public).
     * Used by the Gateway Bouncer to validate private table joins.
     */
    async getTablePassword(tableId: string): Promise<string | null> {
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
            select: { password: true },
        });
        return table?.password ?? null;
    }

    // ============================================================
    // Red Cable: Rebuy (Existing)
    // ============================================================

    async rebuy(userId: string, tableId: string, amount: number) {
        this.logger.log(`User ${userId} attempting rebuy of ${amount} on table ${tableId}`);

        // 1. Find the player's seat via sessions in Gateway
        const session = this.gameGateway.getSessionByUserId(userId, tableId);
        if (!session) {
            throw new BadRequestException('Player session not found on this table');
        }

        try {
            // 2. Step 1: Iron Vault (Prisma) - Deduct funds
            // lockFunds handles the transaction, decrement, and transaction record creation.
            await this.walletService.lockFunds(userId, {
                amount,
                tableId,
            });

            // 3. Step 2: Red Cable (Lua/Redis) - Add chips to stack
            const result = await this.luaRunner.runScript<string>(
                'add_chips_vault',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                ],
                [session.seat, amount]
            );

            const response = JSON.parse(result);
            if (!response.success) {
                // CRITICAL: Lua rejected — refund the money back to Postgres immediately
                this.logger.error(
                    `CRITICAL SYNC ERROR: User ${userId} deducted ${amount} for rebuy, ` +
                    `but Redis failed: ${response.message}. Initiating automatic refund.`
                );
                // Fire-and-forget refund via the same Blue Cable vault lock
                await this.walletService.settleCashOut(userId, amount, tableId);
                this.logger.log(`[REFUND] Auto-refunded $${amount.toLocaleString()} to user ${userId} after failed rebuy`);
                throw new BadRequestException(
                    `Buy-in rejected by table engine: ${response.message || 'Unknown error'}. Funds refunded.`
                );
            }

            // 4. Update Gateway sessions if necessary (usually seat doesn't change)

            // 5. Broadcast new state to all players
            if (response.tableState) {
                await this.gameGateway.broadcastTableState(tableId, response.tableState);
            }

            // 6. Auto-start: if table was waiting and now has 2+ eligible players, start a hand
            if (response.tableState) {
                const players = response.tableState.players || [];
                const phase = response.tableState.table?.phase || 'waiting';
                const eligible = players.filter(
                    (p: any) => p.status === 'active' || p.status === 'waiting'
                ).length;

                if (phase === 'waiting' && eligible >= 2) {
                    this.logger.log(`Auto-starting hand on table ${tableId} after rebuy (${eligible} eligible players)`);
                    setTimeout(() => this.gameGateway.startNewHand(tableId), 1000);
                }
            }

            return {
                success: true,
                message: 'Rebuy successful',
                tableState: response.tableState
            };
        } catch (error) {
            this.logger.error(`Rebuy failed for user ${userId}: ${error.message}`);
            throw error;
        }
    }
    // ============================================================
    // Blue Cable: Hand History (Postgres Query)
    // ============================================================

    /**
     * Get the last 20 completed hands for a specific table.
     * SECURITY: Only returns the requesting user's own HandPlayerResult.
     * Opponent hole cards are NEVER exposed.
     */
    async getHandHistory(tableId: string, userId: string) {
        const hands = await this.prisma.handHistory.findMany({
            where: { tableId },
            orderBy: { endTime: 'desc' },
            take: 20,
            include: {
                playerResults: true,
            },
        });

        // Batch lookup all unique userIds for winner names
        const allUserIds = new Set<string>();
        for (const hand of hands) {
            for (const pr of hand.playerResults) {
                if (pr.userId) allUserIds.add(pr.userId);
            }
        }
        const users = allUserIds.size > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: Array.from(allUserIds) } },
                select: { id: true, username: true },
            })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));

        return hands.map(hand => {
            // Find hero's own result (privacy: only hero's data)
            const heroResult = hand.playerResults.find(pr => pr.userId === userId);
            // Collect all winners for the hand summary (public info)
            const winners = hand.playerResults
                .filter(pr => pr.winAmount > 0)
                .map(pr => ({
                    seat: pr.seat,
                    amount: pr.winAmount,
                    handDescription: pr.handDescription,
                    name: userMap.get(pr.userId) || null,
                }));

            return {
                handId: hand.id,
                endTime: hand.endTime.toISOString(),
                communityCards: hand.communityCards as string[],
                pot: hand.pot,
                heroSeat: heroResult?.seat ?? null,
                heroNetProfit: heroResult?.netProfit ?? 0,
                heroHandDescription: heroResult?.handDescription ?? null,
                heroCards: heroResult?.cards ?? [],
                winners,
            };
        });
    }

    /**
     * Get detailed hand data for replay (single hand).
     * Includes full action log and hero-only player result.
     */
    async getHandDetail(handId: string, userId: string) {
        const hand = await this.prisma.handHistory.findUnique({
            where: { id: handId },
            include: {
                playerResults: true,
            },
        });

        if (!hand) {
            throw new NotFoundException(`Hand not found: ${handId}`);
        }

        const heroResult = hand.playerResults.find(pr => pr.userId === userId);

        // Look up usernames for all participants
        const userIds = hand.playerResults.map(pr => pr.userId).filter(Boolean);
        const users = userIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true },
            })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));

        const winners = hand.playerResults
            .filter(pr => pr.winAmount > 0)
            .map(pr => ({
                seat: pr.seat,
                amount: pr.winAmount,
                handDescription: pr.handDescription,
                cards: pr.cards ?? [],
                name: userMap.get(pr.userId) || null,
            }));

        return {
            handId: hand.id,
            tableId: hand.tableId,
            endTime: hand.endTime.toISOString(),
            communityCards: hand.communityCards as string[],
            pot: hand.pot,
            rake: hand.rake,
            heroSeat: heroResult?.seat ?? null,
            heroNetProfit: heroResult?.netProfit ?? 0,
            heroHandDescription: heroResult?.handDescription ?? null,
            heroCards: heroResult?.cards ?? [],
            actionLog: (hand as any).actionLog || [],
            winners,
        };
    }

    /**
     * Get the user's hand history across ALL tables (PAGINATED).
     * Used by the Profile page to show a unified game history.
     * Queries via the composite [userId, handId] index.
     */
    async getMyHandHistory(userId: string, page = 1, limit = 20) {
        // Clamp limit to prevent abuse
        const safeLimit = Math.min(Math.max(limit, 1), 50);
        const skip = (page - 1) * safeLimit;

        // Count total for pagination metadata
        const total = await this.prisma.handPlayerResult.count({
            where: { userId },
        });

        // Find the user's hand results for this page
        const playerResults = await this.prisma.handPlayerResult.findMany({
            where: { userId },
            orderBy: { hand: { endTime: 'desc' } },
            skip,
            take: safeLimit,
            include: {
                hand: {
                    include: {
                        playerResults: true,
                    },
                },
            },
        });

        // Collect all unique userIds for winner name resolution
        const allUserIds = new Set<string>();
        for (const pr of playerResults) {
            for (const hpr of pr.hand.playerResults) {
                if (hpr.userId) allUserIds.add(hpr.userId);
            }
        }
        const users = allUserIds.size > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: Array.from(allUserIds) } },
                select: { id: true, username: true },
            })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));

        // Resolve table names
        const tableIds = [...new Set(playerResults.map(pr => pr.hand.tableId))];
        const tables = tableIds.length > 0
            ? await this.prisma.gameTable.findMany({
                where: { id: { in: tableIds } },
                select: { id: true, name: true, smallBlind: true, bigBlind: true },
            })
            : [];
        const tableMap = new Map(tables.map(t => [t.id, t]));

        const data = playerResults.map(pr => {
            const hand = pr.hand;
            const table = tableMap.get(hand.tableId);
            const winners = hand.playerResults
                .filter(r => r.winAmount > 0)
                .map(r => ({
                    seat: r.seat,
                    amount: r.winAmount,
                    handDescription: r.handDescription,
                    name: userMap.get(r.userId) || null,
                }));

            return {
                handId: hand.id,
                tableId: hand.tableId,
                tableName: table?.name ?? 'Unknown Table',
                stakes: table ? `$${table.smallBlind}/$${table.bigBlind}` : '',
                endTime: hand.endTime.toISOString(),
                communityCards: (hand.communityCards as string[]) ?? [],
                pot: hand.pot,
                heroSeat: pr.seat,
                heroNetProfit: pr.netProfit,
                heroHandDescription: pr.handDescription,
                heroCards: pr.cards ?? [],
                winners,
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit: safeLimit,
                totalPages: Math.ceil(total / safeLimit),
            },
        };
    }

    /**
     * Get the user's pre-aggregated game stats.
     * Reads from cached counters on the User model (no COUNT queries).
     * Calculates percentages server-side for mathematical consistency.
     */
    async getMyStats(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                handsPlayed: true,
                handsWon: true,
                tournamentsPlayed: true,
                tournamentsTop3: true,
            },
        });

        if (!user) {
            return { handsPlayed: 0, winRate: 0, tournamentsPlayed: 0, top3Rate: 0 };
        }

        const winRate = user.handsPlayed > 0
            ? Math.round((user.handsWon / user.handsPlayed) * 1000) / 10
            : 0;

        const top3Rate = user.tournamentsPlayed > 0
            ? Math.round((user.tournamentsTop3 / user.tournamentsPlayed) * 1000) / 10
            : 0;

        return {
            handsPlayed: user.handsPlayed,
            winRate,
            tournamentsPlayed: user.tournamentsPlayed,
            top3Rate,
        };
    }
}

