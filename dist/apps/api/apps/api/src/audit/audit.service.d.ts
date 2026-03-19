import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from '@poker/shared';
import { Prisma } from '@prisma/client';
export declare class AuditService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    record(data: CreateAuditLogDto, tx?: Prisma.TransactionClient): Promise<void>;
    findAll(query: {
        page: number;
        limit: number;
        userId?: string;
        action?: string;
    }): Promise<{
        data: ({
            user: {
                username: string;
                email: string;
            };
        } & {
            id: string;
            userId: string;
            action: string;
            payload: Prisma.JsonValue;
            ipAddress: string | null;
            createdAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
