import { WalletService } from './wallet.service';
import { AdminTransactionQueryDto, AdminBalanceAdjustmentDto } from '@poker/shared';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
export declare class WalletAdminController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getAllTransactions(query: AdminTransactionQueryDto): Promise<{
        data: {
            amount: number;
            user: {
                username: string;
                iban: string;
                bankName: string;
                email: string;
                avatarUrl: string;
                accountNumber: string;
                accountHolderName: string;
            };
            processedBy: {
                id: string;
                username: string;
                avatarUrl: string;
            };
            performedBy: {
                id: string;
                username: string;
                avatarUrl: string;
            };
            wallet: {
                user: {
                    username: string;
                    iban: string;
                    bankName: string;
                    email: string;
                    avatarUrl: string;
                    accountNumber: string;
                    accountHolderName: string;
                };
            } & {
                id: string;
                userId: string;
                realBalance: import("@prisma/client/runtime/library").Decimal;
                bonusBalance: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            id: string;
            walletId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            status: import(".prisma/client").$Enums.TransactionStatus;
            description: string | null;
            rejectionReason: string | null;
            processedById: string | null;
            performedById: string | null;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    adjustBalance(dto: AdminBalanceAdjustmentDto, req: AuthenticatedRequest): Promise<{
        amount: number;
        id: string;
        walletId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        status: import(".prisma/client").$Enums.TransactionStatus;
        description: string | null;
        rejectionReason: string | null;
        processedById: string | null;
        performedById: string | null;
        createdAt: Date;
    }>;
    approveDeposit(id: string, body: {
        finalAmount?: number;
    }, req: AuthenticatedRequest): Promise<{
        id: string;
        walletId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.TransactionStatus;
        description: string | null;
        rejectionReason: string | null;
        processedById: string | null;
        performedById: string | null;
        createdAt: Date;
    }>;
    rejectDeposit(id: string, body: {
        reason?: string;
    }, req: AuthenticatedRequest): Promise<{
        id: string;
        walletId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.TransactionStatus;
        description: string | null;
        rejectionReason: string | null;
        processedById: string | null;
        performedById: string | null;
        createdAt: Date;
    }>;
    approveWithdraw(id: string, req: AuthenticatedRequest): Promise<{
        id: string;
        walletId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.TransactionStatus;
        description: string | null;
        rejectionReason: string | null;
        processedById: string | null;
        performedById: string | null;
        createdAt: Date;
    }>;
    rejectWithdraw(id: string, body: {
        reason?: string;
    }, req: AuthenticatedRequest): Promise<{
        id: string;
        walletId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.TransactionStatus;
        description: string | null;
        rejectionReason: string | null;
        processedById: string | null;
        performedById: string | null;
        createdAt: Date;
    }>;
}
