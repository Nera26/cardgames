import { z } from 'zod';
export declare enum AuditAction {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    WALLET_DEPOSIT = "WALLET_DEPOSIT",
    WALLET_WITHDRAW = "WALLET_WITHDRAW",
    WALLET_TRANSFER = "WALLET_TRANSFER",
    WALLET_ADJUSTMENT = "WALLET_ADJUSTMENT",
    SETTINGS_CHANGE = "SETTINGS_CHANGE",
    HAND_ARCHIVED = "HAND_ARCHIVED",
    PLAYER_TIMEOUT = "PLAYER_TIMEOUT",
    PLAYER_KICKED = "PLAYER_KICKED",
    PLAYER_DISCONNECT = "PLAYER_DISCONNECT"
}
export declare const CreateAuditLogSchema: z.ZodObject<{
    userId: z.ZodUnion<[z.ZodString, z.ZodString]>;
    action: z.ZodEnum<typeof AuditAction>;
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    ipAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;
export declare const GetAuditLogsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    userId: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodEnum<typeof AuditAction>>;
}, z.core.$strip>;
export type GetAuditLogsQueryDto = z.infer<typeof GetAuditLogsQuerySchema>;
