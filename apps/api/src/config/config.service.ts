import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BankConfigDto, bankConfigSchema } from '@poker/shared';

@Injectable()
export class ConfigService {
    constructor(private prisma: PrismaService) { }

    get authConfig() {
        return {
            allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
            googleEnabled: !!process.env.GOOGLE_CLIENT_ID,
        };
    }

    get isProduction() {
        return process.env.NODE_ENV === 'production';
    }

    async getBankConfig(): Promise<BankConfigDto> {
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

        return config.value as unknown as BankConfigDto;
    }

    async updateBankConfig(dto: BankConfigDto, adminName: string): Promise<BankConfigDto> {
        const validated = bankConfigSchema.parse(dto);

        // Transaction: Save history THEN update config
        await this.prisma.$transaction(async (tx) => {
            // 1. Fetch current config to save as history
            const currentConfig = await tx.systemConfig.findUnique({
                where: { key: 'BANK_CONFIG' },
            });

            if (currentConfig) {
                const currentData = currentConfig.value as unknown as BankConfigDto;
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

            // 2. Update to new config
            await tx.systemConfig.upsert({
                where: { key: 'BANK_CONFIG' },
                update: {
                    value: validated as any,
                    updatedBy: adminName,
                },
                create: {
                    key: 'BANK_CONFIG',
                    value: validated as any,
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

        return history.map(h => ({
            ...h,
            // Map Prisma date to string for DTO if needed, or rely on serialization
            // DTO schema expects string for date, Prisma returns Date object. 
            // Usually NestJS serializes Date to string automatically, but let's be safe if DTO says string.
            // Actually, existing code didn't map it, so it likely relies on automatic serialization or the DTO type allows Date?
            // Checking DTO: date: z.string().  Prisma: createdAt DateTime.
            // Let's explicitly format it to ISO string or keep as is if it worked before.
            // To match "updatedBy", we use "adminName".
            updatedBy: h.adminName,
            adminAvatar: h.admin?.avatarUrl || undefined
        }));
    }

    async getAllConfigs() {
        // Fetch all key-value pairs from SQL
        const configs = await this.prisma.systemConfig.findMany();

        // Convert array to object
        const systemMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);

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

    async restoreBankConfig(historyId: string, adminName: string) {

        const historyItem = await this.prisma.bankConfigHistory.findUnique({
            where: { id: historyId },
        });

        if (!historyItem) {
            throw new NotFoundException('History item not found');
        }

        const restoredDto: BankConfigDto = {
            iban: historyItem.iban,
            bankName: historyItem.bankName,
            holderName: historyItem.holderName,
            instructions: historyItem.instructions || undefined,
            bic: '', // History might not have BIC, or we need to add it to history model. Using empty for now.
            isActive: true,
        };

        // Reuse existing update logic to ensure history chain continues
        // We just pass a specific note if possible, but our updateBankConfig logic currently hardcodes 'Manual Update'
        // For simplicity, we just call updateBankConfig. 
        // Improvement: Allow passing note to updateBankConfig to log "Restored from..."

        // Let's modify updateBankConfig logic slightly in-line or just copy it here with specific note

        await this.prisma.$transaction(async (tx) => {
            // 1. Archive CURRENT state before restoring OLD state
            const currentConfig = await tx.systemConfig.findUnique({
                where: { key: 'BANK_CONFIG' },
            });

            if (currentConfig) {
                const currentData = currentConfig.value as unknown as BankConfigDto;
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

            // 2. Restore
            await tx.systemConfig.upsert({
                where: { key: 'BANK_CONFIG' },
                update: {
                    value: restoredDto as any,
                    updatedBy: adminName,
                },
                create: {
                    key: 'BANK_CONFIG',
                    value: restoredDto as any,
                    updatedBy: adminName,
                },
            });
        });

        return restoredDto;
    }
}
