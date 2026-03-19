"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HandEvaluatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandEvaluatorService = void 0;
const common_1 = require("@nestjs/common");
const PokerEvaluator = require('poker-evaluator');
let HandEvaluatorService = HandEvaluatorService_1 = class HandEvaluatorService {
    constructor() {
        this.logger = new common_1.Logger(HandEvaluatorService_1.name);
    }
    combinations(arr, k) {
        const result = [];
        const combine = (start, combo) => {
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
    evaluateFiveCardHand(cards) {
        const result = PokerEvaluator.evalHand(cards);
        return {
            handType: result.handType,
            handRank: result.handRank,
            handName: result.handName,
            value: result.value,
        };
    }
    evaluateTexasHand(holeCards, communityCards) {
        const fullHand = [...holeCards, ...communityCards];
        const fiveCombos = this.combinations(fullHand, 5);
        let bestValue = 0;
        let bestName = '';
        let bestCards = fullHand.slice(0, 5);
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
    evaluateOmahaHand(holeCards, communityCards) {
        const holeCombos = this.combinations(holeCards, 2);
        const boardCombos = this.combinations(communityCards, 3);
        let bestValue = 0;
        let bestName = '';
        let bestCards = [];
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
        this.logger.debug(`Omaha evaluation: ${holeCombos.length} hole combos × ${boardCombos.length} board combos = ` +
            `${holeCombos.length * boardCombos.length} total hands. Best: ${bestName} (${bestValue})`);
        return { value: bestValue, name: bestName, bestCards };
    }
    evaluateHandScores(players, communityCards) {
        const activePlayers = players.filter(p => p.status === 'active' || p.status === 'all-in');
        if (activePlayers.length === 0) {
            this.logger.warn('No active players for showdown');
            return [];
        }
        const evaluatedPlayers = activePlayers.map(p => {
            const isOmaha = p.cards.length > 2;
            const evalResult = isOmaha
                ? this.evaluateOmahaHand(p.cards, communityCards)
                : this.evaluateTexasHand(p.cards, communityCards);
            return Object.assign(Object.assign({}, p), { handStrength: {
                    value: evalResult.value,
                    name: evalResult.name,
                }, bestCards: evalResult.bestCards });
        });
        return evaluatedPlayers.map(p => ({
            seat: p.seat,
            score: p.handStrength.value,
            handDescription: p.handStrength.name,
            winningCards: p.bestCards,
        }));
    }
};
exports.HandEvaluatorService = HandEvaluatorService;
exports.HandEvaluatorService = HandEvaluatorService = HandEvaluatorService_1 = __decorate([
    (0, common_1.Injectable)()
], HandEvaluatorService);
//# sourceMappingURL=hand-evaluator.service.js.map