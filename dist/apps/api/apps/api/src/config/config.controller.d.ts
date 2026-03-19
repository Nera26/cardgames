import { ConfigService } from './config.service';
import { BankConfigDto } from '@poker/shared';
export declare class ConfigController {
    private configService;
    constructor(configService: ConfigService);
    getAuthConfig(): {
        allowRegistration: boolean;
        googleEnabled: boolean;
    };
    getInitConfig(): Promise<{
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
    getBankConfig(): Promise<{
        iban: string;
        bankName: string;
        holderName: string;
        isActive: boolean;
        bic?: string;
        instructions?: string;
    }>;
    updateBankConfig(dto: BankConfigDto, req: any): Promise<{
        iban: string;
        bankName: string;
        holderName: string;
        isActive: boolean;
        bic?: string;
        instructions?: string;
    }>;
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
    restoreBankConfig(id: string, req: any): Promise<{
        iban: string;
        bankName: string;
        holderName: string;
        isActive: boolean;
        bic?: string;
        instructions?: string;
    }>;
}
