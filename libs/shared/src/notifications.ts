import { z } from 'zod';

export enum NotificationType {
    SYSTEM = 'SYSTEM',       // "Server Restarting"
    TOURNAMENT = 'TOURNAMENT', // "Tournament starting"
    PERSONAL = 'PERSONAL',   // "You won $500"
    BONUS = 'BONUS',         // "Deposit Bonus Active"
    ACHIEVEMENT = 'ACHIEVEMENT', // "Hand 1000 Played"
    ANNOUNCEMENT = 'ANNOUNCEMENT', // Keep legacy for compatibility during refactor
    ALERT = 'ALERT'               // Keep legacy for compatibility during refactor
}

export interface NotificationPayload {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>; // For deep links (e.g., { tableId: '123' })
    createdAt: Date;
    isRead: boolean;
    userId?: string | null;
}

// The Shape of the Redis PubSub Message
export interface GlobalAlertEvent {
    target: 'ALL' | 'USER';
    userId?: string;
    payload: NotificationPayload;
}

export const notificationSchema = z.object({
    id: z.string(),
    userId: z.string().nullable(),
    type: z.nativeEnum(NotificationType),
    title: z.string(),
    message: z.string(),
    isRead: z.boolean(),
    metadata: z.any().optional(),
    createdAt: z.date(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationSchema = z.object({
    userId: z.string().optional(),
    type: z.nativeEnum(NotificationType),
    title: z.string(),
    message: z.string(),
    metadata: z.any().optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
