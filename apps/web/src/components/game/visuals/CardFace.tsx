'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useUI } from '@/contexts/UIContext';

// ============================================================
// CLEAN SVG SUIT ICONS — Crisp vector paths with currentColor
// ============================================================

const SuitSVG: Record<string, React.FC<{ className?: string; size?: number }>> = {
    hearts: ({ className, size = 24 }) => (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="currentColor">
            <path d="M50 88C50 88 10 58 10 32C10 18 20 8 33 8C42 8 48 14 50 18C52 14 58 8 67 8C80 8 90 18 90 32C90 58 50 88 50 88Z" />
        </svg>
    ),
    diamonds: ({ className, size = 24 }) => (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="currentColor">
            <path d="M50 5L85 50L50 95L15 50Z" />
        </svg>
    ),
    clubs: ({ className, size = 24 }) => (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="currentColor">
            {/* Three distinct circular lobes */}
            <circle cx="50" cy="28" r="20" />
            <circle cx="27" cy="55" r="20" />
            <circle cx="73" cy="55" r="20" />
            {/* Flared stem */}
            <polygon points="38,88 62,88 54,55 46,55" />
        </svg>
    ),
    spades: ({ className, size = 24 }) => (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="currentColor">
            <path d="M50 6C50 6 14 38 14 58C14 70 22 78 32 76C38 74 42 70 44 64C42 72 42 78 42 78L58 78C58 78 58 72 56 64C58 70 62 74 68 76C78 78 86 70 86 58C86 38 50 6 50 6Z" />
        </svg>
    ),
};

// ============================================================
// SIZE CONFIGURATIONS — Larger, cleaner proportions
// ============================================================

const sizeConfig = {
    sm: {
        width: 48,
        height: 68,
        rank: 'text-[18px]',
        cornerSuit: 10,
        centerSuit: 44,
        cornerOffset: { top: 3, left: 4 },
        radius: 'rounded-lg',
    },
    md: {
        width: 58,
        height: 82,
        rank: 'text-[22px]',
        cornerSuit: 12,
        centerSuit: 56,
        cornerOffset: { top: 4, left: 5 },
        radius: 'rounded-lg',
    },
    lg: {
        width: 76,
        height: 106,
        rank: 'text-[30px]',
        cornerSuit: 15,
        centerSuit: 76,
        cornerOffset: { top: 5, left: 6 },
        radius: 'rounded-xl',
    },
};

// ============================================================
// CARD FACE COMPONENT — S-Tier Premium Design
// ============================================================

interface CardFaceProps {
    rank: string;
    suit: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const CardFace: React.FC<CardFaceProps> = ({
    rank,
    suit,
    size = 'md',
    className,
}) => {
    const config = sizeConfig[size];
    const { useFourColorDeck } = useUI();

    // 🟣 4-Color Deck: clubs → emerald, diamonds → blue
    const suitColor: Record<string, string> = useFourColorDeck
        ? {
            spades: 'text-gray-900',
            hearts: 'text-red-600',
            clubs: 'text-emerald-600',
            diamonds: 'text-blue-600',
        }
        : {
            spades: 'text-gray-900',
            hearts: 'text-red-600',
            clubs: 'text-gray-900',
            diamonds: 'text-red-600',
        };

    const color = suitColor[suit] || 'text-gray-900';
    const SuitIcon = SuitSVG[suit];

    // Display rank — convert 'T' to '10'
    const displayRank = rank === 'T' ? '10' : rank;

    return (
        <div
            className={cn(
                'relative overflow-hidden select-none',
                // Premium depth: gradient bg + inner ring + multi-layer shadow
                'bg-gradient-to-b from-white to-gray-50/80',
                'ring-1 ring-black/5',
                config.radius,
                'shadow-[0_2px_8px_rgba(0,0,0,0.25),0_4px_16px_rgba(0,0,0,0.15)]',
                className
            )}
            style={{
                width: config.width,
                height: config.height,
            }}
        >
            {/* ── TOP-LEFT CORNER INDEX ── */}
            <div className={cn(
                'absolute top-1 left-1.5 flex flex-col items-center leading-none',
                color,
            )}>
                <span className={cn(
                    'font-bold font-serif leading-none',
                    config.rank,
                    displayRank === '10' && 'tracking-[-0.08em]',
                )}>
                    {displayRank}
                </span>
                <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                    {SuitIcon && <SuitIcon size={16} />}
                </div>
            </div>

            {/* ── BOTTOM-RIGHT CORNER INDEX (rotated 180°) ── */}
            <div className={cn(
                'absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180',
                color,
            )}>
                <span className={cn(
                    'font-bold font-serif leading-none',
                    config.rank,
                    displayRank === '10' && 'tracking-[-0.08em]',
                )}>
                    {displayRank}
                </span>
                <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                    {SuitIcon && <SuitIcon size={16} />}
                </div>
            </div>

            {/* ── CENTER GHOST WATERMARK ── */}
            <div className={cn(
                'absolute inset-0 flex items-center justify-center',
                color,
                'opacity-[0.08]',
            )}>
                {SuitIcon && <SuitIcon size={config.centerSuit} />}
            </div>
        </div>
    );
};

// ============================================================
// CARD BACK — Clean & Elegant
// ============================================================

interface CardBackProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const CardBack: React.FC<CardBackProps> = ({
    size = 'md',
    className,
}) => {
    const config = sizeConfig[size];

    return (
        <div
            className={cn(
                'relative overflow-hidden',
                'bg-gradient-to-br from-[#1a3a5c] via-[#1e4d7b] to-[#163252]',
                'border border-[#2a5a8a]/60',
                config.radius,
                'shadow-[0_2px_8px_rgba(0,0,0,0.25),0_4px_16px_rgba(0,0,0,0.15)]',
                className
            )}
            style={{
                width: config.width,
                height: config.height,
            }}
        >
            {/* Outer frame */}
            <div className="absolute inset-[3px] rounded-md border border-white/10" />

            {/* Inner frame */}
            <div className="absolute inset-[5px] rounded-sm border border-white/[0.06]" />

            {/* Diamond lattice pattern */}
            <div
                className="absolute inset-[6px] opacity-[0.15]"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 3px,
                        rgba(255,255,255,0.15) 3px,
                        rgba(255,255,255,0.15) 3.5px
                    ), repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 3px,
                        rgba(255,255,255,0.15) 3px,
                        rgba(255,255,255,0.15) 3.5px
                    )`,
                }}
            />

            {/* Center diamond */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-white/15 rotate-45 rounded-[1px]" />
            </div>

            {/* Top sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
        </div>
    );
};
