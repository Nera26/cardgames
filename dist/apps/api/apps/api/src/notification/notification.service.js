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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../common/redis.service");
const shared_1 = require("@poker/shared");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma, redisSerivce) {
        this.prisma = prisma;
        this.redisSerivce = redisSerivce;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendGlobal(title, message, type = shared_1.NotificationType.SYSTEM, metadata) {
        this.logger.log(`Sending global notification: ${title}`);
        const notification = await this.prisma.notification.create({
            data: {
                userId: null,
                type,
                title,
                message,
                metadata: metadata || {},
            },
        });
        const event = {
            target: 'ALL',
            payload: notification,
        };
        await this.redisSerivce.getClient().publish('global_alerts', JSON.stringify(event));
        return notification;
    }
    async sendPersonal(userId, title, message, type = shared_1.NotificationType.PERSONAL, metadata) {
        this.logger.log(`Sending personal notification to ${userId}: ${title}`);
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata: metadata || {},
            },
        });
        const event = {
            target: 'USER',
            userId,
            payload: notification,
        };
        await this.redisSerivce.getClient().publish(`user_alerts:${userId}`, JSON.stringify(event));
        return notification;
    }
    async getNotifications(userId, limitGlobal = 10, limitPersonal = 40) {
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
    async markAsRead(notificationId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map