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
var CronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../common/redis.service");
const client_1 = require("@prisma/client");
let CronService = CronService_1 = class CronService {
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.logger = new common_1.Logger(CronService_1.name);
    }
    async runAudit() {
        this.logger.log('Starting financial reconciliation audit...');
        try {
            const totals = await this.getSystemTotals();
            const wallets = new client_1.Prisma.Decimal(totals.totalWalletBalance);
            const chips = new client_1.Prisma.Decimal(totals.totalChipsInPlay);
            const expected = new client_1.Prisma.Decimal(totals.expectedBalance);
            const currentTotal = wallets.plus(chips);
            const discrepancy = currentTotal.minus(expected);
            const status = discrepancy.isZero() ? 'MATCH' : 'DRIFT';
            const report = await this.prisma.reconciliationReport.create({
                data: {
                    totalWalletBalance: wallets,
                    totalChipsInPlay: chips,
                    expectedBalance: expected,
                    systemDiscrepancy: discrepancy,
                    status,
                    details: {
                        walletDetail: totals.walletDetail,
                        tableCount: totals.tableCount,
                    },
                },
            });
            if (status === 'DRIFT') {
                this.logger.error(`CRITICAL: Financial Drift Detected! Discrepancy: ${discrepancy.toString()}`);
            }
            else {
                this.logger.log(`Audit Complete: System in balance. (Report ID: ${report.id})`);
            }
            return report;
        }
        catch (error) {
            this.logger.error('Failed to run financial audit', error.stack);
            throw error;
        }
    }
    async getSystemTotals() {
        var _a, _b, _c, _d, _e;
        const walletSum = await this.prisma.wallet.aggregate({
            _sum: {
                realBalance: true,
                bonusBalance: true,
            },
        });
        const totalWalletBalance = (((_a = walletSum._sum.realBalance) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0) +
            (((_b = walletSum._sum.bonusBalance) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0);
        const ledgerSum = await this.prisma.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                type: {
                    in: ['DEPOSIT', 'WITHDRAW'],
                },
                status: 'COMPLETED',
            },
        });
        const expectedBalance = ((_c = ledgerSum._sum.amount) === null || _c === void 0 ? void 0 : _c.toNumber()) || 0;
        const redisTotal = await this.sumChipsFromRedis();
        return {
            totalWalletBalance,
            expectedBalance,
            totalChipsInPlay: redisTotal.total,
            tableCount: redisTotal.count,
            walletDetail: {
                real: ((_d = walletSum._sum.realBalance) === null || _d === void 0 ? void 0 : _d.toNumber()) || 0,
                bonus: ((_e = walletSum._sum.bonusBalance) === null || _e === void 0 ? void 0 : _e.toNumber()) || 0,
            }
        };
    }
    async sumChipsFromRedis() {
        const redis = this.redisService.getClient();
        let total = 0;
        let tableCount = 0;
        let cursor = '0';
        do {
            const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'table:*', 'COUNT', 100);
            cursor = newCursor;
            for (const key of keys) {
                if (key.includes(':'))
                    continue;
                tableCount++;
                const tableData = await redis.hgetall(key);
                const pot = parseInt(tableData.pot || '0', 10);
                total += pot;
                const playersData = await redis.hgetall(`${key}:players`);
                for (const playerJson of Object.values(playersData)) {
                    try {
                        const player = JSON.parse(playerJson);
                        total += (player.chips || 0);
                    }
                    catch (e) {
                        this.logger.error(`Failed to parse player data for key ${key}:players`, e);
                    }
                }
            }
        } while (cursor !== '0');
        return { total, count: tableCount };
    }
};
exports.CronService = CronService;
exports.CronService = CronService = CronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], CronService);
//# sourceMappingURL=cron.service.js.map