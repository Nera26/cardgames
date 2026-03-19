/**
 * Game State Types for Red Cable Engine
 * 
 * These Zod schemas define the "Contract" between:
 * - Redis Lua scripts (data producer)
 * - Frontend UI (data consumer)
 * 
 * @see ARCHITECTURE.md Section 2.2 for Redis schema
 */

import { z } from 'zod';

// ============================================================
// Player State (Hash: table:{id}:players -> seat_{n})
// ============================================================

export const PlayerStatusSchema = z.enum([
    'waiting',   // Seated but not in current hand
    'active',    // In the hand, can act
    'folded',    // Folded this hand
    'all-in',    // All chips committed
    'sitting-out' // Temporarily away
]);
export type PlayerStatus = z.infer<typeof PlayerStatusSchema>;

export const PlayerStateSchema = z.object({
    id: z.string().cuid(),
    username: z.string(),
    chips: z.number().nonnegative(),
    totalBuyIn: z.number().nonnegative().optional().default(0),
    status: PlayerStatusSchema,
    cards: z.array(z.string()).max(2), // Hole cards (empty for opponents)
    currentBet: z.number().nonnegative(),
    totalContribution: z.number().nonnegative().default(0),
    seatNumber: z.number().int().min(0).max(9),
    avatarId: z.string().optional().default('avatar_1'),
    depositExpiresAt: z.number().optional(), // Unix epoch (seconds) — deposit hold deadline
});
export type PlayerState = z.infer<typeof PlayerStateSchema>;

// ============================================================
// Table State (Hash: table:{id})
// ============================================================

export const TablePhaseSchema = z.enum([
    'waiting',   // Not enough players
    'preflop',   // Hole cards dealt, pre-flop betting
    'flop',      // 3 community cards revealed
    'turn',      // 4th community card
    'river',     // 5th community card
    'showdown'   // Cards revealed, winner determined
]);
export type TablePhase = z.infer<typeof TablePhaseSchema>;

export const TableStateSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    phase: TablePhaseSchema,
    pot: z.number().nonnegative(),
    currentBet: z.number().nonnegative(), // Current bet to call
    turnSeat: z.number().int().min(-1).max(9), // -1 = no active turn
    dealerSeat: z.number().int().min(0).max(9),
    smallBlindSeat: z.number().int().min(0).max(9),
    bigBlindSeat: z.number().int().min(0).max(9),
    communityCards: z.array(z.string()).max(5),
    smallBlind: z.number().positive(),
    bigBlind: z.number().positive(),
    minPlayers: z.number().int().min(2).default(2),
    maxPlayers: z.number().int().min(2).max(10).default(9),
});
export type TableState = z.infer<typeof TableStateSchema>;

// ============================================================
// Full Table Snapshot (for frontend rendering)
// ============================================================

export const TableSnapshotSchema = z.object({
    table: TableStateSchema,
    players: z.array(PlayerStateSchema),
    myCards: z.array(z.string()).max(2).optional(), // Current user's hole cards
});
export type TableSnapshot = z.infer<typeof TableSnapshotSchema>;

// ============================================================
// Client -> Server Events (Socket.IO)
// ============================================================

export const JoinTableEventSchema = z.object({
    tableId: z.string().min(1),
    seatNumber: z.number().int().min(0).max(9),
    buyIn: z.number().positive(),
    password: z.string().max(50).optional(),
});
export type JoinTableEvent = z.infer<typeof JoinTableEventSchema>;

export const LeaveTableEventSchema = z.object({
    tableId: z.string().min(1),
});
export type LeaveTableEvent = z.infer<typeof LeaveTableEventSchema>;

export const BetActionSchema = z.object({
    tableId: z.string().min(1),
    action: z.enum(['fold', 'check', 'call', 'raise', 'all-in']),
    amount: z.number().nonnegative().optional(), // Required for raise
});
export type BetAction = z.infer<typeof BetActionSchema>;

export const ToggleSitOutEventSchema = z.object({
    tableId: z.string().min(1),
});
export type ToggleSitOutEvent = z.infer<typeof ToggleSitOutEventSchema>;

export const ToggleLNBBEventSchema = z.object({
    tableId: z.string().min(1),
    value: z.boolean(),
});
export type ToggleLNBBEvent = z.infer<typeof ToggleLNBBEventSchema>;

export const ToggleAutoRebuyEventSchema = z.object({
    tableId: z.string().min(1),
    value: z.boolean(),
});
export type ToggleAutoRebuyEvent = z.infer<typeof ToggleAutoRebuyEventSchema>;

/**
 * Set Auto-Muck — Store player preference to hide losing hands at showdown.
 * Emitted by: TableMenuDrawer (Auto-Muck toggle)
 * Handled by: game.gateway.ts → set_auto_muck.lua
 * Consumed by: showdown.lua (card scrubbing for losing autoMuck players)
 */
export const SetAutoMuckEventSchema = z.object({
    tableId: z.string().min(1),
    value: z.boolean(),
});
export type SetAutoMuckEvent = z.infer<typeof SetAutoMuckEventSchema>;

