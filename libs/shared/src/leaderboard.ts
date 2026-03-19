import { z } from 'zod';

// ==================== ENUMS (Mirror Prisma) ====================

export const LeaderboardTimeframe = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
} as const;
export type LeaderboardTimeframe = (typeof LeaderboardTimeframe)[keyof typeof LeaderboardTimeframe];

export const GameMode = {
    CASH: 'CASH',
    TOURNAMENT: 'TOURNAMENT',
} as const;
export type GameMode = (typeof GameMode)[keyof typeof GameMode];

// ==================== QUERY DTO ====================
// Validates GET /leaderboard?timeframe=DAILY&gameMode=CASH&page=1&limit=20

export const leaderboardQuerySchema = z.object({
    timeframe: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
    gameMode: z.enum(['CASH', 'TOURNAMENT']).default('CASH'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

export type LeaderboardQueryDto = z.infer<typeof leaderboardQuerySchema>;

// ==================== PLAYER RESPONSE DTO ====================
// A single row on the leaderboard table (includes joined User data + derived rank)

export const leaderboardPlayerSchema = z.object({
    rank: z.number(),                        // Positional rank (1-indexed, offset-aware)
    userId: z.string(),
    username: z.string(),
    avatarUrl: z.string().nullable(),
    avatarId: z.string(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']),

    // Aggregated stats from LeaderboardStat
    totalWinnings: z.number(),               // Decimal → number
    gamesPlayed: z.number(),
    gamesWon: z.number(),
    winRate: z.number(),                     // Pre-computed % (e.g. 68.5)

    // Timeframe context
    timeframe: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    gameMode: z.enum(['CASH', 'TOURNAMENT']),
});

export type LeaderboardPlayerDto = z.infer<typeof leaderboardPlayerSchema>;

// ==================== LEADERBOARD RESPONSE DTO ====================
// Paginated response wrapper

export const leaderboardResponseSchema = z.object({
    players: z.array(leaderboardPlayerSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    timeframe: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    gameMode: z.enum(['CASH', 'TOURNAMENT']),
});

export type LeaderboardResponseDto = z.infer<typeof leaderboardResponseSchema>;
