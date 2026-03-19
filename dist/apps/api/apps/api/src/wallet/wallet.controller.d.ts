import { WalletService } from './wallet.service';
import { DepositDto, WithdrawDto, LockFundsDto } from '@poker/shared';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getBalance(req: AuthenticatedRequest): Promise<{
        id: string;
        userId: string;
        realBalance: number;
        bonusBalance: number;
    }>;
    getTransactions(req: AuthenticatedRequest): Promise<{
        data: {
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
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    deposit(req: AuthenticatedRequest, dto: DepositDto): Promise<{
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
    withdraw(req: AuthenticatedRequest, dto: WithdrawDto): Promise<{
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
    lockFunds(req: AuthenticatedRequest, dto: LockFundsDto): Promise<{
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
}
