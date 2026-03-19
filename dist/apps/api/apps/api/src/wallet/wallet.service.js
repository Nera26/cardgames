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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const shared_1 = require("@poker/shared");
const config_1 = require("@nestjs/config");
const audit_service_1 = require("../audit/audit.service");
let WalletService = class WalletService {
    constructor(prisma, config, audit) {
        this.prisma = prisma;
        this.config = config;
        this.audit = audit;
    }
    async getBalance(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            return this.createWallet(userId);
        }
        return {
            id: wallet.id,
            userId: wallet.userId,
            realBalance: Number(wallet.realBalance),
            bonusBalance: Number(wallet.bonusBalance),
        };
    }
    async createWallet(userId) {
        const wallet = await this.prisma.wallet.create({
            data: { userId },
        });
        return {
            id: wallet.id,
            userId: wallet.userId,
            realBalance: Number(wallet.realBalance),
            bonusBalance: Number(wallet.bonusBalance),
        };
    }
    async getTransactions(userId, query) {
        const { limit, page, type, status } = query;
        const skip = (page - 1) * limit;
        const where = Object.assign(Object.assign({ wallet: { userId } }, (type && { type: type })), (status && { status: status }));
        const [total, transactions] = await Promise.all([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return {
            data: transactions.map(tx => (Object.assign(Object.assign({}, tx), { amount: Number(tx.amount) }))),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
    async createDepositRequest(userId, dto) {
        const wallet = await this.getWalletOrThrow(userId);
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: shared_1.TransactionType.DEPOSIT,
                    amount: new client_1.Prisma.Decimal(dto.amount || 0),
                    status: shared_1.TransactionStatus.PENDING,
                    description: `Deposit via ${dto.method || 'Standard'}`,
                },
            });
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async createWithdrawalRequest(userId, dto) {
        const wallet = await this.getWalletOrThrow(userId);
        const amount = new client_1.Prisma.Decimal(dto.amount);
        if (wallet.realBalance.lessThan(amount)) {
            throw new common_1.BadRequestException('Insufficient real balance');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedBatch = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    realBalance: { gte: amount }
                },
                data: {
                    realBalance: { decrement: amount },
                },
            });
            if (updatedBatch.count === 0) {
                throw new common_1.BadRequestException('Insufficient funds (Race Condition Detected)');
            }
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: shared_1.TransactionType.WITHDRAW,
                    amount: amount.negated(),
                    status: shared_1.TransactionStatus.PENDING,
                    description: dto.comment || `Withdrawal to ${dto.bankAccount || 'Bank'}`,
                },
            });
            await this.audit.record({
                userId: userId,
                action: shared_1.AuditAction.WALLET_WITHDRAW,
                payload: { transactionId: transaction.id, amount: Number(transaction.amount) },
                ipAddress: null,
            }, tx);
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async lockFunds(userId, dto) {
        const wallet = await this.getWalletOrThrow(userId);
        const amount = new client_1.Prisma.Decimal(dto.amount);
        if (wallet.realBalance.lessThan(amount)) {
            throw new common_1.BadRequestException('Insufficient funds for buy-in');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedBatch = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    realBalance: { gte: amount }
                },
                data: {
                    realBalance: { decrement: amount },
                },
            });
            if (updatedBatch.count === 0) {
                throw new common_1.BadRequestException('Insufficient funds (Race Condition Detected)');
            }
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: shared_1.TransactionType.BUY_IN,
                    amount: amount.negated(),
                    status: shared_1.TransactionStatus.COMPLETED,
                    description: `Buy-in for table ${dto.tableId}`,
                }
            });
            await this.audit.record({
                userId: userId,
                action: shared_1.AuditAction.WALLET_TRANSFER,
                payload: { transactionId: transaction.id, amount: Number(transaction.amount), tableId: dto.tableId },
                ipAddress: null,
            }, tx);
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async adminGetTransactions(query) {
        const { limit, page, type, status, userId } = query;
        const skip = (page - 1) * limit;
        const where = Object.assign(Object.assign({ wallet: { userId } }, (type && { type: type })), (status && { status: status }));
        const [total, transactions] = await Promise.all([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: { include: { user: { select: { username: true, email: true, avatarUrl: true, bankName: true, accountNumber: true, accountHolderName: true, iban: true } } } },
                    processedBy: { select: { id: true, username: true, avatarUrl: true } },
                    performedBy: { select: { id: true, username: true, avatarUrl: true } }
                }
            }),
        ]);
        return {
            data: transactions.map(tx => (Object.assign(Object.assign({}, tx), { amount: Number(tx.amount), user: tx.wallet.user, processedBy: tx.processedBy, performedBy: tx.performedBy }))),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
    async adminAdjustBalance(dto, adminId) {
        const wallet = await this.getWalletOrThrow(dto.userId);
        return this.prisma.$transaction(async (tx) => {
            const amount = new client_1.Prisma.Decimal(dto.amount);
            if (amount.isZero())
                throw new common_1.BadRequestException('Amount cannot be zero');
            if (amount.isNegative()) {
                if (wallet.realBalance.plus(amount).isNegative()) {
                    throw new common_1.BadRequestException('Insufficient funds. User balance cannot be negative.');
                }
            }
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    realBalance: { increment: amount },
                }
            });
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: amount.isPositive() ? shared_1.TransactionType.BONUS : shared_1.TransactionType.CASH_OUT,
                    amount: amount,
                    status: shared_1.TransactionStatus.COMPLETED,
                    description: `Admin Adjustment: ${dto.reason} (${dto.type})`,
                    performedById: adminId,
                }
            });
            await this.audit.record({
                userId: dto.userId,
                action: shared_1.AuditAction.WALLET_ADJUSTMENT,
                payload: {
                    transactionId: transaction.id,
                    amount: Number(transaction.amount),
                    reason: dto.reason,
                    performedBy: adminId
                },
                ipAddress: null,
            }, tx);
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async adminProcessTransaction(transactionId, status, finalAmount, rejectionReason, processedById) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: transactionId },
                include: { wallet: true }
            });
            if (!transaction)
                throw new common_1.NotFoundException('Transaction not found');
            if (transaction.status !== shared_1.TransactionStatus.PENDING) {
                throw new common_1.BadRequestException('Transaction is not pending');
            }
            let amountToProcess = transaction.amount;
            if (status === shared_1.TransactionStatus.COMPLETED && finalAmount !== undefined) {
                amountToProcess = new client_1.Prisma.Decimal(finalAmount);
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: { amount: amountToProcess }
                });
            }
            if (status === shared_1.TransactionStatus.COMPLETED) {
                if (transaction.type === shared_1.TransactionType.DEPOSIT) {
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: { realBalance: { increment: amountToProcess } }
                    });
                }
                else if (transaction.type === shared_1.TransactionType.WITHDRAW) {
                }
            }
            else if (status === shared_1.TransactionStatus.REJECTED) {
                if (transaction.type === shared_1.TransactionType.WITHDRAW) {
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: { realBalance: { increment: transaction.amount } }
                    });
                }
            }
            const updated = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: status,
                    rejectionReason: rejectionReason || null,
                    processedById: processedById || null
                }
            });
            if (status === shared_1.TransactionStatus.COMPLETED && transaction.type === shared_1.TransactionType.DEPOSIT) {
                await this.audit.record({
                    userId: transaction.wallet.userId,
                    action: shared_1.AuditAction.WALLET_DEPOSIT,
                    payload: { transactionId: updated.id, amount: Number(updated.amount) },
                    ipAddress: null,
                }, tx);
            }
            else if (status === shared_1.TransactionStatus.REJECTED && transaction.type === shared_1.TransactionType.WITHDRAW) {
                await this.audit.record({
                    userId: transaction.wallet.userId,
                    action: shared_1.AuditAction.WALLET_ADJUSTMENT,
                    payload: { transactionId: updated.id, amount: Number(updated.amount), reason: 'Withdrawal Rejected' },
                    ipAddress: null,
                }, tx);
            }
            return updated;
        });
    }
    async getWalletOrThrow(userId) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        return wallet;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map