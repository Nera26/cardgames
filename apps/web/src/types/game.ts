export interface Card {
    rank: string;
    suit: 'hearts' | 'spades' | 'diamonds' | 'clubs';
    isFaceUp: boolean;
}

export interface Player {
    id: string;
    seatIndex?: number; // Server seat position (0-8 for 9-max)
    name: string;
    balance: number;
    avatar: string;
    avatarId?: string;
    avatarUrl?: string | null;
    cards: Card[];
    isActive: boolean;
    isDealer: boolean;
    status: 'active' | 'folded' | 'sitting_out' | 'waiting' | 'all-in';
    currentBet?: number;
    totalContribution?: number; // Total chips put into the pot this hand
    totalBuyIn?: number; // Cumulative buy-in for session (initial + rebuys)
    timer?: number; // seconds remaining
    sitOutStart?: number; // Unix timestamp (seconds) when player started sitting out
    sitOutBank?: number; // Remaining sit-out budget in seconds (Depleting Time Bank)
    sitOutStartedAt?: number; // Unix epoch seconds when current sit-out began
    depositExpiresAt?: number; // Unix epoch seconds — deposit hold deadline (visible to all players)
    lastAction?: 'CHECK' | 'CALL' | 'RAISE' | 'FOLD' | 'ALL_IN' | 'BET'; // Derived client-side
}

export interface SidePot {
    amount: number;
    eligiblePlayerIds: string[];
}

export interface TableState {
    id: string;
    name: string;
    stakes: string;
    pot: number;
    pots?: SidePot[]; // Derived client-side from player contributions
    communityCards: Card[];
    players: Player[];
    waitlist?: { username: string; avatarId?: string; avatarUrl?: string | null }[];
    observers?: { userId: string; username: string; avatarId?: string; avatarUrl?: string | null }[];
    activePlayerId?: string;
    phase?: string;
}
