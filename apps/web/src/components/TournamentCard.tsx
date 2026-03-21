import React from 'react';
import { GlassCard } from "@/components/ui/GlassCard";

interface TournamentCardProps {
    name: string;
    buyInText: string | number;
    feeText?: string | number;
    prizePool: string;
    players: string;
    isRegistered?: boolean;
    onRegister?: () => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
    name,
    buyInText,
    feeText,
    prizePool,
    players,
    isRegistered = false,
    onRegister
}) => {
    // Determine if it's a Free tournament
    const isFree = buyInText === "Free" || buyInText === 0;

    // Helper to format buy-in
    const displayBuyIn = isFree ? (
        <span className="text-[#FFD700] font-semibold">Free</span>
    ) : (
        <>
            <span className="text-[#FFD700] font-semibold">${buyInText}</span> {feeText ? `(Fee: $${feeText})` : ''}
        </>
    );

    return (
        <GlassCard className="h-full">
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                    {name}
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-1">
                    Buy-in: {displayBuyIn}
                </p>
                <p className="text-gray-400 text-sm sm:text-base mb-1">
                    Prize Pool: <span className="text-success font-bold">{prizePool}</span>
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">
                    Players: <span className="text-gray-200 font-semibold">{players}</span>
                </p>
            </div>

            {/* Action Button */}
            {isRegistered ? (
                <button
                    onClick={onRegister}
                    className="w-full border border-gold-500/30 text-gold-500 font-bold py-3 rounded-xl hover:bg-gold-500/10 transition-all duration-200 text-sm sm:text-base uppercase tracking-wider"
                >
                    Registered
                </button>
            ) : (
                <button
                    onClick={onRegister}
                    className="w-full bg-gold-gradient text-[#0B0E14] font-bold py-3 rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 text-sm sm:text-base uppercase tracking-wider transform active:scale-95"
                >
                    Register Now
                </button>
            )}
        </GlassCard>
    );
};

export default TournamentCard;
