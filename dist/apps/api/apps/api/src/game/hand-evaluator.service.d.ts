interface PlayerHand {
    seat: number;
    cards: string[];
    chips: number;
    status: string;
    totalContribution: number;
}
export interface Winner {
    seat: number;
    amount: number;
    handDescription: string;
    type?: string;
    winningCards?: string[];
}
export declare class HandEvaluatorService {
    private readonly logger;
    private combinations;
    evaluateFiveCardHand(cards: string[]): {
        handType: number;
        handRank: number;
        handName: string;
        value: number;
    };
    evaluateTexasHand(holeCards: string[], communityCards: string[]): {
        value: number;
        name: string;
        bestCards: string[];
    };
    evaluateOmahaHand(holeCards: string[], communityCards: string[]): {
        value: number;
        name: string;
        bestCards: string[];
    };
    evaluateHandScores(players: PlayerHand[], communityCards: string[]): {
        seat: number;
        score: number;
        handDescription: string;
        winningCards: string[];
    }[];
}
export {};
