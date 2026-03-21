import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChipStack } from './ChipStack';
import { useUI, TableSkin } from '@/contexts/UIContext';
import { APP_NAME, TABLE_NOISE_SVG } from '@/constants/appKeywords';

interface TableLayoutProps {
    children: React.ReactNode;      // Community cards, etc. (inside felt)
    playerChildren?: React.ReactNode; // Players (on the rail, outside felt)
    potAmount: number;
    previousPotAmount?: number;
}

// ═══════════════════════════════════════════════════════
// S-GRADE FELT STYLES — synchronized with PokerTable.tsx
// Multi-stop radial gradients with 3D padded-felt depth
// ═══════════════════════════════════════════════════════
const SKIN_COLORS: Record<TableSkin, { background: string; boxShadow: string }> = {
    green: {
        background: 'radial-gradient(ellipse at 50% 35%, #2d7a4f 0%, #1a5c38 25%, #0f3d25 55%, #071f13 100%)',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
    },
    blue: {
        background: 'radial-gradient(ellipse at 50% 35%, #1e4a8a 0%, #163872 25%, #0e2554 55%, #060e2a 100%)',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
    },
    red: {
        background: 'radial-gradient(ellipse at 50% 35%, #8b2030 0%, #6b1525 25%, #4a0e1a 55%, #1a0508 100%)',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
    },
    midnight: {
        background: 'radial-gradient(ellipse at 50% 35%, #2a2d3a 0%, #1a1d28 25%, #10121a 55%, #050608 100%)',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)',
    },
};

// Watermark text color per skin for optimal contrast
const WATERMARK_COLOR: Record<TableSkin, string> = {
    green: 'rgba(255,255,255,0.06)',
    blue: 'rgba(180,200,255,0.06)',
    red: 'rgba(255,180,180,0.05)',
    midnight: 'rgba(200,210,230,0.04)',
};

export const TableLayout: React.FC<TableLayoutProps> = ({
    children,
    playerChildren,
    potAmount,
    previousPotAmount,
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const { tableSkin } = useUI();

    useEffect(() => {
        if (previousPotAmount !== undefined && potAmount > previousPotAmount) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 600);
            return () => clearTimeout(timer);
        }
    }, [potAmount, previousPotAmount]);

    return (
        // Main Table Container - players can overflow this
        <div className="relative w-full h-full rounded-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] z-10">

            {/* LAYER 1: The Rail - Dark leather/walnut container */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#3e2c26] to-[#251a16] shadow-xl border-b-4 border-black/40" />

            {/* LAYER 2: The Felt - Sunken inside the rail */}
            <div
                className={cn(
                    'absolute inset-4 sm:inset-5 lg:inset-6 rounded-full',
                    'flex items-center justify-center',
                    'border border-white/5'
                    // NO overflow-hidden - allows content to peek out if needed
                )}
                style={{
                    background: (SKIN_COLORS[tableSkin] || SKIN_COLORS.green).background,
                    boxShadow: (SKIN_COLORS[tableSkin] || SKIN_COLORS.green).boxShadow,
                    transition: 'background 0.5s ease-in-out, box-shadow 0.5s ease-in-out',
                }}
            >
                {/* Felt texture overlay */}
                <div
                    className="absolute inset-0 rounded-full opacity-[0.12] mix-blend-overlay pointer-events-none"
                    style={{
                        backgroundImage: `url("${TABLE_NOISE_SVG}")`,
                    }}
                />

                {/* Subtle center logo watermark — adaptive per skin */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span
                        className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-widest"
                        style={{
                            color: WATERMARK_COLOR[tableSkin] || WATERMARK_COLOR.green,
                            transition: 'color 0.5s ease-in-out',
                        }}
                    >
                        {APP_NAME}
                    </span>
                </div>

                {/* Pot Display */}
                <div className={cn(
                    'absolute top-[26%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10',
                    'flex flex-col items-center'
                )}>
                    <div className="relative mb-2">
                        <ChipStack potAmount={potAmount} />
                    </div>

                    <div className={cn(
                        'relative px-6 sm:px-8 py-2 sm:py-2.5 rounded-full',
                        'bg-black/50 backdrop-blur-sm',
                        'border border-white/10',
                        'shadow-lg',
                        isAnimating && 'animate-pot-increase'
                    )}>
                        <div className="relative text-center flex items-center gap-2">
                            <span className="text-[10px] sm:text-xs text-white/50 font-medium uppercase tracking-wider">
                                Pot
                            </span>
                            <span className={cn(
                                'text-lg sm:text-2xl lg:text-3xl font-bold text-white',
                                isAnimating && 'animate-number-pop'
                            )}>
                                ${potAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table Content - Community Cards (inside felt) */}
                <div className="absolute inset-0 z-10">
                    {children}
                </div>
            </div>

            {/* LAYER 3: Players - On the rail, can overflow the container */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="relative w-full h-full pointer-events-auto">
                    {playerChildren}
                </div>
            </div>
        </div>
    );
};
