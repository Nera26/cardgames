export interface GameHistoryItem {
    id: string;
    tableName: string;
    stakes: string;
    buyIn: string;
    date: string;
    profit: string; // pre-formatted for now to match UI, or number
    isProfit: boolean;
    replayId: string;
}

export interface TournamentHistoryItem {
    id: string;
    name: string;
    placement: string;
    buyIn: string;
    prize: string;
    duration: string;
    bracketId: string;
}

export interface TransactionHistoryItem {
    id: string;
    date: string;
    type: 'Deposit' | 'Cashout' | 'Bonus';
    amount: string;
    isPositive: boolean; // green vs red
    status: 'COMPLETED' | 'FAILED' | 'PENDING';
    notes?: string;
}

export const PROFILE_STATS = {
    handsPlayed: '10,582',
    winRate: '58.3%',
    tournamentsPlayed: '127',
    top3Placement: '32.5%'
};

export const GAME_HISTORY: GameHistoryItem[] = [
    {
        id: '1',
        tableName: "Texas Hold'em – Table #12463",
        stakes: "$2/$5",
        buyIn: "$500",
        date: "May 15, 2023 – 2:30 PM",
        profit: "+$234.50",
        isProfit: true,
        replayId: "Table #12463"
    },
    {
        id: '2',
        tableName: "Omaha Hi/Lo – Table #12445",
        stakes: "$5/$10",
        buyIn: "$1000",
        date: "May 14, 2023 – 8:15 PM",
        profit: "–$156.75",
        isProfit: false,
        replayId: "Table #12445"
    }
];

export const TOURNAMENT_HISTORY: TournamentHistoryItem[] = [
    {
        id: '1',
        name: "Sunday Million",
        placement: "5th",
        buyIn: "$215",
        prize: "$1,234",
        duration: "4h 12m",
        bracketId: "Sunday Million"
    },
    {
        id: '2',
        name: "High Roller",
        placement: "2nd",
        buyIn: "$1,050",
        prize: "$25,000",
        duration: "3h 45m",
        bracketId: "High Roller"
    }
];

export const TRANSACTION_HISTORY: TransactionHistoryItem[] = [
    {
        id: '1',
        date: "May 16, 2023",
        type: "Deposit",
        amount: "+$500.00",
        isPositive: true,
        status: "COMPLETED"
    },
    {
        id: '2',
        date: "May 14, 2023",
        type: "Cashout",
        amount: "–$200.00",
        isPositive: false,
        status: "FAILED",
        notes: "Insufficient funds"
    },
    {
        id: '3',
        date: "May 10, 2023",
        type: "Bonus",
        amount: "+$50.00",
        isPositive: true,
        status: "COMPLETED"
    }
];
