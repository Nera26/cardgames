/**
 * Tournament Ecosystem DTOs (Phase 7 - Blue Cable)
 *
 * Zod validation schemas and TypeScript interfaces for
 * Tournament CRUD, Lobby display, and Player Registration.
 *
 * @see ARCHITECTURE.md Phase 7 - Tournament Ecosystem
 */

import { z } from 'zod';

// ============================================================
// Tournament Enums (mirrored from Prisma for shared usage)
// ============================================================

export const TournamentStatusEnum = z.enum([
    'ANNOUNCED',
    'REGISTERING',
    'LATE_REG',
    'RUNNING',
    'ON_BREAK',
    'PAUSED',
    'FINISHED',
    'CANCELLED',
]);
export type TournamentStatus = z.infer<typeof TournamentStatusEnum>;

export const TournamentGameTypeEnum = z.enum([
    'TEXAS_HOLDEM',
    'POT_LIMIT_OMAHA',
    'OMAHA_HI_LO',
    'SHORT_DECK',
]);
export type TournamentGameType = z.infer<typeof TournamentGameTypeEnum>;

export const TournamentGameTypeDisplayNames: Record<TournamentGameType, string> = {
    TEXAS_HOLDEM: "Texas Hold'em",
    POT_LIMIT_OMAHA: 'Pot Limit Omaha',
    OMAHA_HI_LO: 'Omaha Hi-Lo',
    SHORT_DECK: 'Short Deck',
};

export const TournamentEntryFormatEnum = z.enum([
    'REGULAR',
    'FREEROLL',
    'FREEZEOUT',
    'RE_ENTRY',
    'PROGRESSIVE_KO',
    'BOUNTY',
]);
export type TournamentEntryFormat = z.infer<typeof TournamentEntryFormatEnum>;

export const TournamentEntryFormatDisplayNames: Record<TournamentEntryFormat, string> = {
    REGULAR: 'Regular',
    FREEROLL: 'Freeroll',
    FREEZEOUT: 'Freezeout',
    RE_ENTRY: 'Re-entry',
    PROGRESSIVE_KO: 'Progressive KO',
    BOUNTY: 'Bounty',
};

export const BlindStructureSpeedEnum = z.enum([
    'REGULAR',
    'TURBO',
    'HYPER_TURBO',
    'DEEP_STACK',
]);
export type BlindStructureSpeed = z.infer<typeof BlindStructureSpeedEnum>;

export const BlindStructureSpeedDisplayNames: Record<BlindStructureSpeed, string> = {
    REGULAR: 'Regular (15 min)',
    TURBO: 'Turbo (8 min)',
    HYPER_TURBO: 'Hyper Turbo (3 min)',
    DEEP_STACK: 'Deep Stack (20 min)',
};

export const LateRegistrationWindowEnum = z.enum([
    'DISABLED',
    'THIRTY_MINUTES',
    'SIXTY_MINUTES',
    'NINETY_MINUTES',
    'UNTIL_FIRST_BREAK',
]);
export type LateRegistrationWindow = z.infer<typeof LateRegistrationWindowEnum>;

export const PayoutStructureEnum = z.enum([
    'WINNER_TAKES_ALL',
    'TOP_3',
    'TOP_10_PERCENT',
    'TOP_15_PERCENT',
    'TOP_20_PERCENT',
    'CUSTOM',
]);
export type PayoutStructure = z.infer<typeof PayoutStructureEnum>;

// ============================================================
// Create Tournament DTO (Admin → API)
// ============================================================

export const createTournamentSchema = z.object({
    // Basic Info
    name: z.string()
        .min(3, 'Tournament name must be at least 3 characters')
        .max(100, 'Tournament name must be at most 100 characters'),
    description: z.string().max(500).optional().nullable(),
    password: z.string().max(50).optional().nullable(),

    // Game Rules
    gameType: TournamentGameTypeEnum.default('TEXAS_HOLDEM'),
    entryFormat: TournamentEntryFormatEnum.default('REGULAR'),

    // Financial Config
    buyIn: z.coerce.number().nonnegative('Buy-in must be non-negative').default(0),
    fee: z.coerce.number().nonnegative('Fee must be non-negative').default(0),
    guaranteedPrizePool: z.coerce.number().nonnegative('GTD must be non-negative').default(0),
    bountyAmount: z.coerce.number().positive().optional().nullable(),

    // Structure
    startingChips: z.coerce.number().int().positive('Starting chips must be positive').default(10000),
    blindStructure: BlindStructureSpeedEnum.default('REGULAR'),
    seatCap: z.coerce.number().int().positive().optional().nullable(),
    minPlayersToStart: z.coerce.number().int().min(2, 'Minimum 2 players required').default(2),
    payoutStructure: PayoutStructureEnum.default('TOP_15_PERCENT'),

    // Schedule
    startTime: z.coerce.date(),
    lateRegistration: LateRegistrationWindowEnum.default('SIXTY_MINUTES'),
    autoStart: z.boolean().default(true),

    // Rebuy & Add-on Config
    rebuyEnabled: z.boolean().default(false),
    rebuyCost: z.coerce.number().positive().optional().nullable(),
    rebuyChips: z.coerce.number().int().positive().optional().nullable(),
    addonEnabled: z.boolean().default(false),
    addonCost: z.coerce.number().positive().optional().nullable(),
    addonChips: z.coerce.number().int().positive().optional().nullable(),

    // Re-entry Config
    maxReEntries: z.coerce.number().int().positive().optional().nullable(),
    reEntryWindow: z.string().max(50).optional().nullable(),
}).refine(
    (data) => {
        // Freeroll must have 0 buy-in
        if (data.entryFormat === 'FREEROLL' && data.buyIn > 0) return false;
        return true;
    },
    { message: 'Freeroll tournaments must have a buy-in of 0', path: ['buyIn'] }
).refine(
    (data) => {
        // RE_ENTRY format should have maxReEntries defined
        if (data.entryFormat === 'RE_ENTRY' && (!data.maxReEntries || data.maxReEntries < 1)) return false;
        return true;
    },
    { message: 'Re-entry format requires maxReEntries to be a positive number', path: ['maxReEntries'] }
).refine(
    (data) => {
        // KO/Bounty formats require bountyAmount
        if ((data.entryFormat === 'PROGRESSIVE_KO' || data.entryFormat === 'BOUNTY') && !data.bountyAmount) return false;
        return true;
    },
    { message: 'KO/Bounty formats require a bounty amount', path: ['bountyAmount'] }
).refine(
    (data) => {
        // Rebuy enabled requires cost + chips
        if (data.rebuyEnabled && (!data.rebuyCost || !data.rebuyChips)) return false;
        return true;
    },
    { message: 'Rebuy requires both cost and chip amount', path: ['rebuyCost'] }
).refine(
    (data) => {
        // Add-on enabled requires cost + chips
        if (data.addonEnabled && (!data.addonCost || !data.addonChips)) return false;
        return true;
    },
    { message: 'Add-on requires both cost and chip amount', path: ['addonCost'] }
);

