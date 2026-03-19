/**
 * Table Management DTOs (Blue Cable)
 * 
 * Zod schemas for creating and listing poker tables.
 * Shared between Admin CMS and Lobby UI.
 * 
 * @see ARCHITECTURE.md Section 2.2 - The Blue Cable
 */

import { z } from 'zod';

// ============================================================
// Game Variant Enum
// ============================================================

export const GameVariantEnum = z.enum(['TEXAS_HOLDEM', 'OMAHA', 'ALL_IN_OR_FOLD']);
export type GameVariant = z.infer<typeof GameVariantEnum>;

// Display names for UI
export const GameVariantDisplayNames: Record<GameVariant, string> = {
    TEXAS_HOLDEM: "Texas Hold'em",
    OMAHA: 'Omaha',
    ALL_IN_OR_FOLD: 'All-in or Fold',
};

// ============================================================
// Turn Time Enum (Game Pace)
// ============================================================

export const TurnTimeEnum = z.enum(['15', '30', '60']);
export type TurnTime = z.infer<typeof TurnTimeEnum>;

export const TurnTimeDisplayNames: Record<string, string> = {
    '15': 'Turbo (15s)',
    '30': 'Regular (30s)',
    '60': 'Slow (60s)',
};

// ============================================================
// Betting Limit Enum (Omaha Protocol)
// ============================================================

export const BettingLimitEnum = z.enum(['NO_LIMIT', 'POT_LIMIT', 'FIXED_LIMIT']);
export type BettingLimit = z.infer<typeof BettingLimitEnum>;

export const BettingLimitDisplayNames: Record<BettingLimit, string> = {
    NO_LIMIT: 'No Limit',
    POT_LIMIT: 'Pot Limit',
    FIXED_LIMIT: 'Fixed Limit',
};

// ============================================================
// Create Table Schema (Admin -> API)
// ============================================================

export const CreateTableSchema = z.object({
    // Basic Info
    name: z.string()
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Name must be at most 50 characters'),
    variant: GameVariantEnum,
    maxSeats: z.coerce.number().refine(
        (val) => [4, 6, 9].includes(val),
        { message: 'Seats must be 4, 6, or 9' }
    ),

    // Blinds & Stakes
    smallBlind: z.coerce.number().positive('Small blind must be positive'),
    bigBlind: z.coerce.number().positive('Big blind must be positive'),
    minBuyIn: z.coerce.number().positive('Min buy-in must be positive'),
    maxBuyIn: z.coerce.number().positive('Max buy-in must be positive'),

    // Pro-Tier: Advanced Settings
    ante: z.coerce.number().nonnegative('Ante must be non-negative').default(0),
    turnTime: z.coerce.number().refine(
        (val) => [15, 30, 60].includes(val),
        { message: 'Turn time must be 15, 30, or 60 seconds' }
    ).default(30),
    timeBank: z.coerce.number().nonnegative().default(60),
    isStraddleAllowed: z.boolean().default(false),
    password: z.string().optional().nullable(),

    // Pro-Tier: Rake (Yellow Cable)
    rakePercent: z.coerce.number()
        .min(0, 'Rake must be at least 0%')
        .max(10, 'Rake cannot exceed 10%')
        .default(0),
    rakeCap: z.coerce.number().nonnegative('Rake cap must be non-negative').default(0),

    // Omaha Protocol
    holeCardsCount: z.coerce.number().refine(
        (val) => [2, 4, 5, 6].includes(val),
        { message: 'Hole cards must be 2 (Texas) or 4, 5, 6 (Omaha)' }
    ).default(2),
    bettingLimit: BettingLimitEnum.default('NO_LIMIT'),


}).refine(
    (data) => data.bigBlind >= data.smallBlind,
    { message: 'Big blind must be >= small blind', path: ['bigBlind'] }
).refine(
    (data) => data.maxBuyIn >= data.minBuyIn,
    { message: 'Max buy-in must be >= min buy-in', path: ['maxBuyIn'] }
).refine(
    (data) => data.minBuyIn >= data.bigBlind * 20,
    { message: 'Min buy-in must be at least 20 big blinds', path: ['minBuyIn'] }
);

export type CreateTableDto = z.infer<typeof CreateTableSchema>;

// ============================================================
// Lobby Table Schema (API -> Lobby)
// ============================================================

export const LobbyTableSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    variant: GameVariantEnum,
    stakes: z.string(), // "$1/$2"
    players: z.number(), // Current player count
    maxSeats: z.number(),
    minBuyIn: z.number(),
    maxBuyIn: z.number(),
    holeCardsCount: z.number().optional(), // 4, 5, or 6 for Omaha variants
    isActive: z.boolean(),
    status: z.string(),
    isPrivate: z.boolean(), // True if table has password
    rakePercent: z.number().optional(), // Rake percentage for display
    handsPerHour: z.number().optional(), // Live stat from Redis hand counter
    avgPot: z.string().optional(), // Live stat from Redis pot tracker
});

export type LobbyTableDto = z.infer<typeof LobbyTableSchema>;

// ============================================================
// Table Filters Schema (For GET /tables query params)
// ============================================================

export const TableFiltersSchema = z.object({
    variant: GameVariantEnum.optional(),
    isActive: z.coerce.boolean().optional(),
});

export type TableFiltersDto = z.infer<typeof TableFiltersSchema>;
