/**
 * CSPRNG-based Fisher-Yates Shuffle for Poker Deck
 * 
 * Uses Node.js crypto.randomInt for cryptographically secure randomness.
 * This is MANDATORY per SSS-Grade Security Checklist (ARCHITECTURE.md Section 19.3)
 * 
 * @module shuffle
 */

import { randomInt } from 'crypto';

/**
 * Cryptographically secure Fisher-Yates shuffle.
 * Each element has equal probability of landing in any position.
 * 
 * @param array - Array to shuffle (not mutated)
 * @returns New shuffled array
 */
export function cryptoShuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Standard 52-card deck notation.
 * Rank: 2-9, T (10), J, Q, K, A
 * Suit: s (spades), h (hearts), d (diamonds), c (clubs)
 * 
 * @example 'As' = Ace of spades, 'Th' = Ten of hearts
 */
const SUITS = ['s', 'h', 'd', 'c'] as const;
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof SUITS[number];
export type Rank = typeof RANKS[number];
export type Card = `${Rank}${Suit}`;

/**
 * Generate a standard 52-card deck (unshuffled).
 * 
 * @returns Array of 52 unique card strings
 */
export function createDeck(): Card[] {
    return SUITS.flatMap(suit => RANKS.map(rank => `${rank}${suit}` as Card));
}

/**
 * Generate a cryptographically shuffled 52-card deck.
 * This is the ONLY authorized method for deck generation in the Red Cable.
 * 
 * @returns Shuffled array of 52 unique card strings
 */
export function createShuffledDeck(): Card[] {
    return cryptoShuffle(createDeck());
}
