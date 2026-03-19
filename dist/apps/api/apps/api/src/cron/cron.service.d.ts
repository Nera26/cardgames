import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { Prisma } from '@prisma/client';
export declare class CronService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    runAudit(): Promise<{
        id: string;
        timestamp: Date;
        totalWalletBalance: Prisma.Decimal;
        totalChipsInPlay: Prisma.Decimal;
        expectedBalance: Prisma.Decimal;
        systemDiscrepancy: Prisma.Decimal;
        status: string;
        details: Prisma.JsonValue | null;
    }>;
    getSystemTotals(): Promise<{
        totalWalletBalance: number;
        expectedBalance: number;
        totalChipsInPlay: number;
        tableCount: number;
        walletDetail: {
            real: number;
            bonus: number;
        };
    }>;
    private sumChipsFromRedis;
}
