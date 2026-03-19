import { z } from 'zod';
export declare const GameVariantEnum: z.ZodEnum<{
    TEXAS_HOLDEM: "TEXAS_HOLDEM";
    OMAHA: "OMAHA";
    ALL_IN_OR_FOLD: "ALL_IN_OR_FOLD";
}>;
export type GameVariant = z.infer<typeof GameVariantEnum>;
export declare const GameVariantDisplayNames: Record<GameVariant, string>;
export declare const TurnTimeEnum: z.ZodEnum<{
    15: "15";
    30: "30";
    60: "60";
}>;
export type TurnTime = z.infer<typeof TurnTimeEnum>;
export declare const TurnTimeDisplayNames: Record<string, string>;
export declare const BettingLimitEnum: z.ZodEnum<{
    NO_LIMIT: "NO_LIMIT";
    POT_LIMIT: "POT_LIMIT";
    FIXED_LIMIT: "FIXED_LIMIT";
}>;
export type BettingLimit = z.infer<typeof BettingLimitEnum>;
export declare const BettingLimitDisplayNames: Record<BettingLimit, string>;
export declare const CreateTableSchema: z.ZodObject<{
    name: z.ZodString;
    variant: z.ZodEnum<{
        TEXAS_HOLDEM: "TEXAS_HOLDEM";
        OMAHA: "OMAHA";
        ALL_IN_OR_FOLD: "ALL_IN_OR_FOLD";
    }>;
    maxSeats: z.ZodCoercedNumber<unknown>;
    smallBlind: z.ZodCoercedNumber<unknown>;
    bigBlind: z.ZodCoercedNumber<unknown>;
    minBuyIn: z.ZodCoercedNumber<unknown>;
    maxBuyIn: z.ZodCoercedNumber<unknown>;
    ante: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    turnTime: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    timeBank: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    isStraddleAllowed: z.ZodDefault<z.ZodBoolean>;
    password: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    rakePercent: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    rakeCap: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    holeCardsCount: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    bettingLimit: z.ZodDefault<z.ZodEnum<{
        NO_LIMIT: "NO_LIMIT";
        POT_LIMIT: "POT_LIMIT";
        FIXED_LIMIT: "FIXED_LIMIT";
    }>>;
}, z.core.$strip>;
export type CreateTableDto = z.infer<typeof CreateTableSchema>;
export declare const LobbyTableSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    variant: z.ZodEnum<{
        TEXAS_HOLDEM: "TEXAS_HOLDEM";
        OMAHA: "OMAHA";
        ALL_IN_OR_FOLD: "ALL_IN_OR_FOLD";
    }>;
    stakes: z.ZodString;
    players: z.ZodNumber;
    maxSeats: z.ZodNumber;
    minBuyIn: z.ZodNumber;
    maxBuyIn: z.ZodNumber;
    holeCardsCount: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodBoolean;
    status: z.ZodString;
    isPrivate: z.ZodBoolean;
    rakePercent: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type LobbyTableDto = z.infer<typeof LobbyTableSchema>;
export declare const TableFiltersSchema: z.ZodObject<{
    variant: z.ZodOptional<z.ZodEnum<{
        TEXAS_HOLDEM: "TEXAS_HOLDEM";
        OMAHA: "OMAHA";
        ALL_IN_OR_FOLD: "ALL_IN_OR_FOLD";
    }>>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export type TableFiltersDto = z.infer<typeof TableFiltersSchema>;
