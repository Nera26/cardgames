import { NotificationService } from './notification.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { NotificationType, CreateNotificationDto } from '@poker/shared';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getMyNotifications(req: AuthenticatedRequest, limitGlobal?: number, limitPersonal?: number): Promise<{
        id: string;
        userId: string | null;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        metadata: import(".prisma/client").Prisma.JsonValue | null;
        createdAt: Date;
    }[]>;
    markAsRead(req: AuthenticatedRequest, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(req: AuthenticatedRequest): Promise<import(".prisma/client").Prisma.BatchPayload>;
    broadcast(dto: CreateNotificationDto): Promise<{
        id: string;
        type: NotificationType;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
        userId?: string;
        metadata?: any;
    }>;
    debugTournament(): Promise<{
        id: string;
        type: NotificationType;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
        userId?: string;
        metadata?: any;
    }>;
    debugPersonal(userId: string): Promise<{
        id: string;
        type: NotificationType;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
        userId?: string;
        metadata?: any;
    }>;
}
