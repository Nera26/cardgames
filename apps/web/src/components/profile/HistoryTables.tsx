import React from 'react';
import { GameHistoryItem, TournamentHistoryItem, TransactionHistoryItem } from '@/data/mocks/userProfile';

// --- Game History Table ---
interface GameHistoryListProps {
    games: GameHistoryItem[];
    onReplay: (replayId: string) => void;
}

export const GameHistoryList: React.FC<GameHistoryListProps> = ({ games, onReplay }) => {
    return (
        <div className="space-y-4">
            {games.map((game) => (
                <div key={game.id} className="border-b border-border-dark pb-4 flex justify-between items-start">
                    <div>
                        <p className="font-medium">{game.tableName}</p>
                        <p className="text-text-secondary text-sm">Stakes: {game.stakes} – Buy-in: {game.buyIn}</p>
                        <p className="text-text-secondary text-xs mt-1">{game.date}</p>
                    </div>
                    <div className="text-right">
                        <p className={`font-semibold ${game.isProfit ? 'text-accent-green' : 'text-danger-red'}`}>
                            {game.profit}
                        </p>
                        <button
                            onClick={() => onReplay(game.replayId)}
                            className="text-accent-yellow text-sm hover:text-accent-blue mt-2"
                        >
                            <i className="fa-solid fa-play mr-1"></i>Watch Replay
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Tournament History Table ---
interface TournamentHistoryTableProps {
    tournaments: TournamentHistoryItem[];
    onViewBracket: (bracketId: string) => void;
}

export const TournamentHistoryTable: React.FC<TournamentHistoryTableProps> = ({ tournaments, onViewBracket }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
                <thead>
                    <tr className="text-accent-yellow uppercase text-xs">
                        <th className="px-4 py-3">Tournament Name</th>
                        <th className="px-4 py-3">Placement</th>
                        <th className="px-4 py-3">Buy-in</th>
                        <th className="px-4 py-3">Prize</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {tournaments.map((trn) => (
                        <tr key={trn.id} className="border-b border-border-dark hover:bg-hover-bg transition-colors duration-200">
                            <td className="px-4 py-3">{trn.name}</td>
                            <td className="px-4 py-3">{trn.placement}</td>
                            <td className="px-4 py-3">{trn.buyIn}</td>
                            <td className="px-4 py-3">{trn.prize}</td>
                            <td className="px-4 py-3">{trn.duration}</td>
                            <td className="px-4 py-3">
                                <button
                                    onClick={() => onViewBracket(trn.bracketId)}
                                    className="text-accent-yellow hover:underline text-sm font-medium"
                                >
                                    View Bracket
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Transaction History Table ---
interface TransactionHistoryTableProps {
    transactions: TransactionHistoryItem[];
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({ transactions }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
                <thead>
                    <tr className="text-accent-yellow uppercase text-xs">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-border-dark hover:bg-hover-bg transition-colors duration-200">
                            <td className="px-4 py-3">{txn.date}</td>
                            <td className="px-4 py-3 text-text-primary">{txn.type}</td>
                            <td className={`px-4 py-3 font-semibold ${txn.isPositive ? 'text-accent-green' : 'text-danger-red'}`}>
                                {txn.amount}
                            </td>
                            <td className="px-4 py-3 tooltip cursor-pointer relative group">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${txn.status === 'COMPLETED' ? 'bg-accent-green/20 text-accent-green' :
                                        txn.status === 'FAILED' ? 'bg-danger-red/20 text-danger-red' :
                                            'bg-accent-yellow/20 text-accent-yellow'
                                    }`}>
                                    {txn.status}
                                </span>
                                {txn.notes && (
                                    <span className="tooltip-text group-hover:visible group-hover:opacity-100">{txn.notes}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
