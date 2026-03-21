'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useUI, TableSkin } from '@/contexts/UIContext';

/**
 * PokerTable - The Dynamic Felt (Purple Cable: Local Skins)
 * 
 * A pure DOM/CSS poker table with:
 * - Stadium-shaped felt (rounded rectangle)
 * - 9 seat positions in oval orbit
 * - 5 community card slots in center
 * - Dynamic skin system powered by UIContext + localStorage
 * 
 * @see apps/web/src/app/table/test/page.tsx for test route
 */

// ═══════════════════════════════════════════════════════
// S-GRADE FELT STYLES
// Multi-stop radial gradients with 3D inner-shadow depth
// ═══════════════════════════════════════════════════════
const FELT_STYLES: Record<TableSkin, { background: string; boxShadow: string }> = {
    green: {
        background: [
            'radial-gradient(ellipse at 50% 35%,',
            '  #2d7a4f 0%,',       // bright emerald highlight center
            '  #1a5c38 25%,',      // mid emerald
            '  #0f3d25 55%,',      // deep forest
            '  #071f13 100%)',      // near-black edge vignette
        ].join(' '),
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
    },
    blue: {
        background: [
            'radial-gradient(ellipse at 50% 35%,',
            '  #1e4a8a 0%,',       // royal sapphire center
            '  #163872 25%,',      // mid navy
            '  #0e2554 55%,',      // deep indigo
            '  #060e2a 100%)',     // near-black edge vignette
        ].join(' '),
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
    },
    red: {
        background: [
            'radial-gradient(ellipse at 50% 35%,',
            '  #8b2030 0%,',       // rich crimson center
            '  #6b1525 25%,',      // deep burgundy
            '  #4a0e1a 55%,',      // dark wine
            '  #1a0508 100%)',     // near-black edge vignette
        ].join(' '),
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
    },
    midnight: {
        background: [
            'radial-gradient(ellipse at 50% 35%,',
            '  #2a2d3a 0%,',       // steel charcoal center highlight
            '  #1a1d28 25%,',      // mid slate
            '  #10121a 55%,',      // deep dark
            '  #050608 100%)',     // near-black edge vignette
        ].join(' '),
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)',
    },
};

// Watermark text color per skin for optimal contrast
const WATERMARK_COLOR: Record<TableSkin, string> = {
    green: 'rgba(255,255,255,0.08)',
    blue: 'rgba(180,200,255,0.08)',
    red: 'rgba(255,180,180,0.07)',
    midnight: 'rgba(200,210,230,0.06)',
};

// Seat positions around the oval (percentages from center)
// Positions calculated for 9-max table in clockwise order starting from bottom
const SEAT_POSITIONS = [
    { top: '85%', left: '50%' },   // Seat 0 - Bottom center (hero)
    { top: '75%', left: '15%' },   // Seat 1 - Bottom left
    { top: '45%', left: '2%' },    // Seat 2 - Left
    { top: '15%', left: '15%' },   // Seat 3 - Top left
    { top: '5%', left: '35%' },    // Seat 4 - Top left-center
    { top: '5%', left: '65%' },    // Seat 5 - Top right-center
    { top: '15%', left: '85%' },   // Seat 6 - Top right
    { top: '45%', left: '98%' },   // Seat 7 - Right
    { top: '75%', left: '85%' },   // Seat 8 - Bottom right
];

interface SeatProps {
    seatIndex: number;
    position: { top: string; left: string };
    isOccupied?: boolean;
    playerName?: string;
    stack?: number;
}

function Seat({ seatIndex, position, isOccupied = false, playerName, stack }: SeatProps) {
    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ top: position.top, left: position.left }}
        >
            <div className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-full 
                flex flex-col items-center justify-center
                transition-all duration-300
                ${isOccupied
                    ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20'
                    : 'bg-black/40 border-2 border-white/10 hover:border-white/30'
                }
            `}>
                {isOccupied ? (
                    <>
                        <span className="text-xs font-semibold text-white truncate max-w-[60px]">
                            {playerName}
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold">
                            ${stack?.toLocaleString()}
                        </span>
                    </>
                ) : (
                    <FontAwesomeIcon icon={faUser} className="text-white/30 text-lg" />
                )}
            </div>
            {/* Seat number badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/40 font-mono">
                S{seatIndex + 1}
            </div>
        </div>
    );
}

interface CardSlotProps {
    index: number;
    card?: { rank: string; suit: string };
}

function CardSlot({ index, card }: CardSlotProps) {
    return (
        <div className={`
            w-10 h-14 sm:w-12 sm:h-16 
            rounded-lg 
            flex items-center justify-center
            transition-all duration-300
            ${card
                ? 'bg-white shadow-lg'
                : 'bg-white/5 border border-dashed border-white/20'
            }
        `}>
            {card ? (
                <span className="text-lg font-bold text-black">
                    {card.rank}{card.suit}
                </span>
            ) : (
                <span className="text-white/20 text-xs">{index + 1}</span>
            )}
        </div>
    );
}

interface PokerTableProps {
    seats?: ({ name: string; stack: number } | null)[];
    communityCards?: { rank: string; suit: string }[];
    pot?: number;
}

export function PokerTable({ seats = [], communityCards = [], pot = 0 }: PokerTableProps) {
    const { tableSkin } = useUI();
    const feltStyle = FELT_STYLES[tableSkin];

    return (
        <div className="relative w-full max-w-[900px] aspect-[2/1] mx-auto select-none">
            {/* The Rail (outer border) */}
            <div className="absolute inset-0 rounded-[100px] sm:rounded-[150px] lg:rounded-[200px] border-[10px] sm:border-[12px] border-[#1a1a1f] shadow-2xl bg-gradient-to-br from-[#0a0a0c] to-[#15151a]" />

            {/* The Felt (inner surface) — dynamic skin from Purple Cable */}
            <div
                className="absolute inset-[12px] sm:inset-[16px] rounded-[90px] sm:rounded-[140px] lg:rounded-[180px]"
                style={{
                    background: feltStyle.background,
                    boxShadow: feltStyle.boxShadow,
                    transition: 'background 0.5s ease-in-out, box-shadow 0.5s ease-in-out',
                }}
            >
                {/* Felt texture overlay — vignette */}
                <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.3)_100%)]" />

                {/* Table center branding — adaptive watermark */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-4xl sm:text-6xl font-black tracking-widest"
                        style={{
                            color: WATERMARK_COLOR[tableSkin],
                            transition: 'color 0.5s ease-in-out',
                        }}
                    >
                        POKERHUB
                    </span>
                </div>
            </div>

            {/* Pot Display */}
            {pot > 0 && (
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 z-30">
                    <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-500/30">
                        <span className="text-sm font-bold text-amber-400">
                            Pot: ${pot.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}

            {/* Community Cards (The Board) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                <div className="flex gap-1.5 sm:gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <CardSlot
                            key={i}
                            index={i}
                            card={communityCards[i]}
                        />
                    ))}
                </div>
            </div>

            {/* Seats */}
            {SEAT_POSITIONS.map((position, index) => {
                const seatData = seats[index];
                return (
                    <Seat
                        key={index}
                        seatIndex={index}
                        position={position}
                        isOccupied={!!seatData}
                        playerName={seatData?.name}
                        stack={seatData?.stack}
                    />
                );
            })}
        </div>
    );
}
