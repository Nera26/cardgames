
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    TransactionStatus as PrismaTransactionStatus,
    TransactionType as PrismaTransactionType,
    Wallet,
    Transaction,
    Prisma
} from '@prisma/client';
import {
    DepositDto,
    WithdrawDto,
    LockFundsDto,
    AdminTransactionQueryDto,
    AdminBalanceAdjustmentDto,
    TransactionType,
    TransactionStatus,
    AuditAction,
    WalletBalanceUpdatedPayload
} from '@poker/shared';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../common/redis.service';


@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
        private audit: AuditService,
        private redis: RedisService,
    ) { }

    async getBalance(userId: string) {
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

    async createWallet(userId: string) {
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

    async getTransactions(userId: string, query: AdminTransactionQueryDto) {
        const { limit, page, type, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TransactionWhereInput = {
            wallet: { userId },
            ...(type && { type: type as PrismaTransactionType }),
            ...(status && { status: status as PrismaTransactionStatus }),
        };

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
            data: transactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount),
                balanceBefore: tx.balanceBefore != null ? Number(tx.balanceBefore) : null,
                balanceAfter: tx.balanceAfter != null ? Number(tx.balanceAfter) : null,
                referenceId: tx.referenceId ?? null,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    async createDepositRequest(userId: string, dto: DepositDto) {
        const wallet = await this.getWalletOrThrow(userId);

        // Transactional creation — PENDING deposits don't change balance
        return this.prisma.$transaction(async (tx) => {
            const currentWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
            const balanceBefore = currentWallet ? Number(currentWallet.realBalance) : 0;

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.DEPOSIT,
                    amount: new Prisma.Decimal(dto.amount || 0),
                    status: TransactionStatus.PENDING,
                    description: `Deposit via ${dto.method || 'Standard'}`,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceBefore, // No change yet — PENDING
                },
            });
            return { ...transaction, amount: Number(transaction.amount) };
        });
    }

    async createWithdrawalRequest(userId: string, dto: WithdrawDto) {
        const wallet = await this.getWalletOrThrow(userId);
        const amount = new Prisma.Decimal(dto.amount);

        // Use Prisma Decimal comparison
        if (wallet.realBalance.lessThan(amount)) {
            throw new BadRequestException('Insufficient real balance');
        }

        return this.prisma.$transaction(async (tx) => {
            // Re-fetch inside transaction to ensure lock? 
            // Prisma interactive transactions don't lock automatically unless we use raw query or update first.
            // A common pattern is to update and check result, or just rely on atomic update decrement throwing if check violates.
            // But Prisma decrement doesn't throw on negative result by default unless check constraint exists.

            // To be strictly safe against race conditions:
            // 1. Update with `decrement` AND `where: { realBalance: { gte: amount } }`
            // But Prisma doesn't support complex where on update easily without throw.
            // Better: We just proceed. If concurrent withdrawing happens, the second one might accidentally go negative 
            // IF we don't lock.
            // "Blue Cable" law says $transaction is enough if we are careful.
            // The Safest way in Postgres implies a SELECT FOR UPDATE or an update with condition.

            // Attempt Atomic Update with specific where clause
            const updatedBatch = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    realBalance: { gte: amount } // Optimistic Locking / Conditional Update
                },
                data: {
                    realBalance: { decrement: amount },
                },
            });

            if (updatedBatch.count === 0) {
                throw new BadRequestException('Insufficient funds (Race Condition Detected)');
            }

            // Snapshot balance AFTER the decrement for the ledger
            const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
            const balanceAfter = updatedWallet ? Number(updatedWallet.realBalance) : 0;
            const balanceBefore = balanceAfter + Number(amount);

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.WITHDRAW,
                    amount: amount.negated(), // Negative for display
                    status: TransactionStatus.PENDING,
                    description: dto.comment || `Withdrawal to ${dto.bankAccount || 'Bank'}`,
                    balanceBefore,
                    balanceAfter,
                },
            });

            await this.audit.record({
                userId: userId,
                action: AuditAction.WALLET_WITHDRAW,
                payload: { transactionId: transaction.id, amount: Number(transaction.amount) },
                ipAddress: null,
            }, tx);

            // Push balance update to frontend
            const delta = -Number(amount);
            await this.pushBalanceUpdate(userId, wallet.id, tx, {
                delta,
                transactionType: TransactionType.WITHDRAW,
                message: `Withdrawal Requested: -$${Number(amount).toLocaleString()}`,
            });

            return { ...transaction, amount: Number(transaction.amount) };
        });
    }

    async lockFunds(userId: string, dto: LockFundsDto) {
        const wallet = await this.getWalletOrThrow(userId);
        const amount = new Prisma.Decimal(dto.amount);

        // Pre-check
        if (wallet.realBalance.lessThan(amount)) {
            throw new BadRequestException('Insufficient funds for buy-in');
        }

        return this.prisma.$transaction(async (tx) => {
            // Atomic Update with condition
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
                throw new BadRequestException('Insufficient funds (Race Condition Detected)');
            }

            // Snapshot balance AFTER the decrement for the ledger
            const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
            const balanceAfter = updatedWallet ? Number(updatedWallet.realBalance) : 0;
            const balanceBefore = balanceAfter + Number(amount);

            // Session ID: links this BUY_IN to its future CASH_OUT
            const referenceId = `${dto.tableId}:${Date.now()}`;

            // Resolve human-readable table name
            const gameTable = await tx.gameTable.findUnique({ where: { id: dto.tableId }, select: { name: true } });
            const tableName = gameTable?.name || dto.tableId;

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.BUY_IN,
                    amount: amount.negated(),
                    status: TransactionStatus.COMPLETED,
                    description: `Buy-in for table: ${tableName}`,
                    balanceBefore,
                    balanceAfter,
                    referenceId,
                }
            });

            await this.audit.record({
                userId: userId,
                action: AuditAction.WALLET_TRANSFER,
                payload: { transactionId: transaction.id, amount: Number(transaction.amount), tableId: dto.tableId },
                ipAddress: null,
            }, tx);

            // Push balance update to frontend
            const delta = -Number(amount);
            await this.pushBalanceUpdate(userId, wallet.id, tx, {
                delta,
                transactionType: TransactionType.BUY_IN,
                message: `Buy-In: -$${Number(amount).toLocaleString()}`,
            });

            return { ...transaction, amount: Number(transaction.amount), referenceId };
        });
    }

    // --- Admin Methods ---

    async adminGetTransactions(query: AdminTransactionQueryDto) {
        const { limit, page, type, status, userId } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TransactionWhereInput = {
            wallet: { userId },
            ...(type && { type: type as PrismaTransactionType }),
            ...(status && { status: status as PrismaTransactionStatus }),
        };

        const [total, transactions] = await Promise.all([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: { include: { user: { select: { username: true, email: true, avatarId: true, avatarUrl: true, bankName: true, accountNumber: true, accountHolderName: true, iban: true } } } },
                    processedBy: { select: { id: true, username: true, avatarId: true, avatarUrl: true } },
                    performedBy: { select: { id: true, username: true, avatarId: true, avatarUrl: true } }
                }
            }),
        ]);

        return {
            data: transactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount),
                user: tx.wallet.user,
                processedBy: tx.processedBy,
                performedBy: tx.performedBy
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    async adminAdjustBalance(dto: AdminBalanceAdjustmentDto, adminId: string) {
        const wallet = await this.getWalletOrThrow(dto.userId);

        return this.prisma.$transaction(async (tx) => {
            const amount = new Prisma.Decimal(dto.amount);

            if (amount.isZero()) throw new BadRequestException('Amount cannot be zero');

            // ═══════════════════════════════════════════════════
            // ROW-LEVEL LOCK: SELECT ... FOR UPDATE
            // Lock the wallet row so no concurrent transaction
            // can read or modify it until this transaction commits.
            // ═══════════════════════════════════════════════════
            const [lockedWallet] = await tx.$queryRaw<{ realBalance: any }[]>`
                SELECT "realBalance" FROM "Wallet" WHERE "userId" = ${dto.userId} FOR UPDATE
            `;
            if (!lockedWallet) throw new NotFoundException('Wallet not found (locked)');

            const balanceBefore = Number(lockedWallet.realBalance);
            const balanceAfter = balanceBefore + Number(amount);

            // Safety Check: Prevent negative balance
            if (balanceAfter < 0) {
                throw new BadRequestException('Insufficient funds. User balance cannot be negative.');
            }

            // Explicit balance write (no increment — we own the exact numbers)
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { realBalance: new Prisma.Decimal(balanceAfter) },
            });

            // Log transaction
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: amount.isPositive() ? TransactionType.ADMIN_CREDIT : TransactionType.ADMIN_DEBIT,
                    amount: amount,
                    status: TransactionStatus.COMPLETED,
                    description: `Admin Adjustment: ${dto.reason} (${dto.type})`,
                    performedById: adminId,
                    balanceBefore,
                    balanceAfter,
                }
            });

            await this.audit.record({
                userId: dto.userId,
                action: AuditAction.WALLET_ADJUSTMENT,
                payload: {
                    transactionId: transaction.id,
                    amount: Number(transaction.amount),
                    reason: dto.reason,
                    performedBy: adminId
                },
                ipAddress: null,
            }, tx);

            // Push balance update to frontend
            const deltaNum = Number(amount);
            await this.pushBalanceUpdate(dto.userId, wallet.id, tx, {
                delta: deltaNum,
                transactionType: deltaNum > 0 ? TransactionType.ADMIN_CREDIT : TransactionType.ADMIN_DEBIT,
                message: `Admin Adjustment: ${dto.reason} (${deltaNum > 0 ? '+' : ''}$${Math.abs(deltaNum).toLocaleString()})`,
            });

            return { ...transaction, amount: Number(transaction.amount) };
        });
    }

    async adminProcessTransaction(transactionId: string, status: TransactionStatus, finalAmount?: number, rejectionReason?: string, processedById?: string) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: transactionId },
                include: { wallet: true }
            });

            if (!transaction) throw new NotFoundException('Transaction not found');
            if (transaction.status !== TransactionStatus.PENDING) {
                throw new BadRequestException('Transaction is not pending');
            }

            // If finalAmount is provided and status is COMPLETED, update the amount
            let amountToProcess = transaction.amount;
            if (status === TransactionStatus.COMPLETED && finalAmount !== undefined) {
                amountToProcess = new Prisma.Decimal(finalAmount);
                // Update the transaction record with the new amount
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: { amount: amountToProcess }
                });
            }

            // Logic definitions
            if (status === TransactionStatus.COMPLETED) {
                if (transaction.type === TransactionType.DEPOSIT) {
                    // Credit User
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: { realBalance: { increment: amountToProcess } }
                    });
                } else if (transaction.type === TransactionType.WITHDRAW) {
                    // Funds were already deducted at creation (Pessimistic locking style? Or we deducted at request time?)
                    // Look at createWithdrawalRequest -> It decremented balance!
                    // So COMPLETED means "Money sent manually", no further DB action needed on balance.
                }
            } else if (status === TransactionStatus.REJECTED) {
                if (transaction.type === TransactionType.WITHDRAW) {
                    // Refund the user since we decremented at request
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: { realBalance: { increment: transaction.amount } }
                    });
                }
            }

            // Snapshot balance AFTER the wallet mutation
            const updatedWallet = await tx.wallet.findUnique({ where: { id: transaction.walletId } });
            const balanceAfter = updatedWallet ? Number(updatedWallet.realBalance) : 0;
            // Compute balanceBefore from balanceAfter and the mutation amount
            let ledgerAmount = 0;
            if (status === TransactionStatus.COMPLETED && transaction.type === TransactionType.DEPOSIT) {
                ledgerAmount = Number(amountToProcess);
            } else if (status === TransactionStatus.REJECTED && transaction.type === TransactionType.WITHDRAW) {
                ledgerAmount = Math.abs(Number(transaction.amount));
            }
            const balanceBefore = balanceAfter - ledgerAmount;

            // Update Status + ledger fields
            const updated = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: status as PrismaTransactionStatus,
                    rejectionReason: rejectionReason || null,
                    processedById: processedById || null,
                    balanceBefore,
                    balanceAfter,
                }
            });

            if (status === TransactionStatus.COMPLETED && transaction.type === TransactionType.DEPOSIT) {
                await this.audit.record({
                    userId: transaction.wallet.userId,
                    action: AuditAction.WALLET_DEPOSIT,
                    payload: { transactionId: updated.id, amount: Number(updated.amount) },
                    ipAddress: null,
                }, tx);

                // Push balance update to frontend
                const depositDelta = Number(amountToProcess);
                await this.pushBalanceUpdate(transaction.wallet.userId, transaction.walletId, tx, {
                    delta: depositDelta,
                    transactionType: TransactionType.DEPOSIT,
                    message: `Deposit Approved: +$${depositDelta.toLocaleString()}`,
                });
            } else if (status === TransactionStatus.REJECTED && transaction.type === TransactionType.WITHDRAW) {
                await this.audit.record({
                    userId: transaction.wallet.userId,
                    action: AuditAction.WALLET_ADJUSTMENT, // Refund
                    payload: { transactionId: updated.id, amount: Number(updated.amount), reason: 'Withdrawal Rejected' },
                    ipAddress: null,
                }, tx);

                // Push balance update (refund) to frontend
                const refundDelta = Number(transaction.amount);
                await this.pushBalanceUpdate(transaction.wallet.userId, transaction.walletId, tx, {
                    delta: Math.abs(refundDelta),
                    transactionType: TransactionType.WITHDRAW,
                    message: `Withdrawal Rejected — Refund: +$${Math.abs(refundDelta).toLocaleString()}`,
                });
            }

            return updated;
        });
    }


    // ════════════════════════════════════════════════════════
    // 🟡 YELLOW CABLE: settleCashOut
    // Called by game.gateway.ts when a player leaves a table.
    // Credits chips back to Postgres wallet and creates an
    // immutable CASH_OUT ledger row with balanceBefore/After.
    //
    // NON-BLOCKING: Gateway calls this without awaiting.
    // ACID: Entire operation is inside a single $transaction.
    // ════════════════════════════════════════════════════════
    async settleCashOut(
        userId: string,
        amount: number,
        tableId: string,
        referenceId?: string,
    ): Promise<void> {
        if (amount <= 0) return; // Nothing to refund

        try {
            let walletId: string | undefined;

            await this.prisma.$transaction(async (tx) => {
                // ═══════════════════════════════════════════════════
                // ROW-LEVEL LOCK: SELECT ... FOR UPDATE
                // Lock the wallet row so no concurrent cash-out or
                // buy-in can read or modify it until this commits.
                // This eliminates the stale-balance race condition.
                // ═══════════════════════════════════════════════════
                const [lockedWallet] = await tx.$queryRaw<{ id: string; realBalance: any }[]>`
                    SELECT "id", "realBalance" FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE
                `;
                if (!lockedWallet) {
                    this.logger.error(`settleCashOut: Wallet not found for user ${userId}`);
                    return;
                }

                walletId = lockedWallet.id;
                const balanceBefore = Number(lockedWallet.realBalance);
                const balanceAfter = balanceBefore + amount;

                // Explicit balance write (no increment — we own the exact numbers)
                await tx.wallet.update({
                    where: { id: lockedWallet.id },
                    data: { realBalance: new Prisma.Decimal(balanceAfter) },
                });

                // Resolve human-readable table name
                const gameTable = await tx.gameTable.findUnique({ where: { id: tableId }, select: { name: true } });
                const tableName = gameTable?.name || tableId;

                // Create immutable ledger row
                await tx.transaction.create({
                    data: {
                        walletId: lockedWallet.id,
                        type: TransactionType.CASH_OUT,
                        amount: new Prisma.Decimal(amount),
                        status: TransactionStatus.COMPLETED,
                        description: `Cash-out from table: ${tableName}`,
                        balanceBefore,
                        balanceAfter,
                        referenceId: referenceId || undefined,
                    },
                });

                this.logger.log(
                    `💵 CASH_OUT settled: user ${userId} +$${amount.toLocaleString()} from table ${tableName} ` +
                    `(before: $${balanceBefore.toLocaleString()}, after: $${balanceAfter.toLocaleString()})`
                );
            });

            // Push balance update OUTSIDE the transaction (non-fatal)
            if (walletId) {
                await this.pushBalanceUpdate(userId, walletId, undefined, {
                    delta: amount,
                    transactionType: TransactionType.CASH_OUT,
                    message: `Cash-Out: +$${amount.toLocaleString()}`,
                });
            }
        } catch (err: any) {
            // IDEMPOTENCY SHIELD: P2002 = Unique constraint violation on [referenceId, type]
            // This means a duplicate CASH_OUT was attempted for the same session.
            // Expected noise in a concurrent system — resolve gracefully.
            if (err?.code === 'P2002') {
                this.logger.warn(
                    `[WARN] Idempotency shield blocked duplicate cashout for user ${userId} ` +
                    `on table ${tableId}. This is expected in concurrent scenarios.`
                );
                return; // Resolve silently — the first cashout already succeeded
            }
            this.logger.error(`settleCashOut FAILED for user ${userId}: ${err.message}`);
        }
    }

    // ════════════════════════════════════════════════════════
    // 🔵 BLUE CABLE: pushBalanceUpdate
    // Emits WALLET_BALANCE_UPDATED to the user's notification
    // room via Redis PubSub. Called after EVERY balance mutation.
    // Non-fatal: wallet operations succeed even if push fails.
    // ════════════════════════════════════════════════════════
    private async pushBalanceUpdate(
        userId: string,
        walletId: string,
        tx?: any,
        meta?: { delta: number; transactionType: TransactionType; message: string },
    ) {
        try {
            const db = tx || this.prisma;
            const wallet = await db.wallet.findUnique({ where: { id: walletId } });
            if (wallet) {
                const payload: WalletBalanceUpdatedPayload = {
                    type: 'WALLET_BALANCE_UPDATED',
                    userId,
                    newBalance: Number(wallet.realBalance),
                    delta: meta?.delta ?? 0,
                    transactionType: meta?.transactionType ?? TransactionType.BONUS,
                    message: meta?.message ?? 'Balance updated',
                };
                const walletEvent = {
                    target: 'USER',
                    userId,
                    payload,
                };
                await this.redis.getClient().publish(
                    `user_alerts:${userId}`,
                    JSON.stringify(walletEvent)
                );
                this.logger.log(`💰 WALLET_BALANCE_UPDATED → user ${userId}: $${Number(wallet.realBalance)} (${meta?.transactionType ?? 'UNKNOWN'}: ${meta?.message ?? ''})`);
            }
        } catch (err: any) {
            this.logger.error(`Failed to push WALLET_BALANCE_UPDATED: ${err.message}`);
        }
    }

    private async getWalletOrThrow(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return wallet;
    }
}
