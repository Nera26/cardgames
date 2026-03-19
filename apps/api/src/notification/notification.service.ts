import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { NotificationType, Notification, GlobalAlertEvent } from '@poker/shared';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisSerivce: RedisService,
    ) { }

    async sendGlobal(title: string, message: string, type: NotificationType = NotificationType.SYSTEM, metadata?: any) {
        this.logger.log(`Sending global notification: ${title}`);

        // 1. Save to DB
        const notification = await this.prisma.notification.create({
            data: {
                userId: null,
                type,
                title,
                message,
                metadata: metadata || {},
            },
        }) as unknown as Notification;

        // 2. Publish to Redis using GlobalAlertEvent interface
        const event: GlobalAlertEvent = {
            target: 'ALL',
            payload: notification as any, // Cast to any to handle Date object vs string in JSON if needed
        };

        await this.redisSerivce.getClient().publish('global_alerts', JSON.stringify(event));

        return notification;
    }

    async sendPersonal(userId: string, title: string, message: string, type: NotificationType = NotificationType.PERSONAL, metadata?: any) {
        this.logger.log(`Sending personal notification to ${userId}: ${title}`);

        // 1. Save to DB
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata: metadata || {},
            },
        }) as unknown as Notification;

        // 2. Publish to Redis using GlobalAlertEvent interface
        const event: GlobalAlertEvent = {
            target: 'USER',
            userId,
            payload: notification as any,
        };

        await this.redisSerivce.getClient().publish(`user_alerts:${userId}`, JSON.stringify(event));

        return notification;
    }

    async getNotifications(userId: string, limitGlobal = 10, limitPersonal = 40) {
        const [global, personal] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId: null },
                orderBy: { createdAt: 'desc' },
                take: limitGlobal,
            }),
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limitPersonal,
            }),
        ]);

        return [...global, ...personal].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async markAsRead(notificationId: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
}
