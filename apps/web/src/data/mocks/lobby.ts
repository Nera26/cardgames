export const CASH_GAMES = [
    {
        id: 'cg1',
        name: "Ante Up Arena",
        stakes: "$1/$2",
        players: "5/9",
        buyInMin: 100,
        buyInMax: 500,
        handsPerHour: 85,
        avgPot: "$45",
        rake: "5%",
        created: "2h ago"
    },
    {
        id: 'cg2',
        name: "Bluff Master's Den",
        stakes: "$0.50/$1",
        players: "9/9",
        buyInMin: 50,
        buyInMax: 200,
        handsPerHour: 92,
        avgPot: "$28",
        rake: "5%",
        created: "4h ago",
        isWaitlist: true
    },
    {
        id: 'cg3',
        name: "River Rats Table",
        stakes: "$2/$5",
        players: "3/9",
        buyInMin: 200,
        buyInMax: 1000,
        handsPerHour: 75,
        avgPot: "$32",
        rake: "5%",
        created: "30m ago"
    },
    {
        id: 'cg4',
        name: "High Roller's Hideout",
        stakes: "$5/$10",
        players: "7/9",
        buyInMin: 500,
        buyInMax: 2000,
        handsPerHour: 120,
        avgPot: "$150",
        rake: "5%",
        created: "5h ago"
    }
];

export const FEATURED_TOURNAMENTS = [
    {
        id: 'ft1',
        name: "Weekend Warrior Special",
        buyInText: "$50",
        feeText: "$5",
        prizePool: "$10,000 GTD",
        players: "150/300"
    },
    {
        id: 'ft2',
        name: "Sunday Million Satellite",
        buyInText: "$11",
        feeText: "$5",
        prizePool: "5 Seats GTD",
        players: "80/200"
    },
    {
        id: 'ft3',
        name: "Daily Freeroll Frenzy",
        buyInText: "Free",
        prizePool: "$100",
        players: "450/1000",
        isRegistered: true
    }
];
