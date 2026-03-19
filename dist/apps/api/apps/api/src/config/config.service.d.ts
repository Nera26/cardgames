import { PrismaService } from '../prisma/prisma.service';
import { BankConfigDto } from '@poker/shared';
export declare class ConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    get authConfig(): {
        allowRegistration: boolean;
        googleEnabled: boolean;
    };
    get isProduction(): boolean;
    getBankConfig(): Promise<BankConfigDto>;
    updateBankConfig(dto: BankConfigDto, adminName: string): Promise<BankConfigDto>;
    getBankHistory(): Promise<{
        updatedBy: string;
        adminAvatar: string;
        admin: {
            avatarUrl: string;
        };
        id: string;
        adminId: string | null;
        adminName: string;
        iban: string;
        bankName: string;
        holderName: string;
        instructions: string | null;
        note: string | null;
        createdAt: Date;
    }[]>;
    getAllConfigs(): Promise<{
        system: {
            maintenance: boolean;
            version: string;
        };
        auth: {
            allowRegistration: boolean;
            googleEnabled: boolean;
        };
        bank: any;
        features: {
            chat: boolean;
            leaderboard: boolean;
        };
    }>;
    restoreBankConfig(historyId: string, adminName: string): Promise<{
        iban: string;
        bankName: string;
        holderName: string;
        isActive: boolean;
        bic?: string;
        instructions?: string;
    }>;
}
