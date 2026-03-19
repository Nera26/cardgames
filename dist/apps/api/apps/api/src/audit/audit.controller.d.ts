import { AuditService } from './audit.service';
import { GetAuditLogsQueryDto } from '@poker/shared';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(query: GetAuditLogsQueryDto): Promise<{
        data: ({
            user: {
                username: string;
                email: string;
            };
        } & {
            id: string;
            userId: string;
            action: string;
            payload: import(".prisma/client").Prisma.JsonValue;
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
