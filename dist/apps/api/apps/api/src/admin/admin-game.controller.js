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
var AdminGameController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGameController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../common/redis.service");
const roles_guard_1 = require("../auth/guards/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const game_gateway_1 = require("../game/game.gateway");
let AdminGameController = AdminGameController_1 = class AdminGameController {
    constructor(prisma, redisService, gameGateway) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.gameGateway = gameGateway;
        this.logger = new common_1.Logger(AdminGameController_1.name);
    }
    async getDashboard() {
        const tables = await this.prisma.gameTable.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        const redis = this.redisService.getClient();
        let totalPlayers = 0;
        let totalRake = 0;
        let alertCount = 0;
        let runningCount = 0;
        const godModeTables = await Promise.all(tables.map(async (t) => {
            const cacheKey = `admin:table_stats:${t.id}`;
            const cachedStats = await redis.get(cacheKey);
            let stats = {
                handsPerHour: 0,
                totalRake: 0,
                avgPot: 0,
                activePlayers: 0,
                totalHands: 0,
                securityAlert: false,
                alertReason: undefined,
            };
            if (cachedStats) {
                try {
                    stats = JSON.parse(cachedStats);
                }
                catch (e) {
                    this.logger.warn(`Failed to parse cached stats for ${t.id}`);
                }
            }
            else {
                try {
                    const [tableData, playerCount] = await Promise.all([
                        redis.hgetall(`table:${t.id}`),
                        redis.hlen(`table:${t.id}:players`),
                    ]);
                    stats.activePlayers = playerCount || 0;
                    stats.totalHands = parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.handNumber) || '0', 10);
                }
                catch (_a) { }
            }
            let status = 'WAITING';
            let phase = 'waiting';
            try {
                phase = await redis.hget(`table:${t.id}`, 'phase') || 'waiting';
                if (phase === 'PAUSED' || phase === 'paused') {
                    status = 'PAUSED';
                }
                else if (phase === 'error') {
                    status = 'ERROR';
                }
                else if (stats.activePlayers >= 2) {
                    status = 'RUNNING';
                    runningCount++;
                }
            }
            catch (_b) { }
            totalPlayers += stats.activePlayers;
            totalRake += stats.totalRake;
            if (stats.securityAlert)
                alertCount++;
            let severity = 'HEALTHY';
            if (stats.securityAlert || status === 'ERROR') {
                severity = 'CRITICAL';
            }
            else if (stats.handsPerHour > 90 || stats.activePlayers >= t.maxSeats) {
                severity = 'WARNING';
            }
            const uptimeMs = Date.now() - new Date(t.createdAt).getTime();
            const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
            const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
            const uptime = `${hours}h ${minutes}m`;
            let variantDisplay = t.variant.replace('_', ' ');
            if (t.variant === 'TEXAS_HOLDEM') {
                variantDisplay = "Texas Hold'em";
            }
            else if (t.variant === 'OMAHA') {
                variantDisplay = `PLO-${t.holeCardsCount}`;
            }
            else if (t.variant === 'ALL_IN_OR_FOLD') {
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
        }));
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
    async getInspectorDetails(tableId) {
        const redis = this.redisService.getClient();
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);
        const players = [];
        const ipCounts = {};
        Object.entries(playerData || {}).forEach(([seat, data]) => {
            try {
                const player = JSON.parse(data);
                if (player && player.userId) {
                    const playerInfo = {
                        seat: parseInt(seat),
                        userId: player.userId,
                        name: player.username || player.userId.slice(0, 8),
                        chips: player.stack || 0,
                        ip: player.ipAddress || 'Unknown',
                        status: player.status || 'active',
                    };
                    players.push(playerInfo);
                    if (player.ipAddress) {
                        ipCounts[player.ipAddress] = (ipCounts[player.ipAddress] || 0) + 1;
                    }
                }
            }
            catch (_a) { }
        });
        let liveLog = [];
        try {
            const logKey = `table:${tableId}:log`;
            const logEntries = await redis.lrange(logKey, 0, 19);
            liveLog = logEntries.map((entry) => {
                try {
                    return JSON.parse(entry);
                }
                catch (_a) {
                    return { action: entry, time: new Date().toISOString(), type: 'system' };
                }
            });
        }
        catch (_a) {
        }
        let chat = [];
        try {
            const chatKey = `table:${tableId}:chat`;
            const chatEntries = await redis.lrange(chatKey, 0, 19);
            chat = chatEntries.map((entry) => {
                try {
                    return JSON.parse(entry);
                }
                catch (_a) {
                    return { message: entry, time: new Date().toISOString(), user: 'System' };
                }
            });
        }
        catch (_b) {
        }
        const playersWithFlags = players.map(p => (Object.assign(Object.assign({}, p), { isDuplicateIP: ipCounts[p.ip] > 1 })));
        return {
            tableId,
            phase: (tableData === null || tableData === void 0 ? void 0 : tableData.phase) || 'waiting',
            handNumber: parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.handNumber) || '0'),
            pot: parseFloat((tableData === null || tableData === void 0 ? void 0 : tableData.pot) || '0'),
            players: playersWithFlags.sort((a, b) => a.seat - b.seat),
            liveLog,
            chat,
            maxSeats: parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.maxSeats) || '9'),
        };
    }
    async getTableConfig(tableId) {
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
            ante: Number(table.ante || 0),
            password: table.password || null,
            rakePercent: Number(table.rakePercent || 5),
            rakeCap: Number(table.rakeCap || 10),
            turnTime: Number(table.turnTime || 30),
            timeBank: Number(table.timeBank || 60),
            status: table.status,
            isActive: table.isActive,
            createdAt: table.createdAt.toISOString(),
        };
    }
    async updateTableConfig(tableId, dto) {
        const redis = this.redisService.getClient();
        const updateData = {};
        if (dto.password !== undefined)
            updateData.password = dto.password;
        if (dto.rakePercent !== undefined)
            updateData.rakePercent = dto.rakePercent;
        if (dto.rakeCap !== undefined)
            updateData.rakeCap = dto.rakeCap;
        if (dto.turnTime !== undefined)
            updateData.turnTime = dto.turnTime;
        if (dto.timeBank !== undefined)
            updateData.timeBank = dto.timeBank;
        if (dto.status === 'PAUSED') {
            updateData.status = 'PAUSED';
            await redis.hset(`table:${tableId}`, 'phase', 'PAUSED');
        }
        else if (dto.status === 'RUNNING') {
            updateData.status = 'RUNNING';
            const currentPhase = await redis.hget(`table:${tableId}`, 'phase');
            if (currentPhase === 'PAUSED') {
                await redis.hset(`table:${tableId}`, 'phase', 'waiting');
            }
        }
        const updated = await this.prisma.gameTable.update({
            where: { id: tableId },
            data: updateData,
        });
        const configUpdate = {
            tableId,
            rakePercent: dto.rakePercent,
            rakeCap: dto.rakeCap,
            turnTime: dto.turnTime,
            timeBank: dto.timeBank,
            timestamp: new Date().toISOString(),
        };
        await redis.publish(`table:${tableId}:config_update`, JSON.stringify(configUpdate));
        this.gameGateway.server.to(`table:${tableId}`).emit('TABLE_CONFIG_UPDATED', configUpdate);
        this.logger.log(`Table ${tableId} config updated: ${JSON.stringify(updateData)}`);
        return { success: true, updated: updateData };
    }
    async forceSave(tableId) {
        const redis = this.redisService.getClient();
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);
        let playerCount = 0;
        Object.values(playerData || {}).forEach((data) => {
            try {
                const player = JSON.parse(data);
                if (player && player.userId)
                    playerCount++;
            }
            catch (_a) { }
        });
        await this.prisma.gameTable.update({
            where: { id: tableId },
            data: {
                status: (tableData === null || tableData === void 0 ? void 0 : tableData.phase) || 'waiting',
            },
        });
        this.logger.log(`Force-saved table ${tableId}: phase=${tableData === null || tableData === void 0 ? void 0 : tableData.phase}, players=${playerCount}`);
        return {
            success: true,
            snapshot: {
                phase: tableData === null || tableData === void 0 ? void 0 : tableData.phase,
                playerCount,
                handNumber: tableData === null || tableData === void 0 ? void 0 : tableData.handNumber,
            }
        };
    }
    async getTables() {
        const tables = await this.prisma.gameTable.findMany();
        const redis = this.redisService.getClient();
        const result = await Promise.all(tables.map(async (t) => {
            let playersCount = 0;
            let tableStatus = 'INACTIVE';
            try {
                const [phase, count] = await Promise.all([
                    redis.hget(`table:${t.id}`, 'phase'),
                    redis.hlen(`table:${t.id}:players`),
                ]);
                playersCount = count || 0;
                if (phase === 'PAUSED') {
                    tableStatus = 'PAUSED';
                }
                else if (playersCount >= t.maxSeats) {
                    tableStatus = 'FULL';
                }
                else if (playersCount > 0) {
                    tableStatus = 'ACTIVE';
                }
                else if (t.isActive) {
                    tableStatus = 'ACTIVE';
                }
                else {
                    tableStatus = 'INACTIVE';
                }
            }
            catch (error) {
                this.logger.error(`Failed to fetch Redis data for table ${t.id}: ${error.message}`);
                tableStatus = t.isActive ? 'ACTIVE' : 'INACTIVE';
            }
            return {
                id: t.id,
                name: t.name,
                stakes: `$${t.smallBlind}/$${t.bigBlind}`,
                players: `${playersCount}/${t.maxSeats}`,
                status: tableStatus,
                revenue: 0,
            };
        }));
        return result;
    }
    async updateStatus(id, dto) {
        const redis = this.redisService.getClient();
        let newStatus = 'ACTIVE';
        if (dto.action === 'PAUSE') {
            newStatus = 'PAUSED';
            await redis.hset(`table:${id}`, 'phase', 'PAUSED');
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: true },
            });
        }
        else if (dto.action === 'CLOSE') {
            newStatus = 'INACTIVE';
            await redis.hset(`table:${id}`, 'phase', 'INACTIVE');
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: false },
            });
        }
        else if (dto.action === 'OPEN') {
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
    async mutePlayer(tableId, playerId, body) {
        const redis = this.redisService.getClient();
        const duration = body.durationMinutes || 10;
        const muteKey = `mute:${tableId}:${playerId}`;
        await redis.set(muteKey, '1', 'EX', duration * 60);
        await redis.publish(`table:${tableId}:chat`, JSON.stringify({
            type: 'SYSTEM',
            message: `A player has been muted for ${duration} minutes.`,
            timestamp: new Date().toISOString(),
        }));
        this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_MUTED', {
            playerId,
            duration,
        });
        this.logger.log(`Admin muted player ${playerId} on table ${tableId} for ${duration}m`);
        return { success: true, mutedFor: duration };
    }
    async forceStand(tableId, seat) {
        const redis = this.redisService.getClient();
        const playersKey = `table:${tableId}:players`;
        const playerData = await redis.hget(playersKey, seat);
        if (!playerData) {
            return { success: false, message: 'Seat is empty' };
        }
        try {
            const player = JSON.parse(playerData);
            await redis.hset(playersKey, seat, JSON.stringify({
                status: 'empty',
                userId: null,
                stack: 0,
            }));
            this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_FORCED_STAND', {
                seat: parseInt(seat),
                playerId: player.userId,
                reason: 'Admin action',
            });
            this.logger.log(`Admin force-stood player from seat ${seat} on table ${tableId}`);
            return { success: true, removedPlayer: player.userId };
        }
        catch (e) {
            return { success: false, message: 'Failed to parse player data' };
        }
    }
    async forceSit(tableId, body) {
        const redis = this.redisService.getClient();
        const playersKey = `table:${tableId}:players`;
        const existingPlayer = await redis.hget(playersKey, body.seat.toString());
        if (existingPlayer) {
            try {
                const parsed = JSON.parse(existingPlayer);
                if (parsed.status !== 'empty' && parsed.userId) {
                    return { success: false, message: 'Seat is occupied' };
                }
            }
            catch (_a) { }
        }
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
            select: { minBuyIn: true, maxBuyIn: true },
        });
        const chips = body.chips || Number((table === null || table === void 0 ? void 0 : table.maxBuyIn) || 1000);
        await redis.hset(playersKey, body.seat.toString(), JSON.stringify({
            userId: body.userId,
            stack: chips,
            status: 'active',
            isAdmin: true,
            ipAddress: 'ADMIN_OVERRIDE',
        }));
        this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_JOINED', {
            seat: body.seat,
            userId: body.userId,
            stack: chips,
            isAdmin: true,
        });
        this.logger.log(`Admin force-sat user ${body.userId} at seat ${body.seat} on table ${tableId}`);
        return { success: true, seat: body.seat, chips };
    }
    async broadcast(tableId, body) {
        var _a;
        if (!((_a = body.message) === null || _a === void 0 ? void 0 : _a.trim())) {
            return { success: false, message: 'Message required' };
        }
        const redis = this.redisService.getClient();
        await redis.publish(`table:${tableId}:chat`, JSON.stringify({
            type: 'ADMIN_BROADCAST',
            message: body.message,
            timestamp: new Date().toISOString(),
        }));
        this.gameGateway.server.to(`table:${tableId}`).emit('ADMIN_BROADCAST', {
            message: body.message,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Admin broadcast to table ${tableId}: ${body.message}`);
        return { success: true };
    }
};
exports.AdminGameController = AdminGameController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(':tableId/inspector'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "getInspectorDetails", null);
__decorate([
    (0, common_1.Get)(':tableId/config'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "getTableConfig", null);
__decorate([
    (0, common_1.Patch)(':tableId'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "updateTableConfig", null);
__decorate([
    (0, common_1.Post)(':tableId/force-save'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "forceSave", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "getTables", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':tableId/players/:playerId/mute'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Param)('playerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "mutePlayer", null);
__decorate([
    (0, common_1.Post)(':tableId/players/:seat/force-stand'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Param)('seat')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "forceStand", null);
__decorate([
    (0, common_1.Post)(':tableId/force-sit'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "forceSit", null);
__decorate([
    (0, common_1.Post)(':tableId/broadcast'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "broadcast", null);
exports.AdminGameController = AdminGameController = AdminGameController_1 = __decorate([
    (0, common_1.Controller)('admin/tables'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        game_gateway_1.GameGateway])
], AdminGameController);
//# sourceMappingURL=admin-game.controller.js.map