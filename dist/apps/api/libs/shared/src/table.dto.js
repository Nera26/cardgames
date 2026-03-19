"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableFiltersSchema = exports.LobbyTableSchema = exports.CreateTableSchema = exports.BettingLimitDisplayNames = exports.BettingLimitEnum = exports.TurnTimeDisplayNames = exports.TurnTimeEnum = exports.GameVariantDisplayNames = exports.GameVariantEnum = void 0;
const zod_1 = require("zod");
exports.GameVariantEnum = zod_1.z.enum(['TEXAS_HOLDEM', 'OMAHA', 'ALL_IN_OR_FOLD']);
exports.GameVariantDisplayNames = {
    TEXAS_HOLDEM: "Texas Hold'em",
    OMAHA: 'Omaha',
    ALL_IN_OR_FOLD: 'All-in or Fold',
};
exports.TurnTimeEnum = zod_1.z.enum(['15', '30', '60']);
exports.TurnTimeDisplayNames = {
    '15': 'Turbo (15s)',
    '30': 'Regular (30s)',
    '60': 'Slow (60s)',
};
exports.BettingLimitEnum = zod_1.z.enum(['NO_LIMIT', 'POT_LIMIT', 'FIXED_LIMIT']);
exports.BettingLimitDisplayNames = {
    NO_LIMIT: 'No Limit',
    POT_LIMIT: 'Pot Limit',
    FIXED_LIMIT: 'Fixed Limit',
};
exports.CreateTableSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Name must be at most 50 characters'),
    variant: exports.GameVariantEnum,
    maxSeats: zod_1.z.coerce.number().refine((val) => [4, 6, 9].includes(val), { message: 'Seats must be 4, 6, or 9' }),
    smallBlind: zod_1.z.coerce.number().positive('Small blind must be positive'),
    bigBlind: zod_1.z.coerce.number().positive('Big blind must be positive'),
    minBuyIn: zod_1.z.coerce.number().positive('Min buy-in must be positive'),
    maxBuyIn: zod_1.z.coerce.number().positive('Max buy-in must be positive'),
    ante: zod_1.z.coerce.number().nonnegative('Ante must be non-negative').default(0),
    turnTime: zod_1.z.coerce.number().refine((val) => [15, 30, 60].includes(val), { message: 'Turn time must be 15, 30, or 60 seconds' }).default(30),
    timeBank: zod_1.z.coerce.number().nonnegative().default(60),
    isStraddleAllowed: zod_1.z.boolean().default(false),
    password: zod_1.z.string().optional().nullable(),
    rakePercent: zod_1.z.coerce.number()
        .min(0, 'Rake must be at least 0%')
        .max(10, 'Rake cannot exceed 10%')
        .default(0),
    rakeCap: zod_1.z.coerce.number().nonnegative('Rake cap must be non-negative').default(0),
    holeCardsCount: zod_1.z.coerce.number().refine((val) => [2, 4, 5, 6].includes(val), { message: 'Hole cards must be 2 (Texas) or 4, 5, 6 (Omaha)' }).default(2),
    bettingLimit: exports.BettingLimitEnum.default('NO_LIMIT'),
}).refine((data) => data.bigBlind >= data.smallBlind, { message: 'Big blind must be >= small blind', path: ['bigBlind'] }).refine((data) => data.maxBuyIn >= data.minBuyIn, { message: 'Max buy-in must be >= min buy-in', path: ['maxBuyIn'] }).refine((data) => data.minBuyIn >= data.bigBlind * 20, { message: 'Min buy-in must be at least 20 big blinds', path: ['minBuyIn'] });
exports.LobbyTableSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    variant: exports.GameVariantEnum,
    stakes: zod_1.z.string(),
    players: zod_1.z.number(),
    maxSeats: zod_1.z.number(),
    minBuyIn: zod_1.z.number(),
    maxBuyIn: zod_1.z.number(),
    holeCardsCount: zod_1.z.number().optional(),
    isActive: zod_1.z.boolean(),
    status: zod_1.z.string(),
    isPrivate: zod_1.z.boolean(),
    rakePercent: zod_1.z.number().optional(),
});
exports.TableFiltersSchema = zod_1.z.object({
    variant: exports.GameVariantEnum.optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
});
//# sourceMappingURL=table.dto.js.map