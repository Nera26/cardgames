import React from 'react';
import { LeaderboardPlayerDto } from '@poker/shared';
import { getAvatarUrl } from '@/config/avatars';

interface PlayerDetailModalProps {
    player: LeaderboardPlayerDto;
    onClose: () => void;
    gameType: string;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, onClose, gameType }) => {
    const getTierLabel = (tier: string) => tier.charAt(0) + tier.slice(1).toLowerCase();

    const avatarSrc = getAvatarUrl(player.avatarId, player.avatarUrl);

    return (
        <div id="player-modal" className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] fade-in-modal">
            <div className="bg-card-bg rounded-2xl p-6 md:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 opacity-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{player.username}</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-accent-yellow text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <img src={avatarSrc} alt={player.username} className="h-16 w-16 rounded-full border-2 border-accent-yellow" onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(player.avatarId); }} />
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">{player.username}</h3>
                            <p className="text-text-secondary text-sm mb-1">{getTierLabel(player.tier)} Tier</p>
                            <p className="text-text-secondary text-sm">Winnings: <span className="font-semibold text-accent-green">${player.totalWinnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-hover-bg rounded-xl p-3 text-center">
                            <p className="text-accent-yellow text-lg font-bold">{player.gamesPlayed}</p>
                            <p className="text-text-secondary text-xs">Games Played</p>
                        </div>
                        <div className="bg-hover-bg rounded-xl p-3 text-center">
                            <p className="text-accent-green text-lg font-bold">{player.winRate}%</p>
                            <p className="text-text-secondary text-xs">Win Rate</p>
                        </div>
                        <div className="bg-hover-bg rounded-xl p-3 text-center">
                            <p className="text-accent-yellow text-lg font-bold">{player.gamesWon}</p>
                            <p className="text-text-secondary text-xs">Games Won</p>
                        </div>
                        <div className="bg-hover-bg rounded-xl p-3 text-center">
                            <p className="text-text-primary text-lg font-bold">#{player.rank}</p>
                            <p className="text-text-secondary text-xs">Current Rank</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-semibold text-text-primary mb-2">Game Mode</h4>
                        <p className="text-text-secondary text-sm">
                            {gameType === 'cash' ? '🃏 Cash Games' : '🏆 Tournaments'}
                        </p>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="bg-accent-yellow text-primary-bg font-semibold py-2 px-4 rounded-xl hover:brightness-110 hover-glow-yellow transition-all duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
