/**
 * Hand Evaluator — Zero-dependency poker hand evaluation
 *
 * 🟣 Purple Cable: Runs entirely on the client.
 * Determines the Hero's best 5-card hand from hole cards + community cards.
 *
 * Supports:
 *   - Texas Hold'em: best 5 of up to 7 cards
 *   - Omaha: exactly 2 from hand + exactly 3 from board
 */

// ── Types ──────────────────────────────────────────────────────

interface EvalCard {
    rank: string;
    suit: string;
}

// Hand rank tiers (higher = better)
const HAND_RANKS = {
    ROYAL_FLUSH: 9,
    STRAIGHT_FLUSH: 8,
    FOUR_OF_A_KIND: 7,
    FULL_HOUSE: 6,
    FLUSH: 5,
    STRAIGHT: 4,
    THREE_OF_A_KIND: 3,
    TWO_PAIR: 2,
    PAIR: 1,
    HIGH_CARD: 0,
} as const;

type HandRank = (typeof HAND_RANKS)[keyof typeof HAND_RANKS];

interface HandResult {
    rank: HandRank;
    score: number;    // Tie-breaker score within the rank tier
    name: string;     // Human-readable name
}

// ── Helpers ────────────────────────────────────────────────────

const RANK_VALUES: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const RANK_NAMES: Record<string, string> = {
    '2': 'Twos', '3': 'Threes', '4': 'Fours', '5': 'Fives',
    '6': 'Sixes', '7': 'Sevens', '8': 'Eights', '9': 'Nines',
    '10': 'Tens', 'T': 'Tens', 'J': 'Jacks', 'Q': 'Queens',
    'K': 'Kings', 'A': 'Aces',
};

const RANK_SINGULAR: Record<string, string> = {
    '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine',
    '10': 'Ten', 'T': 'Ten', 'J': 'Jack', 'Q': 'Queen',
    'K': 'King', 'A': 'Ace',
};

function rankValue(rank: string): number {
    return RANK_VALUES[rank] ?? 0;
}

function rankName(rank: string): string {
    return RANK_NAMES[rank] ?? rank;
}

function rankSingular(rank: string): string {
    return RANK_SINGULAR[rank] ?? rank;
}

/** Find the rank string for a given numeric value */
function valueToRank(val: number): string {
    for (const [k, v] of Object.entries(RANK_VALUES)) {
        if (v === val && k.length <= 2) return k;
    }
    return String(val);
}

/**
 * Generate all k-element combinations from an array.
 */
function combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const result: T[][] = [];
    const first = arr[0];
    const rest = arr.slice(1);
    // Combos that include first
    for (const combo of combinations(rest, k - 1)) {
        result.push([first, ...combo]);
    }
    // Combos that exclude first
    for (const combo of combinations(rest, k)) {
        result.push(combo);
    }
    return result;
}

// ── 5-Card Evaluator ───────────────────────────────────────────

function evaluate5(cards: EvalCard[]): HandResult {
    if (cards.length !== 5) {
        return { rank: HAND_RANKS.HIGH_CARD, score: 0, name: 'Invalid' };
    }

    const values = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);

    // Check straight (including wheel: A-2-3-4-5)
    let isStraight = false;
    let straightHigh = values[0];

    const unique = [...new Set(values)];
    if (unique.length === 5) {
        if (unique[0] - unique[4] === 4) {
            isStraight = true;
            straightHigh = unique[0];
        }
        // Wheel: A-5-4-3-2
        if (unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2) {
            isStraight = true;
            straightHigh = 5; // 5-high straight
        }
    }

    // Count rank frequencies
    const freq: Record<number, number> = {};
    for (const v of values) freq[v] = (freq[v] ?? 0) + 1;
    const counts = Object.entries(freq)
        .map(([val, count]) => ({ val: Number(val), count }))
        .sort((a, b) => b.count - a.count || b.val - a.val);

    // ── Classify ──

    if (isFlush && isStraight) {
        if (straightHigh === 14) {
            return { rank: HAND_RANKS.ROYAL_FLUSH, score: 14, name: 'Royal Flush' };
        }
        return {
            rank: HAND_RANKS.STRAIGHT_FLUSH,
            score: straightHigh,
            name: `Straight Flush, ${rankSingular(valueToRank(straightHigh))} High`,
        };
    }

    if (counts[0].count === 4) {
        return {
            rank: HAND_RANKS.FOUR_OF_A_KIND,
            score: counts[0].val * 100 + counts[1].val,
            name: `Four ${rankName(valueToRank(counts[0].val))}`,
        };
    }

    if (counts[0].count === 3 && counts[1].count === 2) {
        return {
            rank: HAND_RANKS.FULL_HOUSE,
            score: counts[0].val * 100 + counts[1].val,
            name: `Full House, ${rankName(valueToRank(counts[0].val))} over ${rankName(valueToRank(counts[1].val))}`,
        };
    }

    if (isFlush) {
        return {
            rank: HAND_RANKS.FLUSH,
            score: values.reduce((acc, v, i) => acc + v * Math.pow(15, 4 - i), 0),
            name: `Flush, ${rankSingular(valueToRank(values[0]))} High`,
        };
    }

    if (isStraight) {
        return {
            rank: HAND_RANKS.STRAIGHT,
            score: straightHigh,
            name: `Straight, ${rankSingular(valueToRank(straightHigh))} High`,
        };
    }

    if (counts[0].count === 3) {
        return {
            rank: HAND_RANKS.THREE_OF_A_KIND,
            score: counts[0].val * 10000 + counts[1].val * 100 + counts[2].val,
            name: `Three ${rankName(valueToRank(counts[0].val))}`,
        };
    }

    if (counts[0].count === 2 && counts[1].count === 2) {
        const high = Math.max(counts[0].val, counts[1].val);
        const low = Math.min(counts[0].val, counts[1].val);
        return {
            rank: HAND_RANKS.TWO_PAIR,
            score: high * 10000 + low * 100 + counts[2].val,
            name: `Two Pair, ${rankName(valueToRank(high))} and ${rankName(valueToRank(low))}`,
        };
    }

    if (counts[0].count === 2) {
        return {
            rank: HAND_RANKS.PAIR,
            score: counts[0].val * 1000000 + counts[1].val * 10000 + counts[2].val * 100 + counts[3].val,
            name: `Pair of ${rankName(valueToRank(counts[0].val))}`,
        };
    }

    return {
        rank: HAND_RANKS.HIGH_CARD,
        score: values.reduce((acc, v, i) => acc + v * Math.pow(15, 4 - i), 0),
        name: `High Card, ${rankSingular(valueToRank(values[0]))}`,
    };
}

