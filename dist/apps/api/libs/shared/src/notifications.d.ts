import { z } from 'zod';
export declare enum NotificationType {
    SYSTEM = "SYSTEM",
    TOURNAMENT = "TOURNAMENT",
    PERSONAL = "PERSONAL",
    BONUS = "BONUS",
    ACHIEVEMENT = "ACHIEVEMENT",
    ANNOUNCEMENT = "ANNOUNCEMENT",
    ALERT = "ALERT"
}
export interface NotificationPayload {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    isRead: boolean;
    userId?: string | null;
}
export interface GlobalAlertEvent {
    target: 'ALL' | 'USER';
    userId?: string;
    payload: NotificationPayload;
}
export declare const notificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodNullable<z.ZodString>;
    type: z.ZodEnum<typeof NotificationType>;
    title: z.ZodString;
    message: z.ZodString;
    isRead: z.ZodBoolean;
    metadata: z.ZodOptional<z.ZodAny>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type Notification = z.infer<typeof notificationSchema>;
export declare const createNotificationSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<typeof NotificationType>;
    title: z.ZodString;
    message: z.ZodString;
    metadata: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;
export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
