export declare function cryptoShuffle<T>(array: T[]): T[];
declare const SUITS: readonly ["s", "h", "d", "c"];
declare const RANKS: readonly ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
export type Suit = typeof SUITS[number];
export type Rank = typeof RANKS[number];
export type Card = `${Rank}${Suit}`;
export declare function createDeck(): Card[];
export declare function createShuffledDeck(): Card[];
export {};