// ── Best Hand Finder ───────────────────────────────────────────

function findBest(combos: EvalCard[][]): HandResult {
    let best: HandResult = { rank: HAND_RANKS.HIGH_CARD, score: -1, name: '' };
    for (const combo of combos) {
        const result = evaluate5(combo);
        if (
            result.rank > best.rank ||
            (result.rank === best.rank && result.score > best.score)
        ) {
            best = result;
        }
    }
    return best;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Evaluate the Hero's best hand.
 *
 * @param holeCards     The Hero's hole cards
 * @param communityCards  The board (0-5 cards)
 * @param gameType     'holdem' or 'omaha'
 * @returns Human-readable hand description, or null if not enough cards
 */
export function evaluateHand(
    holeCards: EvalCard[],
    communityCards: EvalCard[],
    gameType: 'holdem' | 'omaha',
): string | null {
    if (!holeCards || holeCards.length < 2) return null;

    // ── Pre-flop: evaluate just the hole cards ──
    if (!communityCards || communityCards.length === 0) {
        // Only check for a pocket pair or high card
        if (holeCards.length >= 2) {
            const v0 = rankValue(holeCards[0].rank);
            const v1 = rankValue(holeCards[1].rank);
            if (v0 === v1) {
                return `Pair of ${rankName(holeCards[0].rank)}`;
            }
            const highRank = v0 > v1 ? holeCards[0].rank : holeCards[1].rank;
            return `High Card, ${rankSingular(highRank)}`;
        }
        return null;
    }

    if (gameType === 'omaha') {
        // Omaha: exactly 2 from hand + exactly 3 from board
        if (holeCards.length < 2 || communityCards.length < 3) return null;

        const holeCombos = combinations(holeCards, 2);
        const boardCombos = combinations(communityCards, 3);

        const allCombos: EvalCard[][] = [];
        for (const h of holeCombos) {
            for (const b of boardCombos) {
                allCombos.push([...h, ...b]);
            }
        }
        const best = findBest(allCombos);
        return best.name || null;
    }

    // Hold'em: best 5 of all available cards
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length < 5) {
        // 2 hole + 3 community minimum for a real hand
        // With <5 total, evaluate what we can (pre-flop handled above)
        const partialCombos = combinations(allCards, allCards.length);
        const fiveCardCombos = partialCombos.filter(c => c.length === 5);
        if (fiveCardCombos.length === 0) {
            // Less than 5 cards — just describe the best pair/high
            const values = allCards.map(c => rankValue(c.rank)).sort((a, b) => b - a);
            const freq: Record<number, number> = {};
            for (const v of values) freq[v] = (freq[v] ?? 0) + 1;
            const pairs = Object.entries(freq).filter(([, c]) => c >= 2).map(([v]) => Number(v)).sort((a, b) => b - a);
            if (pairs.length > 0) return `Pair of ${rankName(valueToRank(pairs[0]))}`;
            return `High Card, ${rankSingular(valueToRank(values[0]))}`;
        }
        const best = findBest(fiveCardCombos);
        return best.name || null;
    }

    const combos = combinations(allCards, 5);
    const best = findBest(combos);
    return best.name || null;
}
