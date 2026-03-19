import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { NotificationType } from '@poker/shared';
export declare class NotificationService {
    private readonly prisma;
    private readonly redisSerivce;
    private readonly logger;
    constructor(prisma: PrismaService, redisSerivce: RedisService);
    sendGlobal(title: string, message: string, type?: NotificationType, metadata?: any): Promise<{
        id: string;
        type: NotificationType;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
        userId?: string;
        metadata?: any;
    }>;
    sendPersonal(userId: string, title: string, message: string, type?: NotificationType, metadata?: any): Promise<{
        id: string;
        type: NotificationType;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
        userId?: string;
        metadata?: any;
    }>;
    getNotifications(userId: string, limitGlobal?: number, limitPersonal?: number): Promise<{
        id: string;
        userId: string | null;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        metadata: import(".prisma/client").Prisma.JsonValue | null;
        createdAt: Date;
    }[]>;
    markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
