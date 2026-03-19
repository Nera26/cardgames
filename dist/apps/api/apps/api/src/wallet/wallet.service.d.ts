import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DepositDto, WithdrawDto, LockFundsDto, AdminTransactionQueryDto, AdminBalanceAdjustmentDto, TransactionStatus } from '@poker/shared';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
export declare class WalletService {
    private prisma;
    private config;
    private audit;
    constructor(prisma: PrismaService, config: ConfigService, audit: AuditService);
    getBalance(userId: string): Promise<{
        id: string;
        userId: string;
        realBalance: number;
        bonusBalance: number;
    }>;
    createWallet(userId: string): Promise<{
        id: string;
        userId: string;
        realBalance: number;
        bonusBalance: number;
    }>;
    getTransactions(userId: string, query: AdminTransactionQueryDto): Promise<{
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
    createDepositRequest(userId: string, dto: DepositDto): Promise<{
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
    createWithdrawalRequest(userId: string, dto: WithdrawDto): Promise<{
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
    lockFunds(userId: string, dto: LockFundsDto): Promise<{
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
    adminGetTransactions(query: AdminTransactionQueryDto): Promise<{
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
                realBalance: Prisma.Decimal;
                bonusBalance: Prisma.Decimal;
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
    adminAdjustBalance(dto: AdminBalanceAdjustmentDto, adminId: string): Promise<{
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
    adminProcessTransaction(transactionId: string, status: TransactionStatus, finalAmount?: number, rejectionReason?: string, processedById?: string): Promise<{
        id: string;
        walletId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        amount: Prisma.Decimal;
        status: import(".prisma/client").$Enums.TransactionStatus;
        description: string | null;
        rejectionReason: string | null;
        processedById: string | null;
        performedById: string | null;
        createdAt: Date;
    }>;
    private getWalletOrThrow;
}
