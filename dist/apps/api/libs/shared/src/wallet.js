"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBalanceAdjustmentSchema = exports.adminTransactionQuerySchema = exports.lockFundsSchema = exports.withdrawSchema = exports.depositSchema = exports.transactionResponseSchema = exports.walletResponseSchema = exports.TransactionStatus = exports.TransactionType = void 0;
const zod_1 = require("zod");
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAW"] = "WITHDRAW";
    TransactionType["BUY_IN"] = "BUY_IN";
    TransactionType["CASH_OUT"] = "CASH_OUT";
    TransactionType["BONUS"] = "BONUS";
    TransactionType["RAKE"] = "RAKE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["APPROVED"] = "APPROVED";
    TransactionStatus["REJECTED"] = "REJECTED";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
exports.walletResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    realBalance: zod_1.z.number(),
    bonusBalance: zod_1.z.number(),
});
exports.transactionResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    walletId: zod_1.z.string(),
    type: zod_1.z.nativeEnum(TransactionType),
    amount: zod_1.z.number(),
    status: zod_1.z.nativeEnum(TransactionStatus),
    description: zod_1.z.string().nullable(),
    rejectionReason: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.date(),
});
exports.depositSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0, "Amount must be positive").optional(),
    method: zod_1.z.string().optional(),
});
exports.withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().min(20, "Minimum withdrawal is 20"),
    bankAccount: zod_1.z.string().optional(),
    comment: zod_1.z.string().optional(),
});
exports.lockFundsSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    tableId: zod_1.z.string(),
});
exports.adminTransactionQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(TransactionType).optional(),
    status: zod_1.z.nativeEnum(TransactionStatus).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    page: zod_1.z.coerce.number().min(1).default(1),
});
exports.adminBalanceAdjustmentSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    amount: zod_1.z.number(),
    type: zod_1.z.enum(['ADJUSTMENT', 'BONUS', 'PENALTY']),
    reason: zod_1.z.string().min(3),
});
//# sourceMappingURL=wallet.js.map