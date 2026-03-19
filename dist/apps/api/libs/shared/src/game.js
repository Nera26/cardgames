"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerStatusUpdateEventSchema = exports.PlayerGameStatusSchema = exports.PlayerConnectionStatusEventSchema = exports.PlayerConnectionSchema = exports.SubscribeTableEventSchema = exports.RebuySchema = exports.AddChipsEventSchema = exports.ToggleSitOutEventSchema = exports.BetActionSchema = exports.LeaveTableEventSchema = exports.JoinTableEventSchema = exports.TableSnapshotSchema = exports.TableStateSchema = exports.TablePhaseSchema = exports.PlayerStateSchema = exports.PlayerStatusSchema = void 0;
const zod_1 = require("zod");
exports.PlayerStatusSchema = zod_1.z.enum([
    'waiting',
    'active',
    'folded',
    'all-in',
    'sitting-out'
]);
exports.PlayerStateSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    username: zod_1.z.string(),
    chips: zod_1.z.number().int().nonnegative(),
    status: exports.PlayerStatusSchema,
    cards: zod_1.z.array(zod_1.z.string()).max(2),
    currentBet: zod_1.z.number().int().nonnegative(),
    totalContribution: zod_1.z.number().int().nonnegative().default(0),
    seatNumber: zod_1.z.number().int().min(0).max(9),
    avatarId: zod_1.z.string().optional().default('avatar_1'),
});
exports.TablePhaseSchema = zod_1.z.enum([
    'waiting',
    'preflop',
    'flop',
    'turn',
    'river',
    'showdown'
]);
exports.TableStateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    phase: exports.TablePhaseSchema,
    pot: zod_1.z.number().int().nonnegative(),
    currentBet: zod_1.z.number().int().nonnegative(),
    turnSeat: zod_1.z.number().int().min(-1).max(9),
    dealerSeat: zod_1.z.number().int().min(0).max(9),
    smallBlindSeat: zod_1.z.number().int().min(0).max(9),
    bigBlindSeat: zod_1.z.number().int().min(0).max(9),
    communityCards: zod_1.z.array(zod_1.z.string()).max(5),
    smallBlind: zod_1.z.number().int().positive(),
    bigBlind: zod_1.z.number().int().positive(),
    minPlayers: zod_1.z.number().int().min(2).default(2),
    maxPlayers: zod_1.z.number().int().min(2).max(10).default(9),
});
exports.TableSnapshotSchema = zod_1.z.object({
    table: exports.TableStateSchema,
    players: zod_1.z.array(exports.PlayerStateSchema),
    myCards: zod_1.z.array(zod_1.z.string()).max(2).optional(),
});
exports.JoinTableEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    seatNumber: zod_1.z.number().int().min(0).max(9),
    buyIn: zod_1.z.number().int().positive(),
});
exports.LeaveTableEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.BetActionSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    action: zod_1.z.enum(['fold', 'check', 'call', 'raise', 'all-in']),
    amount: zod_1.z.number().int().nonnegative().optional(),
});
exports.ToggleSitOutEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.AddChipsEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().int().positive(),
});
exports.RebuySchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().int().positive(),
});
exports.SubscribeTableEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.PlayerConnectionSchema = zod_1.z.enum(['online', 'offline']);
exports.PlayerConnectionStatusEventSchema = zod_1.z.object({
    seat: zod_1.z.number().int().min(0).max(9),
    status: exports.PlayerConnectionSchema,
    username: zod_1.z.string().optional(),
});
exports.PlayerGameStatusSchema = zod_1.z.enum([
    'active',
    'sitting_out',
    'timed_out',
    'waiting',
]);
exports.PlayerStatusUpdateEventSchema = zod_1.z.object({
    seat: zod_1.z.number().int().min(0).max(9),
    status: exports.PlayerGameStatusSchema,
});
//# sourceMappingURL=game.js.map