"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cryptoShuffle = cryptoShuffle;
exports.createDeck = createDeck;
exports.createShuffledDeck = createShuffledDeck;
const crypto_1 = require("crypto");
function cryptoShuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = (0, crypto_1.randomInt)(0, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
const SUITS = ['s', 'h', 'd', 'c'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
function createDeck() {
    return SUITS.flatMap(suit => RANKS.map(rank => `${rank}${suit}`));
}
function createShuffledDeck() {
    return cryptoShuffle(createDeck());
}
//# sourceMappingURL=shuffle.js.map