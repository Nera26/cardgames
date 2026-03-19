import { z } from 'zod';

export enum AuditAction {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    WALLET_DEPOSIT = 'WALLET_DEPOSIT',
    WALLET_WITHDRAW = 'WALLET_WITHDRAW',
    WALLET_TRANSFER = 'WALLET_TRANSFER', // For future use or if needed
    WALLET_ADJUSTMENT = 'WALLET_ADJUSTMENT', // Admin adjustment
    SETTINGS_CHANGE = 'SETTINGS_CHANGE',
    HAND_ARCHIVED = 'HAND_ARCHIVED',
    // Yellow Cable: Game Engine events (§18 Agent Protocol)
    PLAYER_TIMEOUT = 'PLAYER_TIMEOUT',
    PLAYER_KICKED = 'PLAYER_KICKED',
    PLAYER_DISCONNECT = 'PLAYER_DISCONNECT',
    // Yellow Cable: Financial Reconciliation
    RECONCILIATION_REFUND = 'RECONCILIATION_REFUND',
    OVERPAYMENT_REVERSAL = 'OVERPAYMENT_REVERSAL',
}

export const CreateAuditLogSchema = z.object({
    userId: z.string().uuid().or(z.string().cuid()), // Support both for now as User ID is CUID but we might use UUIDs elsewhere
    action: z.nativeEnum(AuditAction),
    payload: z.record(z.string(), z.any()), // JSON payload
    ipAddress: z.string().nullable().optional(),
});

export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;

// --- ADMIN DTOs ---

export const GetAuditLogsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    userId: z.string().optional(),
    action: z.nativeEnum(AuditAction).optional(),
});

export type GetAuditLogsQueryDto = z.infer<typeof GetAuditLogsQuerySchema>;
