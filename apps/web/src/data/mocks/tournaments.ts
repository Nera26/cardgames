export interface Tournament {
    id: number;
    name: string;
    buyIn: number | string;
    fee: number;
    status: 'Registering' | 'Running' | 'Completed';
    players: string;
    type: string;
    prizePool: string;
    isRegistered?: boolean;
}

export const TOURNAMENTS: Tournament[] = [
    { id: 1, name: "Sunday Million", buyIn: 50, fee: 5, status: "Registering", players: "150/500", type: "Hold'em", prizePool: "$1,000,000 GTD" },
    { id: 2, name: "Omaha High Roller", buyIn: 100, fee: 10, status: "Running", players: "45/100", type: "Omaha", prizePool: "$500,000 GTD" },
    { id: 3, name: "Daily Speed", buyIn: 10, fee: 1, status: "Completed", players: "200/200", type: "Hold'em", prizePool: "$5,000 GTD" },
    { id: 4, name: "Short Deck Frenzy", buyIn: 25, fee: 2, status: "Registering", players: "12/100", type: "Short Deck", prizePool: "$10,000 GTD" },
    { id: 5, name: "Micro Millions", buyIn: 2, fee: 0.20, status: "Registering", players: "500/1000", type: "Hold'em", prizePool: "$2,500 GTD" },
    { id: 6, name: "Bounty Hunter", buyIn: 30, fee: 3, status: "Running", players: "88/200", type: "Hold'em", prizePool: "$25,000 GTD" },
    { id: 7, name: "Daily Freeroll Frenzy", buyIn: "Free", fee: 0, status: "Registering", players: "850/2000", type: "Hold'em", prizePool: "$500 GTD", isRegistered: true },
    { id: 8, name: "Main Event Satellite", buyIn: 5, fee: 0.50, status: "Registering", players: "45/100", type: "Hold'em", prizePool: "20 Seats GTD" },
];
