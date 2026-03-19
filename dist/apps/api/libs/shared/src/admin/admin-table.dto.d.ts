import { z } from 'zod';
export interface AdminTableDto {
    id: string;
    name: string;
    stakes: string;
    players: string;
    status: 'ACTIVE' | 'FULL' | 'INACTIVE' | 'PAUSED';
    revenue: number;
}
export declare const AdminTableActionSchema: z.ZodObject<{
    action: z.ZodEnum<{
        OPEN: "OPEN";
        CLOSE: "CLOSE";
        PAUSE: "PAUSE";
    }>;
}, z.core.$strip>;
export type AdminTableActionDto = z.infer<typeof AdminTableActionSchema>;
export type TableSeverity = 'HEALTHY' | 'WARNING' | 'CRITICAL';
export interface GodModeTableDto {
    id: string;
    name: string;
    variant: string;
    variantDisplay: string;
    stakes: string;
    isPrivate: boolean;
    status: 'RUNNING' | 'PAUSED' | 'ERROR' | 'WAITING';
    phase: string;
    handsPerHour: number;
    avgPot: number;
    totalHands: number;
    activePlayers: number;
    maxSeats: number;
    occupancyDisplay: string;
    totalRake: number;
    rakePercent: number;
    rakeCap: number;
    securityAlert: boolean;
    alertReason?: string;
    severity: TableSeverity;
    createdAt: string;
    uptime: string;
}
export interface GodModeDashboardResponse {
    tables: GodModeTableDto[];
    summary: {
        totalTables: number;
        runningTables: number;
        totalPlayers: number;
        totalRake: number;
        alertCount: number;
    };
}
export declare const UpdateTableConfigSchema: z.ZodObject<{
    password: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    rakePercent: z.ZodOptional<z.ZodNumber>;
    rakeCap: z.ZodOptional<z.ZodNumber>;
    turnTime: z.ZodOptional<z.ZodNumber>;
    timeBank: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        PAUSED: "PAUSED";
        RUNNING: "RUNNING";
    }>>;
}, z.core.$strip>;
export type UpdateTableConfigDto = z.infer<typeof UpdateTableConfigSchema>;
export interface TableConfigDetails {
    id: string;
    name: string;
    variant: string;
    smallBlind: number;
    bigBlind: number;
    minBuyIn: number;
    maxBuyIn: number;
    maxSeats: number;
    ante: number;
    password: string | null;
    rakePercent: number;
    rakeCap: number;
    turnTime: number;
    timeBank: number;
    status: string;
    isActive: boolean;
    createdAt: string;
}
