/**
 * Shuffle Utility Tests
 * 
 * Verifies CSPRNG-based Fisher-Yates shuffle for poker deck generation.
 * Per SSS-Grade Security Checklist: crypto.randomInt is mandatory.
 */

import { createDeck, createShuffledDeck, cryptoShuffle } from './shuffle';

describe('createDeck', () => {
    it('should return exactly 52 cards', () => {
        const deck = createDeck();
        expect(deck).toHaveLength(52);
    });

    it('should return 52 unique cards', () => {
        const deck = createDeck();
        const uniqueCards = new Set(deck);
        expect(uniqueCards.size).toBe(52);
    });

    it('should contain all suits', () => {
        const deck = createDeck();
        const suits = ['s', 'h', 'd', 'c'];
        for (const suit of suits) {
            const cardsOfSuit = deck.filter(card => card.endsWith(suit));
            expect(cardsOfSuit).toHaveLength(13);
        }
    });

    it('should contain all ranks', () => {
        const deck = createDeck();
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        for (const rank of ranks) {
            const cardsOfRank = deck.filter(card => card.startsWith(rank));
            expect(cardsOfRank).toHaveLength(4);
        }
    });
});

describe('cryptoShuffle', () => {
    it('should not mutate the original array', () => {
        const original = [1, 2, 3, 4, 5];
        const originalCopy = [...original];
        cryptoShuffle(original);
        expect(original).toEqual(originalCopy);
    });

    it('should preserve all elements', () => {
        const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const shuffled = cryptoShuffle(original);
        expect(shuffled.sort((a, b) => a - b)).toEqual(original);
    });

    it('should produce different orderings over 1000 shuffles', () => {
        const deck = createDeck();
        const shuffledDecks = new Set<string>();

        for (let i = 0; i < 1000; i++) {
            const shuffled = cryptoShuffle(deck);
            shuffledDecks.add(shuffled.join(','));
        }

        // With 52! permutations, 1000 shuffles should ALL be unique
        expect(shuffledDecks.size).toBe(1000);
    });
});

describe('createShuffledDeck', () => {
    it('should return exactly 52 unique cards', () => {
        const deck = createShuffledDeck();
        expect(deck).toHaveLength(52);
        expect(new Set(deck).size).toBe(52);
    });

    it('should produce different deck orders', () => {
        const deck1 = createShuffledDeck();
        const deck2 = createShuffledDeck();

        // Extremely unlikely to be identical
        expect(deck1.join(',')).not.toEqual(deck2.join(','));
    });
});