/**
 * Extend Seat For Deposit — Request a 180s seat hold while the player deposits funds.
 * Emitted by: RebuyModal (PENDING_DEPOSIT state)
 * Handled by: game.gateway.ts → extend_seat.lua
 */
export const ExtendSeatForDepositEventSchema = z.object({
    tableId: z.string().min(1),
});
export type ExtendSeatForDepositEvent = z.infer<typeof ExtendSeatForDepositEventSchema>;

/**
 * Wallet Balance Updated — Pushed via /notifications namespace when admin approves a deposit.
 * Consumed by: RebuyModal (PENDING_DEPOSIT state) to auto-trigger rebuy.
 */
export interface WalletBalanceUpdatedEvent {
    userId: string;
    newBalance: number;
    depositAmount: number;
}

export const AddChipsEventSchema = z.object({
    tableId: z.string().min(1),
    amount: z.number().positive(),
});
export type AddChipsEvent = z.infer<typeof AddChipsEventSchema>;

export const RebuySchema = z.object({
    tableId: z.string().min(1),
    amount: z.number().positive(),
});
export type RebuyDto = z.infer<typeof RebuySchema>;

/**
 * Subscribe to table state as a spectator (no seat required).
 * Allows clients to receive table_state broadcasts without joining the game.
 */
export const SubscribeTableEventSchema = z.object({
    tableId: z.string().min(1),
});
export type SubscribeTableEvent = z.infer<typeof SubscribeTableEventSchema>;

export const JoinWaitlistEventSchema = z.object({
    tableId: z.string().min(1),
});
export type JoinWaitlistEvent = z.infer<typeof JoinWaitlistEventSchema>;

export const LeaveWaitlistEventSchema = z.object({
    tableId: z.string().min(1),
});
export type LeaveWaitlistEvent = z.infer<typeof LeaveWaitlistEventSchema>;

// ============================================================
// Server -> Client Events (Socket.IO Broadcasts)
// ============================================================

/**
 * Player Connection Status — Broadcast when a player goes online/offline.
 * Emitted by: set_offline.lua (disconnect) / set_online.lua (reconnect)
 * Consumed by: SocketContext.tsx (offlineSeats state)
 */
export const PlayerConnectionSchema = z.enum(['online', 'offline']);
export type PlayerConnection = z.infer<typeof PlayerConnectionSchema>;

export const PlayerConnectionStatusEventSchema = z.object({
    tableId: z.string().min(1),
    seat: z.number().int().min(0).max(9),
    status: PlayerConnectionSchema,
    username: z.string().optional(),
});
export type PlayerConnectionStatusEvent = z.infer<typeof PlayerConnectionStatusEventSchema>;

/**
 * Player Joined — Lightweight event for mid-hand player additions.
 * Emitted INSTEAD of full table_state when a player sits down during an active hand.
 * This prevents the render-thrashing bug where a full state broadcast causes
 * the active player's action controls to momentarily vanish.
 *
 * Emitted by: game.gateway.ts (handleJoinTable)
 * Consumed by: SocketContext.tsx (immutable players array merge)
 */
export const PlayerJoinedEventSchema = z.object({
    tableId: z.string().min(1),
    player: z.object({
        id: z.string(),
        username: z.string(),
        chips: z.number(),
        status: z.string(),
        cards: z.array(z.string()),
        currentBet: z.number(),
        seatNumber: z.number().int().min(0).max(9),
        avatarId: z.string().optional(),
        totalContribution: z.number().optional(),
        time_bank: z.number().optional(),
    }),
});
export type PlayerJoinedEvent = z.infer<typeof PlayerJoinedEventSchema>;

/**
 * Player Status Update — Broadcast when a player's game status changes.
 * Emitted by: timeout handler (sitting_out), toggle_sit_out.lua, etc.
 * Consumed by: SocketContext.tsx (player status rendering)
 */
export const PlayerGameStatusSchema = z.enum([
    'active',
    'sitting_out',
    'timed_out',
    'waiting',
]);
export type PlayerGameStatus = z.infer<typeof PlayerGameStatusSchema>;

export const PlayerStatusUpdateEventSchema = z.object({
    seat: z.number().int().min(0).max(9),
    status: PlayerGameStatusSchema,
});
export type PlayerStatusUpdateEvent = z.infer<typeof PlayerStatusUpdateEventSchema>;

/**
 * Uncalled Bet Returned — Broadcast when an all-in bet exceeds what opponents can match.
 * The uncalled portion is refunded atomically in bet.lua and this event tells the
 * frontend to animate chips sliding from the bet area back to the player's seat.
 *
 * Emitted by: game.gateway.ts (handleAction) when bet.lua returns uncalledBetRefund
 * Consumed by: SocketContext.tsx → page.tsx (framer-motion chip return animation)
 */
export const UncalledBetReturnedEventSchema = z.object({
    tableId: z.string().min(1),
    seat: z.number().int().min(0).max(9),
    amount: z.number().positive(),
});
export type UncalledBetReturnedEvent = z.infer<typeof UncalledBetReturnedEventSchema>;

// ============================================================
// Pot Distribution Plan (for Brain/Muscle handoff)
// ============================================================

export interface DistributionPlan {
    seat: number;
    amount: number;
    type: string;
}

