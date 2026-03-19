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
var GameService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("../wallet/wallet.service");
const lua_runner_service_1 = require("./lua-runner.service");
const game_gateway_1 = require("./game.gateway");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let GameService = GameService_1 = class GameService {
    constructor(walletService, luaRunner, gameGateway, prisma) {
        this.walletService = walletService;
        this.luaRunner = luaRunner;
        this.gameGateway = gameGateway;
        this.prisma = prisma;
        this.logger = new common_1.Logger(GameService_1.name);
    }
    async createTable(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.logger.log(`Creating table: ${data.name} (${data.variant})`);
        const table = await this.prisma.gameTable.create({
            data: {
                name: data.name,
                variant: data.variant,
                maxSeats: data.maxSeats,
                smallBlind: new library_1.Decimal(data.smallBlind),
                bigBlind: new library_1.Decimal(data.bigBlind),
                minBuyIn: new library_1.Decimal(data.minBuyIn),
                maxBuyIn: new library_1.Decimal(data.maxBuyIn),
                ante: new library_1.Decimal((_a = data.ante) !== null && _a !== void 0 ? _a : 0),
                turnTime: (_b = data.turnTime) !== null && _b !== void 0 ? _b : 30,
                timeBank: (_c = data.timeBank) !== null && _c !== void 0 ? _c : 60,
                isStraddleAllowed: (_d = data.isStraddleAllowed) !== null && _d !== void 0 ? _d : false,
                password: (_e = data.password) !== null && _e !== void 0 ? _e : null,
                rakePercent: new library_1.Decimal((_f = data.rakePercent) !== null && _f !== void 0 ? _f : 0),
                rakeCap: new library_1.Decimal((_g = data.rakeCap) !== null && _g !== void 0 ? _g : 0),
                holeCardsCount: (_h = data.holeCardsCount) !== null && _h !== void 0 ? _h : 2,
                bettingLimit: ((_j = data.bettingLimit) !== null && _j !== void 0 ? _j : 'NO_LIMIT'),
            },
        });
        return this.mapToLobbyTable(table, 0);
    }
    async getTables(filters) {
        var _a;
        const tables = await this.prisma.gameTable.findMany({
            where: Object.assign({ isActive: (_a = filters === null || filters === void 0 ? void 0 : filters.isActive) !== null && _a !== void 0 ? _a : true }, ((filters === null || filters === void 0 ? void 0 : filters.variant) && { variant: filters.variant })),
            orderBy: { createdAt: 'desc' },
        });
        const tablesWithPlayers = await Promise.all(tables.map(async (table) => {
            const playerCount = await this.getPlayerCount(table.id);
            return this.mapToLobbyTable(table, playerCount);
        }));
        return tablesWithPlayers;
    }
    async getTableById(id) {
        const table = await this.prisma.gameTable.findUnique({
            where: { id },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Table not found: ${id}`);
        }
        const playerCount = await this.getPlayerCount(id);
        return this.mapToLobbyTable(table, playerCount);
    }
    async getPlayerCount(tableId) {
        try {
            const redis = this.luaRunner.getClient();
            const playersKey = `table:${tableId}:players`;
            const playerData = await redis.hgetall(playersKey);
            return Object.values(playerData).filter(p => {
                try {
                    const parsed = JSON.parse(p);
                    return parsed && parsed.status !== 'empty';
                }
                catch (_a) {
                    return false;
                }
            }).length;
        }
        catch (_a) {
            return 0;
        }
    }
    mapToLobbyTable(table, playerCount) {
        var _a;
        return {
            id: table.id,
            name: table.name,
            variant: table.variant,
            stakes: `$${Number(table.smallBlind)}/$${Number(table.bigBlind)}`,
            players: playerCount,
            maxSeats: table.maxSeats,
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            holeCardsCount: (_a = table.holeCardsCount) !== null && _a !== void 0 ? _a : 2,
            isActive: table.isActive,
            status: table.status,
            isPrivate: !!table.password,
            rakePercent: Number(table.rakePercent),
        };
    }
    async initializeTableRedis(tableId) {
        const redis = this.luaRunner.getClient();
        const configKey = `table:${tableId}:config`;
        const exists = await redis.exists(configKey);
        if (exists) {
            this.logger.debug(`Table ${tableId} Redis config already initialized`);
            return;
        }
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Table not found: ${tableId}`);
        }
        await redis.hset(configKey, {
            rakePercent: Number(table.rakePercent),
            rakeCap: Number(table.rakeCap),
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            turnTime: table.turnTime,
            timeBank: table.timeBank,
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            holeCardsCount: table.holeCardsCount,
            variant: table.variant,
            bettingLimit: table.bettingLimit,
        });
        await redis.hset(`table:${tableId}`, {
            id: tableId,
            name: table.name,
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            maxSeats: table.maxSeats,
        });
        this.logger.log(`Table ${tableId} Redis config initialized from Postgres`);
    }
    async rebuy(userId, tableId, amount) {
        this.logger.log(`User ${userId} attempting rebuy of ${amount} on table ${tableId}`);
        const session = this.gameGateway.getSessionByUserId(userId, tableId);
        if (!session) {
            throw new common_1.BadRequestException('Player session not found on this table');
        }
        try {
            await this.walletService.lockFunds(userId, {
                amount,
                tableId,
            });
            const result = await this.luaRunner.runScript('add_chips_vault', [
                `table:${tableId}`,
                `table:${tableId}:players`,
            ], [session.seat, amount]);
            const response = JSON.parse(result);
            if (!response.success) {
                this.logger.error(`CRITICAL SYNC ERROR: User ${userId} deducted ${amount} for rebuy, but Redis failed: ${response.message}`);
                throw new common_1.InternalServerErrorException('System sync error. Please contact support for manual refund.');
            }
            if (response.tableState) {
                await this.gameGateway.broadcastTableState(tableId, response.tableState);
            }
            return {
                success: true,
                message: 'Rebuy successful',
                tableState: response.tableState
            };
        }
        catch (error) {
            this.logger.error(`Rebuy failed for user ${userId}: ${error.message}`);
            throw error;
        }
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        lua_runner_service_1.LuaRunnerService,
        game_gateway_1.GameGateway,
        prisma_service_1.PrismaService])
], GameService);
//# sourceMappingURL=game.service.js.map