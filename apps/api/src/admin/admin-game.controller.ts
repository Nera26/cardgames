import { Controller, Get, Post, Patch, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminTableDto, AdminTableActionDto, GodModeTableDto, GodModeDashboardResponse, TableSeverity, UpdateTableConfigDto, TableConfigDetails } from '@poker/shared';
import { GameGateway } from '../game/game.gateway';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('admin/tables')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminGameController {
    private readonly logger = new Logger(AdminGameController.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
        private readonly gameGateway: GameGateway,
        private readonly chatGateway: ChatGateway,
    ) { }

    // ============================================================
    // God Mode Dashboard Endpoint (Blue Cable - Reads from Cache)
    // ============================================================

    @Get('dashboard')
    async getDashboard(): Promise<GodModeDashboardResponse> {
        const tables = await this.prisma.gameTable.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        const redis = this.redisService.getClient();

        let totalPlayers = 0;
        let totalRake = 0;
        let alertCount = 0;
        let runningCount = 0;

        const godModeTables: GodModeTableDto[] = await Promise.all(
            tables.map(async (t) => {
                // Read cached stats from Redis (Yellow Cable worker writes these)
                const cacheKey = `admin:table_stats:${t.id}`;
                const cachedStats = await redis.get(cacheKey);

                let stats = {
                    handsPerHour: 0,
                    totalRake: 0,
                    avgPot: 0,
                    activePlayers: 0,
                    totalHands: 0,
                    securityAlert: false,
                    alertReason: undefined as string | undefined,
                };

                if (cachedStats) {
                    try {
                        stats = JSON.parse(cachedStats);
                    } catch (e) {
                        this.logger.warn(`Failed to parse cached stats for ${t.id}`);
                    }
                } else {
                    // Fallback: Quick read from Redis (no heavy computation)
                    try {
                        const [tableData, playerCount] = await Promise.all([
                            redis.hgetall(`table:${t.id}`),
                            redis.hlen(`table:${t.id}:players`),
                        ]);
                        stats.activePlayers = playerCount || 0;
                        stats.totalHands = parseInt(tableData?.handNumber || '0', 10);
                    } catch { }
                }

                // Determine status from Redis phase
                let status: GodModeTableDto['status'] = 'WAITING';
                let phase = 'waiting';
                try {
                    phase = await redis.hget(`table:${t.id}`, 'phase') || 'waiting';
                    if (phase === 'PAUSED' || phase === 'paused') {
                        status = 'PAUSED';
                    } else if (phase === 'error') {
                        status = 'ERROR';
                    } else if (stats.activePlayers >= 2) {
                        status = 'RUNNING';
                        runningCount++;
                    }
                } catch { }

                totalPlayers += stats.activePlayers;
                totalRake += stats.totalRake;
                if (stats.securityAlert) alertCount++;

                // Calculate severity
                let severity: TableSeverity = 'HEALTHY';
                if (stats.securityAlert || status === 'ERROR') {
                    severity = 'CRITICAL';
                } else if (stats.handsPerHour > 90 || stats.activePlayers >= t.maxSeats) {
                    severity = 'WARNING';
                }

                // Calculate uptime
                const uptimeMs = Date.now() - new Date(t.createdAt).getTime();
                const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
                const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
                const uptime = `${hours}h ${minutes}m`;

                // Variant display name
                let variantDisplay = t.variant.replace('_', ' ');
                if (t.variant === 'TEXAS_HOLDEM') {
                    variantDisplay = "Texas Hold'em";
                } else if (t.variant === 'OMAHA') {
                    variantDisplay = `PLO-${t.holeCardsCount}`;
                } else if (t.variant === 'ALL_IN_OR_FOLD') {
                    variantDisplay = 'All-in or Fold';
                }

                return {
                    id: t.id,
                    name: t.name,
                    variant: t.variant,
                    variantDisplay,
                    stakes: `$${t.smallBlind}/$${t.bigBlind}`,
                    isPrivate: !!t.password,
                    status,
                    phase,
                    handsPerHour: stats.handsPerHour,
                    avgPot: stats.avgPot,
                    totalHands: stats.totalHands,
                    activePlayers: stats.activePlayers,
                    maxSeats: t.maxSeats,
                    occupancyDisplay: `${stats.activePlayers}/${t.maxSeats}`,
                    totalRake: stats.totalRake,
                    rakePercent: Number(t.rakePercent),
                    rakeCap: Number(t.rakeCap),
                    securityAlert: stats.securityAlert,
                    alertReason: stats.alertReason,
                    severity,
                    createdAt: t.createdAt.toISOString(),
                    uptime,
                };
            }),
        );

        return {
            tables: godModeTables,
            summary: {
                totalTables: tables.length,
                runningTables: runningCount,
                totalPlayers,
                totalRake,
                alertCount,
            },
        };
    }

    // ============================================================
    // Inspector Details Endpoint (Real Redis Data)
    // ============================================================

    @Get(':tableId/inspector')
    async getInspectorDetails(@Param('tableId') tableId: string) {
        const redis = this.redisService.getClient();

        // Get table state
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);

        // Parse players
        const players: any[] = [];
        const ipCounts: Record<string, number> = {};

        Object.entries(playerData || {}).forEach(([seat, data]) => {
            try {
                if (!seat.startsWith('seat_')) return;
                const player = JSON.parse(data as string);
                const playerId = player.id || player.userId;
                if (player && playerId) {
                    const playerInfo = {
                        seat: parseInt(seat.replace('seat_', ''), 10),
                        userId: playerId,
                        name: player.username || playerId.slice(0, 8),
                        chips: player.chips ?? player.stack ?? 0,
                        ip: player.ipAddress || 'Unknown',
                        status: player.status || 'active',
                        avatarId: player.avatarId || 'avatar_1',
                        avatarUrl: player.avatarUrl || null,
                    };
                    players.push(playerInfo);

                    // Track IP for collusion detection
                    if (player.ipAddress) {
                        ipCounts[player.ipAddress] = (ipCounts[player.ipAddress] || 0) + 1;
                    }
                }
            } catch { }
        });

        // Get recent hand log from Redis stream (if available)
        let liveLog: any[] = [];
        try {
            const logKey = `table:${tableId}:log`;
            const logEntries = await redis.lrange(logKey, 0, 99); // Last 100 entries
            liveLog = logEntries.map((entry) => {
                try {
                    return JSON.parse(entry);
                } catch {
                    return { action: entry, time: new Date().toISOString(), type: 'system' };
                }
            });
        } catch {
            // No log available
        }

        // Get recent chat messages
        let chat: any[] = [];
        try {
            const chatKey = `table:${tableId}:chat`;
            const chatEntries = await redis.lrange(chatKey, 0, 19);
            chat = chatEntries.map((entry) => {
                try {
                    return JSON.parse(entry);
                } catch {
                    return { message: entry, time: new Date().toISOString(), user: 'System' };
                }
            });
        } catch {
            // No chat available
        }

        // Mark duplicate IPs
        const playersWithFlags = players.map(p => ({
            ...p,
            isDuplicateIP: ipCounts[p.ip] > 1,
        }));

        return {
            tableId,
            phase: tableData?.phase || 'waiting',
            handNumber: parseInt(tableData?.handNumber || '0'),
            pot: parseFloat(tableData?.pot || '0'),
            players: playersWithFlags.sort((a, b) => a.seat - b.seat),
            liveLog,
            chat,
            maxSeats: parseInt(tableData?.maxSeats || '9'),
        };
    }

    // ============================================================
    // Table Configuration (Hot Edit Protocol)
    // ============================================================

    /**
     * Get full table config for admin drawer
     */
    @Get(':tableId/config')
    async getTableConfig(@Param('tableId') tableId: string): Promise<TableConfigDetails> {
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
        });

        if (!table) {
            throw new Error('Table not found');
        }

        return {
            id: table.id,
            name: table.name,
            variant: table.variant,
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            maxSeats: table.maxSeats,
            ante: Number(table.ante),
            password: table.password ?? null,
            rakePercent: Number(table.rakePercent),
            rakeCap: Number(table.rakeCap),
            turnTime: table.turnTime,
            timeBank: table.timeBank,
            status: table.status,
            isActive: table.isActive,
            createdAt: table.createdAt.toISOString(),
        };
    }

    /**
     * Hot-edit table config (safe fields only)
     * Syncs to Redis PubSub for live game pickup
     */
    @Patch(':tableId')
    async updateTableConfig(
        @Param('tableId') tableId: string,
        @Body() dto: UpdateTableConfigDto,
    ) {
        const redis = this.redisService.getClient();

        // Build update object (only defined fields)
        const updateData: any = {};
        if (dto.password !== undefined) updateData.password = dto.password;
        if (dto.rakePercent !== undefined) updateData.rakePercent = dto.rakePercent;
        if (dto.rakeCap !== undefined) updateData.rakeCap = dto.rakeCap;
        if (dto.turnTime !== undefined) updateData.turnTime = dto.turnTime;
        if (dto.timeBank !== undefined) updateData.timeBank = dto.timeBank;

        // Handle status change
        if (dto.status === 'PAUSED') {
            updateData.status = 'PAUSED';
            await redis.hset(`table:${tableId}`, 'phase', 'PAUSED');
        } else if (dto.status === 'RUNNING') {
            updateData.status = 'RUNNING';
            const currentPhase = await redis.hget(`table:${tableId}`, 'phase');
            if (currentPhase === 'PAUSED') {
                await redis.hset(`table:${tableId}`, 'phase', 'waiting');
            }
        }

        // Update Postgres
        const updated = await this.prisma.gameTable.update({
            where: { id: tableId },
            data: updateData,
        });

        // Hot Sync: Publish config update to Redis for live game pickup
        const configUpdate = {
            tableId,
            rakePercent: dto.rakePercent,
            rakeCap: dto.rakeCap,
            turnTime: dto.turnTime,
            timeBank: dto.timeBank,
            timestamp: new Date().toISOString(),
        };
        await redis.publish(`table:${tableId}:config_update`, JSON.stringify(configUpdate));

        // Notify connected clients
        this.gameGateway.server.to(`table:${tableId}`).emit('TABLE_CONFIG_UPDATED', configUpdate);

        this.logger.log(`Table ${tableId} config updated: ${JSON.stringify(updateData)}`);
        return { success: true, updated: updateData };
    }

    /**
     * Force save Redis state to Postgres (debugging/recovery)
     */
    @Post(':tableId/force-save')
    async forceSave(@Param('tableId') tableId: string) {
        const redis = this.redisService.getClient();

        // Get current Redis state
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);

        // Count active players
        let playerCount = 0;
        Object.values(playerData || {}).forEach((data) => {
            try {
                const player = JSON.parse(data as string);
                if (player && player.userId) playerCount++;
            } catch { }
        });

        // Update Postgres with current state
        await this.prisma.gameTable.update({
            where: { id: tableId },
            data: {
                status: tableData?.phase || 'waiting',
                // Could add more fields here for full recovery
            },
        });

        this.logger.log(`Force-saved table ${tableId}: phase=${tableData?.phase}, players=${playerCount}`);
        return {
            success: true,
            snapshot: {
                phase: tableData?.phase,
                playerCount,
                handNumber: tableData?.handNumber,
            }
        };
    }

    // ============================================================
    // Standard Table List (Legacy)
    // ============================================================

    @Get()
    async getTables(): Promise<AdminTableDto[]> {
        const tables = await this.prisma.gameTable.findMany();
        const redis = this.redisService.getClient();

        const result: AdminTableDto[] = await Promise.all(
            tables.map(async (t) => {
                let playersCount = 0;
                let tableStatus: any = 'INACTIVE';

                try {
                    const [phase, count] = await Promise.all([
                        redis.hget(`table:${t.id}`, 'phase'),
                        redis.hlen(`table:${t.id}:players`),
                    ]);

                    playersCount = count || 0;

                    if (phase === 'PAUSED') {
                        tableStatus = 'PAUSED';
                    } else if (playersCount >= t.maxSeats) {
                        tableStatus = 'FULL';
                    } else if (playersCount > 0) {
                        tableStatus = 'ACTIVE';
                    } else if (t.isActive) {
                        tableStatus = 'ACTIVE';
                    } else {
                        tableStatus = 'INACTIVE';
                    }
                } catch (error) {
                    this.logger.error(`Failed to fetch Redis data for table ${t.id}: ${error.message}`);
                    tableStatus = t.isActive ? 'ACTIVE' : 'INACTIVE';
                }

                return {
                    id: t.id,
                    name: t.name,
                    stakes: `$${t.smallBlind}/$${t.bigBlind}`,
                    players: `${playersCount}/${t.maxSeats}`,
                    status: tableStatus as AdminTableDto['status'],
                    revenue: 0,
                };
            }),
        );

        return result;
    }

    // ============================================================
    // Table Actions
    // ============================================================

    @Post(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: AdminTableActionDto,
    ) {
        const redis = this.redisService.getClient();
        let newStatus = 'ACTIVE';

        if (dto.action === 'PAUSE') {
            newStatus = 'PAUSED';
            await redis.hset(`table:${id}`, 'phase', 'PAUSED');
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: true },
            });
        } else if (dto.action === 'CLOSE') {
            // ============================================
            // DESTRUCTIVE TEARDOWN: Full table termination
            // ============================================
            newStatus = 'TERMINATED';

            // Step 1: Stop game engine timers
            try {
                (this.gameGateway as any).autoAdvanceTimers?.delete?.(id);
            } catch {} 

            // Step 2: Refund all players' remaining chip stacks to their wallets
            const playersHash = await redis.hgetall(`table:${id}:players`);
            const refundResults: { userId: string; refunded: number }[] = [];
            for (const [seatKey, rawData] of Object.entries(playersHash || {})) {
                try {
                    const player = JSON.parse(rawData as string);
                    const userId = player.id || player.userId;
                    const chips = Number(player.chips || player.stack || 0);
                    if (!userId || chips <= 0) continue;

                    // Refund via wallet transaction
                    await this.prisma.$transaction(async (tx) => {
                        await tx.wallet.update({
                            where: { userId },
                            data: { realBalance: { increment: chips } },
                        });
                        await tx.transaction.create({
                            data: {
                                walletId: (await tx.wallet.findUnique({ where: { userId } }))!.id,
                                type: 'CASH_OUT',
                                amount: chips,
                                description: `Admin table termination refund from ${id}`,
                            },
                        });
                    });
                    refundResults.push({ userId, refunded: chips });
                    this.logger.log(`Refunded ${chips} chips to ${userId} from terminated table ${id}`);
                } catch (refundErr) {
                    this.logger.error(`Failed to refund player from ${seatKey}: ${refundErr}`);
                }
            }

            // Step 3: Notify all connected clients
            this.gameGateway.server.to(`table:${id}`).emit('TABLE_TERMINATED', {
                tableId: id,
                message: 'Table has been terminated by admin. Your chips have been refunded.',
                refunds: refundResults,
            });

            // Step 4: Clean up ALL Redis keys for this table
            const keysToDelete = [
                `table:${id}`,
                `table:${id}:players`,
                `table:${id}:deck`,
                `table:${id}:log`,
                `table:${id}:chat`,
                `table:${id}:config`,
                `table:${id}:action_log`,
                `admin:table_stats:${id}`,
            ];
            await redis.del(...keysToDelete);

            // Step 5: Update Postgres
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: false, status: 'TERMINATED' },
            });

            this.logger.warn(`TABLE TERMINATED: ${id} — ${refundResults.length} players refunded`);
        } else if (dto.action === 'OPEN') {
            newStatus = 'ACTIVE';
            await redis.hset(`table:${id}`, 'phase', 'waiting');
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: true },
            });
        }

        this.gameGateway.server.to(`table:${id}`).emit('TABLE_STATUS_CHANGED', {
            tableId: id,
            status: newStatus,
        });

        return { success: true, status: newStatus };
    }

    // ============================================================
    // Player Control Actions (Blue -> Red Gateway)
    // ============================================================

    /**
     * Mute a player (prevents chat for duration)
     */
    @Post(':tableId/players/:playerId/mute')
    async mutePlayer(
        @Param('tableId') tableId: string,
        @Param('playerId') playerId: string,
        @Body() body: { durationMinutes?: number },
    ) {
        const redis = this.redisService.getClient();
        const duration = body.durationMinutes || 10;

        // Set mute flag in Redis
        const muteKey = `mute:${tableId}:${playerId}`;
        await redis.set(muteKey, '1', 'EX', duration * 60);

        // Publish event to chat channel
        await redis.publish(`table:${tableId}:chat`, JSON.stringify({
            type: 'SYSTEM',
            message: `A player has been muted for ${duration} minutes.`,
            timestamp: new Date().toISOString(),
        }));

        // Notify player via socket
        this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_MUTED', {
            playerId,
            duration,
        });

        this.logger.log(`Admin muted player ${playerId} on table ${tableId} for ${duration}m`);
        return { success: true, mutedFor: duration };
    }

    /**
     * Force stand a player (admin kick from seat)
     */
    @Post(':tableId/players/:seat/force-stand')
    async forceStand(
        @Param('tableId') tableId: string,
        @Param('seat') seat: string,
    ) {
        const redis = this.redisService.getClient();
        const playersKey = `table:${tableId}:players`;

        // Get player data from seat
        const playerData = await redis.hget(playersKey, seat);
        if (!playerData) {
            return { success: false, message: 'Seat is empty' };
        }

        try {
            const player = JSON.parse(playerData);

            // Clear the seat
            await redis.hset(playersKey, seat, JSON.stringify({
                status: 'empty',
                userId: null,
                stack: 0,
            }));

            // Notify all players
            this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_FORCED_STAND', {
                seat: parseInt(seat),
                playerId: player.userId,
                reason: 'Admin action',
            });

            this.logger.log(`Admin force-stood player from seat ${seat} on table ${tableId}`);
            return { success: true, removedPlayer: player.userId };
        } catch (e) {
            return { success: false, message: 'Failed to parse player data' };
        }
    }

    /**
     * Force sit admin at a table (bypass buy-in)
     */
    @Post(':tableId/force-sit')
    async forceSit(
        @Param('tableId') tableId: string,
        @Body() body: { userId: string; seat: number; chips?: number },
    ) {
        const redis = this.redisService.getClient();
        const playersKey = `table:${tableId}:players`;

        // Check if seat is available
        const existingPlayer = await redis.hget(playersKey, body.seat.toString());
        if (existingPlayer) {
            try {
                const parsed = JSON.parse(existingPlayer);
                if (parsed.status !== 'empty' && parsed.userId) {
                    return { success: false, message: 'Seat is occupied' };
                }
            } catch { }
        }

        // Get table config for default chips
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
            select: { minBuyIn: true, maxBuyIn: true },
        });

        const chips = body.chips || Number(table?.maxBuyIn || 1000);

        // Sit the admin
        await redis.hset(playersKey, body.seat.toString(), JSON.stringify({
            userId: body.userId,
            stack: chips,
            status: 'active',
            isAdmin: true,
            ipAddress: 'ADMIN_OVERRIDE',
        }));

        // Notify all players
        this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_JOINED', {
            seat: body.seat,
            userId: body.userId,
            stack: chips,
            isAdmin: true,
        });

        this.logger.log(`Admin force-sat user ${body.userId} at seat ${body.seat} on table ${tableId}`);
        return { success: true, seat: body.seat, chips };
    }

    /**
     * Broadcast message to table
     */
    @Post(':tableId/broadcast')
    async broadcast(
        @Param('tableId') tableId: string,
        @Body() body: { message: string },
    ) {
        if (!body.message?.trim()) {
            return { success: false, message: 'Message required' };
        }

        const redis = this.redisService.getClient();

        // Persist to chat list so it appears in Inspector Chat tab
        const chatEntry = JSON.stringify({
            user: '⚡ SYSTEM',
            message: body.message,
            time: new Date().toISOString(),
            userId: null,
            isSystem: true,
        });
        const chatKey = `table:${tableId}:chat`;
        await redis.lpush(chatKey, chatEntry);
        await redis.ltrim(chatKey, 0, 49);

        // Emit via main game socket (for admin inspector)
        this.gameGateway.server.to(`table:${tableId}`).emit('ADMIN_BROADCAST', {
            message: body.message,
            timestamp: new Date().toISOString(),
        });

        // Emit via /chat namespace so in-game players see it in Table Chat
        this.chatGateway.server.to(`table:${tableId}`).emit('new_message', {
            sender: '⚡ SYSTEM',
            text: body.message,
            type: 'SYSTEM',
            timestamp: new Date(),
        });

        this.logger.log(`Admin broadcast to table ${tableId}: ${body.message}`);
        return { success: true };
    }

    // ============================================================
    // Kick Player — Atomic Remove + Notify
    // ============================================================
    @Post(':tableId/kick')
    async kickPlayer(
        @Param('tableId') tableId: string,
        @Body() body: { seat: number; playerId: string; reason?: string },
    ) {
        const redis = this.redisService.getClient();
        const playersKey = `table:${tableId}:players`;

        // Validate player exists at this seat
        const playerData = await redis.hget(playersKey, `seat_${body.seat}`);
        if (!playerData) {
            return { success: false, message: 'No player at this seat' };
        }

        const player = JSON.parse(playerData);
        if (player.id !== body.playerId) {
            return { success: false, message: 'Player ID mismatch at this seat' };
        }

        const reason = (body.reason || 'No reason provided').substring(0, 200);

        // Execute atomic force stand up (leave_table.lua + cashout queue + broadcast state)
        await this.gameGateway.forceStandUp(tableId, body.seat, body.playerId);

        // Emit FORCE_KICKED directly to the target player's socket
        // The game gateway uses /game namespace
        const sockets = await this.gameGateway.server.fetchSockets();
        for (const s of sockets) {
            const socketUserId = (s as any).user?.id || (s as any).handshake?.auth?.userId;
            if (socketUserId === body.playerId) {
                s.emit('FORCE_KICKED', {
                    tableId,
                    reason,
                    timestamp: new Date().toISOString(),
                });
            }
        }

        // Push admin log
        const logKey = `admin:table_log:${tableId}`;
        await redis.lpush(logKey, JSON.stringify({
            action: `ADMIN KICK: ${player.name || body.playerId} — ${reason}`,
            time: new Date().toISOString(),
            type: 'system',
        }));
        await redis.ltrim(logKey, 0, 199);

        this.logger.warn(`ADMIN KICK: Player ${body.playerId} removed from table ${tableId}. Reason: ${reason}`);
        return { success: true, message: `Player kicked: ${reason}` };
    }
}

