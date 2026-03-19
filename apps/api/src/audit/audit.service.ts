import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto, CreateAuditLogSchema } from '@poker/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
    // SECURITY NOTE: This is an "Iron Vault" (Append-Only) service.
    // DO NOT ADD ANY METHODS TO UPDATE OR DELETE AUDIT LOGS.
    // All logs must be immutable for security compliance.

    private readonly logger = new Logger(AuditService.name);

    constructor(private prisma: PrismaService) { }

    async record(data: CreateAuditLogDto, tx?: Prisma.TransactionClient) {
        // Validate payload against schema (Strict validation)
        const validationResult = CreateAuditLogSchema.safeParse(data);

        if (!validationResult.success) {
            this.logger.error(`Audit Log Validation Failed: ${JSON.stringify(validationResult.error.format())}`);
            // We don't throw to prevent crashing the main flow, but we log the error.
            // Alternatively, for a security vault, maybe we SHOULD throw?
            // The prompt says "Ensure it validates the action...". 
            // Let's throw if invalid to be strict as requested ("Strict Enum of events").
            throw new Error(`Audit Log Validation Failed: ${validationResult.error.message}`);
        }

        const validData = validationResult.data;

        // Use provided transaction client or default prisma service
        const client = tx || this.prisma;

        try {
            await (client as any).auditLog.create({
                data: {
                    userId: validData.userId,
                    action: validData.action,
                    payload: validData.payload ?? {},
                    ipAddress: validData.ipAddress,
                },
            });
            // this.logger.log(`Audit Log Created: ${validData.action} for User ${validData.userId}`);
        } catch (error) {
            this.logger.error(`Failed to create audit log`, error);
            // Decide if we should throw. If audit fails, should the transaction fail?
            // "Security layer". Yes, if audit fails, action should probably fail.
            throw error;
        }
    }

    async findAll(query: { page: number; limit: number; userId?: string; action?: string }) {
        const { page, limit, userId, action } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AuditLogWhereInput = {
            ...(userId && { userId }),
            ...(action && { action }),
        };

        const [total, logs] = await Promise.all([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            username: true,
                            email: true,
                        }
                    }
                }
            }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
}
