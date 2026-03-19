import { z } from 'zod';
export declare const PlayerStatusSchema: z.ZodEnum<{
    waiting: "waiting";
    active: "active";
    folded: "folded";
    "all-in": "all-in";
    "sitting-out": "sitting-out";
}>;
export type PlayerStatus = z.infer<typeof PlayerStatusSchema>;
export declare const PlayerStateSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    chips: z.ZodNumber;
    status: z.ZodEnum<{
        waiting: "waiting";
        active: "active";
        folded: "folded";
        "all-in": "all-in";
        "sitting-out": "sitting-out";
    }>;
    cards: z.ZodArray<z.ZodString>;
    currentBet: z.ZodNumber;
    totalContribution: z.ZodDefault<z.ZodNumber>;
    seatNumber: z.ZodNumber;
    avatarId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export declare const TablePhaseSchema: z.ZodEnum<{
    waiting: "waiting";
    preflop: "preflop";
    flop: "flop";
    turn: "turn";
    river: "river";
    showdown: "showdown";
}>;
export type TablePhase = z.infer<typeof TablePhaseSchema>;
export declare const TableStateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    phase: z.ZodEnum<{
        waiting: "waiting";
        preflop: "preflop";
        flop: "flop";
        turn: "turn";
        river: "river";
        showdown: "showdown";
    }>;
    pot: z.ZodNumber;
    currentBet: z.ZodNumber;
    turnSeat: z.ZodNumber;
    dealerSeat: z.ZodNumber;
    smallBlindSeat: z.ZodNumber;
    bigBlindSeat: z.ZodNumber;
    communityCards: z.ZodArray<z.ZodString>;
    smallBlind: z.ZodNumber;
    bigBlind: z.ZodNumber;
    minPlayers: z.ZodDefault<z.ZodNumber>;
    maxPlayers: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type TableState = z.infer<typeof TableStateSchema>;
export declare const TableSnapshotSchema: z.ZodObject<{
    table: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phase: z.ZodEnum<{
            waiting: "waiting";
            preflop: "preflop";
            flop: "flop";
            turn: "turn";
            river: "river";
            showdown: "showdown";
        }>;
        pot: z.ZodNumber;
        currentBet: z.ZodNumber;
        turnSeat: z.ZodNumber;
        dealerSeat: z.ZodNumber;
        smallBlindSeat: z.ZodNumber;
        bigBlindSeat: z.ZodNumber;
        communityCards: z.ZodArray<z.ZodString>;
        smallBlind: z.ZodNumber;
        bigBlind: z.ZodNumber;
        minPlayers: z.ZodDefault<z.ZodNumber>;
        maxPlayers: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    players: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        chips: z.ZodNumber;
        status: z.ZodEnum<{
            waiting: "waiting";
            active: "active";
            folded: "folded";
            "all-in": "all-in";
            "sitting-out": "sitting-out";
        }>;
        cards: z.ZodArray<z.ZodString>;
        currentBet: z.ZodNumber;
        totalContribution: z.ZodDefault<z.ZodNumber>;
        seatNumber: z.ZodNumber;
        avatarId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    myCards: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type TableSnapshot = z.infer<typeof TableSnapshotSchema>;
export declare const JoinTableEventSchema: z.ZodObject<{
    tableId: z.ZodString;
    seatNumber: z.ZodNumber;
    buyIn: z.ZodNumber;
}, z.core.$strip>;
export type JoinTableEvent = z.infer<typeof JoinTableEventSchema>;
export declare const LeaveTableEventSchema: z.ZodObject<{
    tableId: z.ZodString;
}, z.core.$strip>;
export type LeaveTableEvent = z.infer<typeof LeaveTableEventSchema>;
export declare const BetActionSchema: z.ZodObject<{
    tableId: z.ZodString;
    action: z.ZodEnum<{
        "all-in": "all-in";
        check: "check";
        fold: "fold";
        call: "call";
        raise: "raise";
    }>;
    amount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type BetAction = z.infer<typeof BetActionSchema>;
export declare const ToggleSitOutEventSchema: z.ZodObject<{
    tableId: z.ZodString;
}, z.core.$strip>;
export type ToggleSitOutEvent = z.infer<typeof ToggleSitOutEventSchema>;
export declare const AddChipsEventSchema: z.ZodObject<{
    tableId: z.ZodString;
    amount: z.ZodNumber;
}, z.core.$strip>;
export type AddChipsEvent = z.infer<typeof AddChipsEventSchema>;
export declare const RebuySchema: z.ZodObject<{
    tableId: z.ZodString;
    amount: z.ZodNumber;
}, z.core.$strip>;
export type RebuyDto = z.infer<typeof RebuySchema>;
export declare const SubscribeTableEventSchema: z.ZodObject<{
    tableId: z.ZodString;
}, z.core.$strip>;
export type SubscribeTableEvent = z.infer<typeof SubscribeTableEventSchema>;
export declare const PlayerConnectionSchema: z.ZodEnum<{
    online: "online";
    offline: "offline";
}>;
export type PlayerConnection = z.infer<typeof PlayerConnectionSchema>;
export declare const PlayerConnectionStatusEventSchema: z.ZodObject<{
    seat: z.ZodNumber;
    status: z.ZodEnum<{
        online: "online";
        offline: "offline";
    }>;
    username: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PlayerConnectionStatusEvent = z.infer<typeof PlayerConnectionStatusEventSchema>;
export declare const PlayerGameStatusSchema: z.ZodEnum<{
    waiting: "waiting";
    active: "active";
    sitting_out: "sitting_out";
    timed_out: "timed_out";
}>;
export type PlayerGameStatus = z.infer<typeof PlayerGameStatusSchema>;
export declare const PlayerStatusUpdateEventSchema: z.ZodObject<{
    seat: z.ZodNumber;
    status: z.ZodEnum<{
        waiting: "waiting";
        active: "active";
        sitting_out: "sitting_out";
        timed_out: "timed_out";
    }>;
}, z.core.$strip>;
export type PlayerStatusUpdateEvent = z.infer<typeof PlayerStatusUpdateEventSchema>;
export interface DistributionPlan {
    seat: number;
    amount: number;
    type: string;
}
