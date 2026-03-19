import { z } from 'zod';
export declare enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAW = "WITHDRAW",
    BUY_IN = "BUY_IN",
    CASH_OUT = "CASH_OUT",
    BONUS = "BONUS",
    RAKE = "RAKE"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare const walletResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    realBalance: z.ZodNumber;
    bonusBalance: z.ZodNumber;
}, z.core.$strip>;
export type WalletResponseDto = z.infer<typeof walletResponseSchema>;
export declare const transactionResponseSchema: z.ZodObject<{
    id: z.ZodString;
    walletId: z.ZodString;
    type: z.ZodEnum<typeof TransactionType>;
    amount: z.ZodNumber;
    status: z.ZodEnum<typeof TransactionStatus>;
    description: z.ZodNullable<z.ZodString>;
    rejectionReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type TransactionResponseDto = z.infer<typeof transactionResponseSchema>;
export declare const depositSchema: z.ZodObject<{
    amount: z.ZodOptional<z.ZodNumber>;
    method: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DepositDto = z.infer<typeof depositSchema>;
export declare const withdrawSchema: z.ZodObject<{
    amount: z.ZodNumber;
    bankAccount: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type WithdrawDto = z.infer<typeof withdrawSchema>;
export declare const lockFundsSchema: z.ZodObject<{
    amount: z.ZodNumber;
    tableId: z.ZodString;
}, z.core.$strip>;
export type LockFundsDto = z.infer<typeof lockFundsSchema>;
export declare const adminTransactionQuerySchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<typeof TransactionType>>;
    status: z.ZodOptional<z.ZodEnum<typeof TransactionStatus>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type AdminTransactionQueryDto = z.infer<typeof adminTransactionQuerySchema>;
export declare const adminBalanceAdjustmentSchema: z.ZodObject<{
    userId: z.ZodString;
    amount: z.ZodNumber;
    type: z.ZodEnum<{
        BONUS: "BONUS";
        ADJUSTMENT: "ADJUSTMENT";
        PENALTY: "PENALTY";
    }>;
    reason: z.ZodString;
}, z.core.$strip>;
export type AdminBalanceAdjustmentDto = z.infer<typeof adminBalanceAdjustmentSchema>;
