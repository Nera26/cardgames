'use client';

import { ACTIVE_TABLES } from '@/data/mocks/activeTables';

export default function ActiveTables() {
    const getPlayerColor = (players: number, maxPlayers: number): string => {
        if (players === maxPlayers) return 'text-accent-green';
        if (players >= maxPlayers * 0.5) return 'text-accent-yellow';
        return 'text-text-secondary';
    };

    return (
        <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">Active Tables</h3>
            <div className="space-y-3">
                {ACTIVE_TABLES.map((table) => (
                    <div key={table.id} className="p-3 bg-primary-bg rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{table.name}</span>
                            <span className={`text-sm font-bold ${getPlayerColor(table.players, table.maxPlayers)}`}>
                                {table.players}/{table.maxPlayers}
                            </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">
                            {table.gameType} • {table.stakes}
                        </p>
                        <div className="flex gap-2">
                            <button className="bg-accent-blue hover:bg-blue-600 px-3 py-1 rounded text-xs font-semibold transition-colors">
                                Config
                            </button>
                            <button className="bg-danger-red hover:bg-red-600 px-3 py-1 rounded text-xs font-semibold transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 bg-accent-green hover:bg-green-600 py-2 rounded-xl font-semibold transition-colors">
                Create New Table
            </button>
        </div>
    );
}
