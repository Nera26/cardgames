import React from 'react';
import { cn } from '@/lib/utils';
import { Card as CardType } from '@/types/game';
import { useUI } from '@/contexts/UIContext';

interface CardProps {
    card: CardType;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    isHighlighted?: boolean;
    isCommunity?: boolean;
}

export const Card: React.FC<CardProps> = ({
    card,
    className,
    size = 'md',
    isHighlighted = false,
    isCommunity = false,
}) => {
    const { rank, suit, isFaceUp } = card;
    const { useFourColorDeck } = useUI();

    // 🟣 4-Color Deck: clubs → emerald, diamonds → blue
    const suitTextColor: Record<string, string> = useFourColorDeck
        ? { spades: 'text-black', hearts: 'text-red-500', clubs: 'text-emerald-600', diamonds: 'text-blue-600' }
        : { spades: 'text-black', hearts: 'text-red-500', clubs: 'text-black', diamonds: 'text-red-500' };

    const suitSymbol = {
        hearts: '♥',
        spades: '♠',
        diamonds: '♦',
        clubs: '♣',
    }[suit];

    const sizeClasses = {
        sm: 'w-10 h-14 text-sm rounded-lg',      // Was w-9 h-12
        md: 'w-14 h-20 text-base rounded-lg',     // Was w-12 h-16, now bigger
        lg: 'w-20 h-28 text-2xl rounded-xl',      // Was w-16 h-22, now much bigger
    };

    // Card back (face down)
    if (!isFaceUp) {
        return (
            <div
                className={cn(
                    'relative overflow-hidden',
                    'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950',
                    'border-2 border-blue-700',
                    'shadow-lg shadow-blue-900/50',
                    sizeClasses[size],
                    className
                )}
            >
                {/* Card back pattern */}
                <div className="absolute inset-1 rounded border border-blue-600/50 bg-gradient-to-br from-blue-700/20 to-transparent" />
                <div className="absolute inset-2 rounded border border-blue-500/30" />
                {/* Center diamond pattern */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-4 h-4 bg-blue-400 rotate-45 rounded-sm" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative overflow-hidden',
                'bg-gradient-to-br from-white to-gray-100',
                'border-2',
                'flex items-center justify-center font-bold',
                'transition-all duration-300',
                suitTextColor[suit] || 'text-black',
                isHighlighted
                    ? 'border-accent-yellow/50 shadow-lg shadow-accent-yellow/30'
                    : 'border-gray-300 shadow-lg shadow-black/30',
                isCommunity && 'animate-shimmer',
                sizeClasses[size],
                className
            )}
        >
            {/* Card content */}
            <div className="flex flex-col items-center -space-y-0.5">
                <span className="font-black tracking-tighter">{rank}</span>
                <span className={cn(
                    'leading-none',
                    size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-sm' : 'text-lg'
                )}>
                    {suitSymbol}
                </span>
            </div>

            {/* Shimmer overlay for community cards */}
            {isCommunity && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer-slide" />
            )}

            {/* Highlight glow */}
            {isHighlighted && (
                <div className="absolute inset-0 bg-gradient-to-t from-accent-yellow/10 to-transparent pointer-events-none" />
            )}
        </div>
    );
};
