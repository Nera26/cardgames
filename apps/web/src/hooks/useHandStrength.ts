'use client';

import { useMemo } from 'react';
import { Card } from '@/types/game';
import { evaluateHand } from '@/utils/handEvaluator';

/**
 * useHandStrength — Real-Time Hand Strength Indicator
 *
 * 🟣 Purple Cable: Client-side only. Zero latency.
 * Recalculates ONLY when card arrays change (useMemo).
 *
 * @param holeCards       Hero's hole cards
 * @param communityCards  Board cards (0-5)
 * @param gameType        'holdem' | 'omaha'
 * @returns Human-readable string or null
 */
export function useHandStrength(
    holeCards: Card[],
    communityCards: Card[],
    gameType: 'holdem' | 'omaha',
): string | null {
    // Serialize card arrays for stable memo deps
    const holeKey = holeCards
        .map(c => `${c.rank}${c.suit}`)
        .join(',');
    const communityKey = communityCards
        .map(c => `${c.rank}${c.suit}`)
        .join(',');

    return useMemo(() => {
        // Guard: need at least 2 face-up hole cards
        const faceUpHole = holeCards.filter(c => c.isFaceUp !== false);
        if (faceUpHole.length < 2) return null;

        return evaluateHand(
            faceUpHole.map(c => ({ rank: c.rank, suit: c.suit })),
            communityCards.map(c => ({ rank: c.rank, suit: c.suit })),
            gameType,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [holeKey, communityKey, gameType]);
}
