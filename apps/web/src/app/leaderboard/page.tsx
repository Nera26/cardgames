"use client";

import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { LeaderboardPlayerDto, LeaderboardTimeframe, GameMode } from '@poker/shared';
import { PlayerDetailModal } from '@/components/leaderboard/PlayerDetailModal';
import { getAvatarUrl } from '@/config/avatars';

// Map filter state to enum values
const TIMEFRAME_MAP: Record<string, LeaderboardTimeframe> = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
};

const GAMEMODE_MAP: Record<string, GameMode> = {
    cash: 'CASH',
    tournament: 'TOURNAMENT',
};

export default function LeaderboardPage() {
    const { user } = useGame();
    const [timeFilter, setTimeFilter] = useState('daily');
    const [gameType, setGameType] = useState('cash');
    const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayerDto | null>(null);

    // Live data from Blue Cable
    const { players, isLoading, error, refetch } = useLeaderboard({
        timeframe: TIMEFRAME_MAP[timeFilter],
        gameMode: GAMEMODE_MAP[gameType],
        page: 1,
        limit: 50,
    });

    // Tier Icon Helper
    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'DIAMOND': return <i className="fa-solid fa-gem text-blue-400 mr-1"></i>;
            case 'PLATINUM': return <i className="fa-solid fa-gem text-cyan-400 mr-1"></i>;
            case 'GOLD': return <i className="fa-solid fa-medal text-accent-yellow mr-1"></i>;
            case 'SILVER': return <i className="fa-solid fa-medal text-gray-400 mr-1"></i>;
            case 'BRONZE': return <i className="fa-solid fa-medal text-yellow-800 mr-1"></i>;
            default: return null;
        }
    };

    const getTierTitle = (tier: string) => {
        switch (tier) {
            case 'DIAMOND': return 'Diamond Tier: Top 1% of players.';
            case 'PLATINUM': return 'Platinum Tier: Top 2–5%.';
            case 'GOLD': return 'Gold Tier: Top 6–15%.';
            case 'SILVER': return 'Silver Tier: Top 16–30%.';
            case 'BRONZE': return 'Bronze Tier: Top 31–50%.';
            default: return '';
        }
    };

    const getTierLabel = (tier: string) => {
        return tier.charAt(0) + tier.slice(1).toLowerCase();
    };

    // Check if a row is the current user
    const isCurrentUser = (p: LeaderboardPlayerDto) => user && p.userId === user.id;

    // Avatar URL helper — uses project's canonical getAvatarUrl()
    const getAvatarSrc = (p: LeaderboardPlayerDto) => getAvatarUrl(p.avatarId, p.avatarUrl);

    // Skeleton rows for loading state
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4"><div className="h-4 bg-hover-bg rounded w-8"></div></td>
            <td className="px-6 py-4 flex items-center">
                <div className="h-10 w-10 rounded-full bg-hover-bg mr-3"></div>
                <div className="h-4 bg-hover-bg rounded w-24"></div>
            </td>
            <td className="px-6 py-4"><div className="h-4 bg-hover-bg rounded w-20"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-hover-bg rounded w-12"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-hover-bg rounded w-12"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-hover-bg rounded w-16"></div></td>
        </tr>
    );

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:py-32px">
            {/* TITLE & DESCRIPTION */}
            <section className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Leaderboard</h1>
                <p className="text-text-secondary text-sm sm:text-base">See who's crushing the tables in real time!</p>
            </section>

            {/* FILTERS */}
            <section className="mb-8 bg-card-bg rounded-2xl p-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0">
                    {/* Time Filters */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Time Period:</label>
                        <div className="flex space-x-2">
                            {['daily', 'weekly', 'monthly'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setTimeFilter(filter)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${timeFilter === filter ? 'active-filter-tab bg-accent-yellow text-primary-bg hover-glow-yellow' : 'bg-hover-bg text-text-secondary hover:text-accent-yellow hover:brightness-110'}`}
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Game Mode Filters */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Game Mode:</label>
                        <div className="flex space-x-2">
                            {['cash', 'tournament'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setGameType(mode)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${gameType === mode ? 'active-filter-tab bg-accent-yellow text-primary-bg hover-glow-yellow' : 'bg-hover-bg text-text-secondary hover:text-accent-yellow hover:brightness-110'}`}
                                >
                                    {mode === 'cash' ? 'Cash Game' : 'Tournament'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <div className="ml-auto">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="flex items-center space-x-2 bg-accent-blue text-primary-bg font-semibold px-4 py-2 rounded-xl hover:brightness-110 hover-glow-green transition-all duration-200 text-sm disabled:opacity-50"
                        >
                            <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'animate-spin' : ''}`}></i>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ERROR STATE */}
            {error && (
                <section className="mb-6 bg-red-900/30 border border-red-500/50 rounded-2xl p-4 text-center">
                    <p className="text-red-400 text-sm">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                        {error}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-2 text-accent-yellow text-sm underline hover:brightness-110"
                    >
                        Try Again
                    </button>
                </section>
            )}

            {/* LEADERBOARD TABLE */}
            <section id="leaderboard-table-section" className="bg-card-bg rounded-2xl p-6 shadow-md">
                <div className="overflow-x-auto">
                    <table id="leaderboard-table" className="min-w-full divide-y divide-border-dark">
                        <thead className="bg-hover-bg">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">Player</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">Winnings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">Games Played</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">Win Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">Tier</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-body" className="divide-y divide-border-dark">
                            {isLoading ? (
                                // Loading Skeleton
                                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : players.length > 0 ? (
                                players.map((p) => {
                                    const isCurrent = isCurrentUser(p);
                                    const rowClass = isCurrent
                                        ? 'bg-hover-bg border-l-4 border-accent-yellow font-bold text-text-primary'
                                        : 'hover:bg-hover-bg transition-colors duration-150';

                                    return (
                                        <tr key={p.userId} className={`${rowClass} cursor-pointer`} onClick={() => setSelectedPlayer(p)}>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-accent-yellow">{p.rank}</td>
                                            <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                                <img src={getAvatarSrc(p)} alt={p.username} className={`h-10 w-10 rounded-full mr-3 border-2 ${isCurrent ? 'border-accent-yellow' : 'border-transparent'}`} onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(p.avatarId); }} />
                                                <span className="text-sm">{p.username}{isCurrent ? ' (You)' : ''}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-accent-green">${p.totalWinnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{p.gamesPlayed}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{p.winRate}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary tooltip">
                                                <span className="flex items-center">
                                                    {getTierIcon(p.tier)}
                                                    {getTierLabel(p.tier)}
                                                </span>
                                                <span className="tooltip-text">{getTierTitle(p.tier)}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center text-text-secondary text-sm py-6">
                                        No players found for this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* PLAYER DETAIL MODAL */}
            {selectedPlayer && (
                <PlayerDetailModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    gameType={gameType}
                />
            )}
        </main>
    );
}
