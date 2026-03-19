import { z } from 'zod';

// ============================================================
// Standard Admin Table DTO (Existing)
// ============================================================

export interface AdminTableDto {
    id: string;
    name: string;
    stakes: string; // e.g. '$1/$2'
    players: string; // e.g. '5/9'
    status: 'ACTIVE' | 'FULL' | 'INACTIVE' | 'PAUSED';
    revenue: number; // today's revenue
}

export const AdminTableActionSchema = z.object({
    action: z.enum(['OPEN', 'CLOSE', 'PAUSE']),
});

export type AdminTableActionDto = z.infer<typeof AdminTableActionSchema>;

// ============================================================
// God Mode Dashboard DTO (Command Center)
// ============================================================

export type TableSeverity = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface GodModeTableDto {
    // Identity
    id: string;
    name: string;
    variant: string;         // e.g. 'TEXAS_HOLDEM', 'OMAHA'
    variantDisplay: string;  // e.g. 'Texas Hold'em', 'PLO-4'
    stakes: string;          // e.g. '$1/$2'
    isPrivate: boolean;      // True if table has password

    // Status
    status: 'RUNNING' | 'PAUSED' | 'ERROR' | 'WAITING';
    phase: string;           // Current game phase (waiting, preflop, showdown, etc.)

    // Vitals (Red Cable Telemetry)
    handsPerHour: number;    // Throughput metric
    avgPot: number;          // Average pot from recent hands
    totalHands: number;      // Total hands played on this table

    // Occupancy
    activePlayers: number;
    maxSeats: number;
    occupancyDisplay: string; // e.g. '5/9'

    // Financials (Yellow Cable)
    totalRake: number;       // Session total rake collected
    rakePercent: number;     // Configured rake %
    rakeCap: number;         // Configured rake cap

    // Security (Operator Alert)
    securityAlert: boolean;  // True if suspicious IP duplicates detected
    alertReason?: string;    // e.g. 'Duplicate IP: 192.168.1.1'

    // Severity Score (Computed)
    severity: TableSeverity;

    // Metadata
    createdAt: string;
    uptime: string;          // e.g. '2h 45m'
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

// ============================================================
// Table Config Update DTO (Hot Edit - Safe Fields Only)
// ============================================================

/**
 * UpdateTableConfigDto - Safe fields only for running tables
 * 
 * FORBIDDEN (Immutable on running tables):
 * - smallBlind, bigBlind (destroys stack math)
 * - minBuyIn, maxBuyIn (affects player expectations)
 * - maxSeats (physical constraint)
 * - variant (game type cannot change)
 * 
 * ALLOWED (Hot-editable):
 * - password (operational necessity)
 * - rakePercent, rakeCap (takes effect next hand)
 * - turnTime, timeBank (player comfort)
 * - status (PAUSED/RUNNING)
 */
export const UpdateTableConfigSchema = z.object({
    // Identity (read-only, not in update)
    // name - could be hot-edited but risky for tracking

    // Editable - Operational
    password: z.string().nullable().optional(),

    // Editable - Financials (takes effect next hand)
    rakePercent: z.number().min(0).max(10).optional(),
    rakeCap: z.number().min(0).optional(),

    // Editable - Time Controls
    turnTime: z.number().min(10).max(120).optional(),
    timeBank: z.number().min(0).max(300).optional(),

    // Editable - Status
    status: z.enum(['PAUSED', 'RUNNING']).optional(),
});

export type UpdateTableConfigDto = z.infer<typeof UpdateTableConfigSchema>;

// Full table config for display in drawer
export interface TableConfigDetails {
    // Identity
    id: string;
    name: string;
    variant: string;

    // Locked Fields (read-only on running tables)
    smallBlind: number;
    bigBlind: number;
    minBuyIn: number;
    maxBuyIn: number;
    maxSeats: number;
    ante: number;

    // Editable Fields
    password: string | null;
    rakePercent: number;
    rakeCap: number;
    turnTime: number;
    timeBank: number;

    // Status
    status: string;
    isActive: boolean;
    createdAt: string;
}

