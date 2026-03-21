import React from 'react';
import { GlassCard } from "@/components/ui/GlassCard";

interface CashGameCardProps {
    tableName?: string;
    name?: string;
    blinds?: string;
    stakes?: string;
    minBuyIn?: number;
    buyInMin?: number;
    maxBuyIn?: number;
    buyInMax?: number;
    currentPlayers?: number;
    maxPlayers?: number;
    players?: string;
    isWaitlist?: boolean;
    variant?: 'TEXAS_HOLDEM' | 'OMAHA' | 'ALL_IN_OR_FOLD';
    // Restored props for overlay
    handsPerHour?: number;
    avgPot?: string;
    rake?: string;
    created?: string;
}

const CashGameCard: React.FC<CashGameCardProps> = ({
    tableName, name,
    blinds, stakes,
    minBuyIn, buyInMin,
    maxBuyIn, buyInMax,
    currentPlayers, maxPlayers, players,
    isWaitlist, variant,
    handsPerHour, avgPot, rake, created
}) => {
    // Normalize props
    const displayName = tableName || name || "Table";
    const displayStakes = blinds || stakes || "$1/$2";
    const displayMinBuyIn = minBuyIn || buyInMin || 0;
    const displayMaxBuyIn = maxBuyIn || buyInMax || 0;

    // Logic: If table is full, show "WAITLIST" (Blue). Otherwise "JOIN TABLE" (Green).
    let isFull = false;
    let playersDisplay = "";

    if (currentPlayers !== undefined && maxPlayers !== undefined) {
        isFull = currentPlayers >= maxPlayers;
        playersDisplay = `${currentPlayers}/${maxPlayers}`;
    } else if (players) {
        const parts = players.split('/');
        if (parts.length === 2) {
            isFull = parseInt(parts[0]) >= parseInt(parts[1]);
        }
        playersDisplay = players;
    }

    // Override if isWaitlist prop explicitly passed
    if (isWaitlist !== undefined) isFull = isWaitlist;

    return (
        <GlassCard className="h-full">

            {/* Hover Overlay Tooltip (Restored) */}
            <div className="absolute inset-0 bg-black bg-opacity-90 rounded-2xl p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex flex-col justify-center pointer-events-none">

                <div className="text-sm text-[#bfbfbf] space-y-1">
                    {handsPerHour && <p>Hands/hour: <span className="text-[#FFD700]">{handsPerHour}</span></p>}
                    {avgPot && <p>Avg Pot: <span className="text-[#1c8b4c]">{avgPot}</span></p>}
                    {rake && <p>Rake: <span className="text-white">{rake}</span></p>}
                    {created && <p>Created: <span className="text-white">{created}</span></p>}
                </div>
            </div>

            <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center">
                    {displayName}
                    {variant === 'OMAHA' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/30 uppercase tracking-widest">
                            Omaha
                        </span>
                    )}
                    {variant === 'ALL_IN_OR_FOLD' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/30 uppercase tracking-widest">
                            AoF
                        </span>
                    )}
                </h3>
                <div className="flex justify-between items-center text-[#bfbfbf] text-sm sm:text-base mb-3">
                    <span>
                        Stakes: <span className="text-[#FFD700] font-semibold">{displayStakes}</span>
                    </span>
                    <span>
                        Players: <span className="text-white font-semibold">{playersDisplay}</span>
                    </span>
                </div>
                <p className="text-[#bfbfbf] text-xs sm:text-sm mb-4">
                    Buy-in: <span className="text-white font-semibold">${displayMinBuyIn} - ${displayMaxBuyIn}</span>
                </p>
            </div>

            {/* Action Button */}
            {isFull ? (
                <button
                    className="w-full bg-[#007BFF] text-white font-bold py-3 rounded-xl hover:brightness-110 transition-all duration-200 text-sm sm:text-base uppercase"
                >
                    Waitlist
                </button>
            ) : (
                <button
                    className="w-full bg-[#1c8b4c] text-white font-bold py-3 rounded-xl hover:brightness-110 hover:shadow-[0_0_15px_5px_rgba(28,139,76,0.4)] transition-all duration-200 text-sm sm:text-base uppercase"
                >
                    Join Table
                </button>
            )}
        </GlassCard>
    );
};

export default CashGameCard;
