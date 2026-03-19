/**
 * Hand Evaluator Service - The Brain
 * 
 * Evaluates poker hands and determines winners.
 * Uses the poker-evaluator library (Two Plus Two algorithm).
 * 
 * SUPPORTS:
 * - Texas Hold'em: Best 5 from 7 (2 hole + 5 board)
 * - Omaha (PLO-4/5/6): MUST use exactly 2 hole + 3 board
 * 
 * @see ARCHITECTURE.md - Brain (Node) vs Muscle (Redis) pattern
 */

import { Injectable, Logger } from '@nestjs/common';
import { DistributionPlan } from '@poker/shared';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PokerEvaluator = require('poker-evaluator');

interface PlayerHand {
    seat: number;
    cards: string[];
    chips: number;
    status: string;
    totalContribution: number;
}

interface EvaluatedPlayer extends PlayerHand {
    handStrength: {
        value: number;
        name: string;
    };
}

export interface Winner {
    seat: number;
    amount: number;
    displayAmount?: number;
    handDescription: string;
    type?: string;
    winningCards?: string[];
}

@Injectable()
export class HandEvaluatorService {
    private readonly logger = new Logger(HandEvaluatorService.name);

    /**
     * Generate all combinations of k elements from array (n choose k).
     * Used for Omaha combinatorics.
     */
    private combinations<T>(arr: T[], k: number): T[][] {
        const result: T[][] = [];

        const combine = (start: number, combo: T[]) => {
            if (combo.length === k) {
                result.push([...combo]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        };

        combine(0, []);
        return result;
    }

    /**
     * Evaluate a single 5-card hand.
     * The poker-evaluator library handles both 5-card and 7-card hands.
     */
    evaluateFiveCardHand(cards: string[]): { handType: number; handRank: number; handName: string; value: number } {
        const result = PokerEvaluator.evalHand(cards);
        return {
            handType: result.handType,
            handRank: result.handRank,
            handName: result.handName,
            value: result.value,
        };
    }

    /**
     * Evaluate a Texas Hold'em hand (best 5 of 7 cards).
     * Returns the best 5-card subset for showdown spotlight.
     */
    evaluateTexasHand(holeCards: string[], communityCards: string[]): { value: number; name: string; bestCards: string[] } {
        const fullHand = [...holeCards, ...communityCards];

        // Enumerate all C(N,5) combos to find the exact best 5
        const fiveCombos = this.combinations(fullHand, 5);
        let bestValue = 0;
        let bestName = '';
        let bestCards: string[] = fullHand.slice(0, 5); // fallback

        for (const combo of fiveCombos) {
            const result = this.evaluateFiveCardHand(combo);
            if (result.value > bestValue) {
                bestValue = result.value;
                bestName = result.handName;
                bestCards = combo;
            }
        }

        return { value: bestValue, name: bestName, bestCards };
    }

    /**
     * Evaluate an Omaha hand (MUST use exactly 2 hole + 3 board).
     * 
     * This is the critical Omaha rule:
     * - You MUST use exactly 2 of your hole cards
     * - You MUST use exactly 3 of the community cards
     * - Evaluate all C(X,2) × C(5,3) = X!/(2!(X-2)!) × 10 combinations
     * 
     * @param holeCards - 4, 5, or 6 hole cards depending on Omaha variant
     * @param communityCards - 5 community cards
     */
    evaluateOmahaHand(holeCards: string[], communityCards: string[]): { value: number; name: string; bestCards: string[] } {
        // Generate all 2-card combinations from hole cards
        const holeCombos = this.combinations(holeCards, 2);

        // Generate all 3-card combinations from community cards (always C(5,3) = 10)
        const boardCombos = this.combinations(communityCards, 3);

        let bestValue = 0;
        let bestName = '';
        let bestCards: string[] = [];

        // Evaluate every possible 2+3 = 5 card hand
        // Strict Omaha rule: EXACTLY 2 from hole, EXACTLY 3 from board
        for (const holeCombo of holeCombos) {
            for (const boardCombo of boardCombos) {
                const fiveCardHand = [...holeCombo, ...boardCombo];
                const result = this.evaluateFiveCardHand(fiveCardHand);

                if (result.value > bestValue) {
                    bestValue = result.value;
                    bestName = result.handName;
                    bestCards = fiveCardHand;
                }
            }
        }

        this.logger.debug(
            `Omaha evaluation: ${holeCombos.length} hole combos × ${boardCombos.length} board combos = ` +
            `${holeCombos.length * boardCombos.length} total hands. Best: ${bestName} (${bestValue})`
        );

        return { value: bestValue, name: bestName, bestCards };
    }

    /**
     * Determine raw hand scores for all players in the hand.
     * Auto-detects Texas vs Omaha based on hole card count.
     * The actual pot distribution happens in the Lua engine.
     */
    evaluateHandScores(
        players: PlayerHand[],
        communityCards: string[]
    ): { seat: number; score: number; handDescription: string; winningCards: string[] }[] {
        const activePlayers = players.filter(
            p => p.status === 'active' || p.status === 'all-in'
        );

        if (activePlayers.length === 0) {
            this.logger.warn('No active players for showdown');
            return [];
        }

        // Evaluate all players who didn't fold
        const evaluatedPlayers = activePlayers.map(p => {
            // Auto-detect variant based on hole card count
            const isOmaha = p.cards.length > 2;

            const evalResult = isOmaha
                ? this.evaluateOmahaHand(p.cards, communityCards)
                : this.evaluateTexasHand(p.cards, communityCards);

            return {
                ...p,
                handStrength: {
                    value: evalResult.value,
                    name: evalResult.name,
                },
                bestCards: evalResult.bestCards,
            };
        });

        // Return raw scores + winning cards for Lua to handle splitting
        return evaluatedPlayers.map(p => ({
            seat: p.seat,
            score: p.handStrength.value,
            handDescription: p.handStrength.name,
            winningCards: p.bestCards,
        }));
    }

}