export type CreateTournamentDto = z.infer<typeof createTournamentSchema>;

// ============================================================
// Update Tournament DTO (Admin → API, partial)
// ============================================================

// Build a base schema without the refinements for partial updates
const baseCreateFields = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    password: z.string().max(50).optional().nullable(),
    gameType: TournamentGameTypeEnum.optional(),
    entryFormat: TournamentEntryFormatEnum.optional(),
    buyIn: z.coerce.number().nonnegative().optional(),
    fee: z.coerce.number().nonnegative().optional(),
    guaranteedPrizePool: z.coerce.number().nonnegative().optional(),
    bountyAmount: z.coerce.number().positive().optional().nullable(),
    startingChips: z.coerce.number().int().positive().optional(),
    blindStructure: BlindStructureSpeedEnum.optional(),
    seatCap: z.coerce.number().int().positive().optional().nullable(),
    minPlayersToStart: z.coerce.number().int().min(2).optional(),
    payoutStructure: PayoutStructureEnum.optional(),
    startTime: z.coerce.date().optional(),
    lateRegistration: LateRegistrationWindowEnum.optional(),
    autoStart: z.boolean().optional(),
    rebuyEnabled: z.boolean().optional(),
    rebuyCost: z.coerce.number().positive().optional().nullable(),
    rebuyChips: z.coerce.number().int().positive().optional().nullable(),
    addonEnabled: z.boolean().optional(),
    addonCost: z.coerce.number().positive().optional().nullable(),
    addonChips: z.coerce.number().int().positive().optional().nullable(),
    maxReEntries: z.coerce.number().int().positive().optional().nullable(),
    reEntryWindow: z.string().max(50).optional().nullable(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
);

export const updateTournamentSchema = baseCreateFields;

export type UpdateTournamentDto = z.infer<typeof updateTournamentSchema>;

// ============================================================
// Tournament Response DTO (API → Lobby)
// ============================================================

export interface TournamentResponseDto {
    id: string;
    name: string;
    description: string | null;
    gameType: TournamentGameType;
    entryFormat: TournamentEntryFormat;
    buyIn: number;
    fee: number;
    guaranteedPrizePool: number;
    actualPrizePool: number;
    bountyAmount: number | null;
    startingChips: number;
    blindStructure: BlindStructureSpeed;
    seatCap: number | null;
    minPlayersToStart: number;
    payoutStructure: PayoutStructure;
    startTime: string; // ISO date string
    lateRegistration: LateRegistrationWindow;
    autoStart: boolean;
    rebuyEnabled: boolean;
    addonEnabled: boolean;
    status: TournamentStatus;
    totalEntries: number;
    playersRemaining: number;
    currentBlindLevel: number;
    tablesActive: number;
    isPrivate: boolean; // Derived from !!password — never expose the actual password
    createdAt: string;
}

// ============================================================
// Tournament List Query DTO (Lobby filters)
// ============================================================

export const tournamentListQuerySchema = z.object({
    status: TournamentStatusEnum.optional(),
    gameType: TournamentGameTypeEnum.optional(),
    entryFormat: TournamentEntryFormatEnum.optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type TournamentListQueryDto = z.infer<typeof tournamentListQuerySchema>;

// ============================================================
// Register Tournament DTO (Player → API)
// ============================================================

export const registerTournamentSchema = z.object({
    tournamentId: z.string().min(1, 'Tournament ID is required'),
});

export type RegisterTournamentDto = z.infer<typeof registerTournamentSchema>;

// ============================================================
// Tournament Entry Response DTO
// ============================================================

export interface TournamentEntryResponseDto {
    id: string;
    tournamentId: string;
    userId: string;
    isActive: boolean;
    rebuysUsed: number;
    addonsUsed: number;
    reEntriesUsed: number;
    finishPosition: number | null;
    prizeWon: number | null;
    createdAt: string;
}
