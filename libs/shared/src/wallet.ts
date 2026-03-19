
import { z } from 'zod';

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
    BUY_IN = 'BUY_IN',
    CASH_OUT = 'CASH_OUT',
    BONUS = 'BONUS',
    RAKE = 'RAKE',
    ADMIN_CREDIT = 'ADMIN_CREDIT',
    ADMIN_DEBIT = 'ADMIN_DEBIT',
    TOURNAMENT_BUY_IN = 'TOURNAMENT_BUY_IN',
    TOURNAMENT_REBUY = 'TOURNAMENT_REBUY',
    TOURNAMENT_ADDON = 'TOURNAMENT_ADDON',
    TOURNAMENT_PRIZE = 'TOURNAMENT_PRIZE',
    TOURNAMENT_REFUND = 'TOURNAMENT_REFUND',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED', // Added FAILED for completeness
}

// --- Enriched Balance Broadcast Payload ---
export interface WalletBalanceUpdatedPayload {
    type: 'WALLET_BALANCE_UPDATED';
    userId: string;
    newBalance: number;
    delta: number;                     // +1000000 or -500
    transactionType: TransactionType;  // DEPOSIT, WITHDRAW, BONUS, BUY_IN, etc.
    message: string;                   // "Deposit Approved: +$1,000,000"
}

// --- DTOs ---

export const walletResponseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    realBalance: z.number(),
    bonusBalance: z.number(),
});

export type WalletResponseDto = z.infer<typeof walletResponseSchema>;

export const transactionResponseSchema = z.object({
    id: z.string(),
    walletId: z.string(),
    type: z.nativeEnum(TransactionType),
    amount: z.number(),
    status: z.nativeEnum(TransactionStatus),
    description: z.string().nullable(),
    rejectionReason: z.string().nullable().optional(),
    balanceBefore: z.number().nullable().optional(),
    balanceAfter: z.number().nullable().optional(),
    referenceId: z.string().nullable().optional(),
    createdAt: z.date(), // Or string if serialized, but Date for internal use usually
});

export type TransactionResponseDto = z.infer<typeof transactionResponseSchema>;

export const depositSchema = z.object({
    amount: z.number().min(0, "Amount must be positive").optional(), // Optional, default to 0 if not provided
    method: z.string().optional(), // e.g. "Stripe", "Crypto"
});

export type DepositDto = z.infer<typeof depositSchema>;

export const withdrawSchema = z.object({
    amount: z.number().min(20, "Minimum withdrawal is 20"),
    bankAccount: z.string().optional(),
    comment: z.string().optional(),
});

export type WithdrawDto = z.infer<typeof withdrawSchema>;

export const lockFundsSchema = z.object({
    amount: z.number().positive(),
    tableId: z.string(),
});

export type LockFundsDto = z.infer<typeof lockFundsSchema>;

// --- Admin DTOs ---

export const adminTransactionQuerySchema = z.object({
    userId: z.string().optional(),
    type: z.nativeEnum(TransactionType).optional(),
    status: z.nativeEnum(TransactionStatus).optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    page: z.coerce.number().min(1).default(1),
});

export type AdminTransactionQueryDto = z.infer<typeof adminTransactionQuerySchema>;

export const adminBalanceAdjustmentSchema = z.object({
    userId: z.string(),
    amount: z.number(), // Positive to add, negative to remove
    type: z.enum(['ADJUSTMENT', 'BONUS', 'PENALTY']), // Simplified for manual adjustments
    reason: z.string().min(3),
});

export type AdminBalanceAdjustmentDto = z.infer<typeof adminBalanceAdjustmentSchema>;
