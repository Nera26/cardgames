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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@poker/shared");
let ConfigService = class ConfigService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    get authConfig() {
        return {
            allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
            googleEnabled: !!process.env.GOOGLE_CLIENT_ID,
        };
    }
    get isProduction() {
        return process.env.NODE_ENV === 'production';
    }
    async getBankConfig() {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key: 'BANK_CONFIG' },
        });
        if (!config) {
            return {
                iban: '',
                bic: '',
                bankName: '',
                holderName: '',
                instructions: '',
                isActive: false,
            };
        }
        return config.value;
    }
    async updateBankConfig(dto, adminName) {
        const validated = shared_1.bankConfigSchema.parse(dto);
        await this.prisma.$transaction(async (tx) => {
            const currentConfig = await tx.systemConfig.findUnique({
                where: { key: 'BANK_CONFIG' },
            });
            if (currentConfig) {
                const currentData = currentConfig.value;
                await tx.bankConfigHistory.create({
                    data: {
                        adminName,
                        iban: currentData.iban,
                        bankName: currentData.bankName || 'Unknown Bank',
                        holderName: currentData.holderName,
                        instructions: currentData.instructions,
                        note: 'Manual Update',
                    },
                });
            }
            await tx.systemConfig.upsert({
                where: { key: 'BANK_CONFIG' },
                update: {
                    value: validated,
                    updatedBy: adminName,
                },
                create: {
                    key: 'BANK_CONFIG',
                    value: validated,
                    updatedBy: adminName,
                },
            });
        });
        return validated;
    }
    async getBankHistory() {
        const history = await this.prisma.bankConfigHistory.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                admin: {
                    select: {
                        avatarUrl: true
                    }
                }
            }
        });
        return history.map(h => {
            var _a;
            return (Object.assign(Object.assign({}, h), { updatedBy: h.adminName, adminAvatar: ((_a = h.admin) === null || _a === void 0 ? void 0 : _a.avatarUrl) || undefined }));
        });
    }
    async getAllConfigs() {
        const configs = await this.prisma.systemConfig.findMany();
        const systemMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        return {
            system: {
                maintenance: systemMap.MAINTENANCE_MODE === true,
                version: '1.0.0',
            },
            auth: this.authConfig,
            bank: systemMap.BANK_CONFIG || await this.getBankConfig(),
            features: {
                chat: true,
                leaderboard: true,
            }
        };
    }
    async restoreBankConfig(historyId, adminName) {
        const historyItem = await this.prisma.bankConfigHistory.findUnique({
            where: { id: historyId },
        });
        if (!historyItem) {
            throw new common_1.NotFoundException('History item not found');
        }
        const restoredDto = {
            iban: historyItem.iban,
            bankName: historyItem.bankName,
            holderName: historyItem.holderName,
            instructions: historyItem.instructions || undefined,
            bic: '',
            isActive: true,
        };
        await this.prisma.$transaction(async (tx) => {
            const currentConfig = await tx.systemConfig.findUnique({
                where: { key: 'BANK_CONFIG' },
            });
            if (currentConfig) {
                const currentData = currentConfig.value;
                await tx.bankConfigHistory.create({
                    data: {
                        adminName,
                        iban: currentData.iban,
                        bankName: currentData.bankName || 'Unknown Bank',
                        holderName: currentData.holderName,
                        instructions: currentData.instructions,
                        note: `Restored from history ID: ${historyId.slice(0, 8)}`,
                    },
                });
            }
            await tx.systemConfig.upsert({
                where: { key: 'BANK_CONFIG' },
                update: {
                    value: restoredDto,
                    updatedBy: adminName,
                },
                create: {
                    key: 'BANK_CONFIG',
                    value: restoredDto,
                    updatedBy: adminName,
                },
            });
        });
        return restoredDto;
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigService);
//# sourceMappingURL=config.service.js.map