export interface Table {
    id: string;
    name: string;
    gameType: string;
    stakes: string;
    players: number;
    maxPlayers: number;
}

export const ACTIVE_TABLES: Table[] = [
    { id: '45821', name: 'Table #45821', gameType: "NL Hold'em", stakes: '$1/$2', players: 9, maxPlayers: 9 },
    { id: '45822', name: 'Table #45822', gameType: "NL Hold'em", stakes: '$2/$5', players: 6, maxPlayers: 9 },
];
