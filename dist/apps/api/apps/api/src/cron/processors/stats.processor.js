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
var StatsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../common/redis.service");
let StatsProcessor = StatsProcessor_1 = class StatsProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, redisService) {
        super();
        this.prisma = prisma;
        this.redisService = redisService;
        this.logger = new common_1.Logger(StatsProcessor_1.name);
    }
    async process(job) {
        if (job.name !== 'table-stats') {
            return;
        }
        this.logger.debug('Running table stats calculation (Yellow Cable)...');
        const startTime = Date.now();
        try {
            const redis = this.redisService.getClient();
            const tables = await this.prisma.gameTable.findMany({
                where: { isActive: true },
                select: { id: true, rakePercent: true, rakeCap: true, bigBlind: true },
            });
            for (const table of tables) {
                try {
                    const stats = await this.calculateTableStats(table.id, redis);
                    const cacheKey = `admin:table_stats:${table.id}`;
                    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 120);
                    this.logger.debug(`Cached stats for table ${table.id}: ${stats.handsPerHour} H/hr`);
                }
                catch (error) {
                    this.logger.error(`Failed to calculate stats for table ${table.id}: ${error.message}`);
                }
            }
            const elapsed = Date.now() - startTime;
            this.logger.log(`Table stats calculated for ${tables.length} tables in ${elapsed}ms`);
        }
        catch (error) {
            this.logger.error(`Stats calculation failed: ${error.message}`);
        }
    }
    async calculateTableStats(tableId, redis) {
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);
        const handCount = parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.handNumber) || '0', 10);
        const tableCreatedAt = (tableData === null || tableData === void 0 ? void 0 : tableData.createdAt)
            ? new Date(tableData.createdAt).getTime()
            : Date.now() - (60 * 60 * 1000);
        const uptimeHours = Math.max(0.1, (Date.now() - tableCreatedAt) / (1000 * 60 * 60));
        const handsPerHour = Math.round(handCount / uptimeHours);
        const totalRake = parseFloat((tableData === null || tableData === void 0 ? void 0 : tableData.totalRake) || '0');
        const pot = parseFloat((tableData === null || tableData === void 0 ? void 0 : tableData.pot) || '0');
        const avgPot = pot > 0 ? pot : Math.round(Math.random() * 50 + 10);
        let activePlayers = 0;
        const ipAddresses = {};
        Object.entries(playerData || {}).forEach(([seat, data]) => {
            try {
                const player = JSON.parse(data);
                if (player && player.status !== 'empty' && player.userId) {
                    activePlayers++;
                    if (player.ipAddress) {
                        if (!ipAddresses[player.ipAddress]) {
                            ipAddresses[player.ipAddress] = [];
                        }
                        ipAddresses[player.ipAddress].push(player.userId);
                    }
                }
            }
            catch (_a) { }
        });
        let securityAlert = false;
        let alertReason;
        for (const [ip, users] of Object.entries(ipAddresses)) {
            if (users.length >= 2) {
                securityAlert = true;
                alertReason = `Duplicate IP: ${ip} (${users.length} players)`;
                break;
            }
        }
        return {
            handsPerHour,
            totalRake,
            avgPot,
            activePlayers,
            totalHands: handCount,
            securityAlert,
            alertReason,
            calculatedAt: new Date().toISOString(),
        };
    }
};
exports.StatsProcessor = StatsProcessor;
exports.StatsProcessor = StatsProcessor = StatsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('system-cron'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], StatsProcessor);
//# sourceMappingURL=stats.processor.js.map