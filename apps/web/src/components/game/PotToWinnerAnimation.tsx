'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BetChip } from './BetChip';
import { WinnerInfo } from '@/contexts/SocketContext';
import { PositionResult } from '@/hooks/useTablePositions';

// ============================================================
// PotToWinnerAnimation
//
// During showdown, animates chip badges flying from the center
// pot to each winner's avatar position. For side pots, each
// winner's chip flies sequentially with a stagger delay.
// ============================================================

interface PotToWinnerAnimationProps {
    /** The list of winners from hand_result */
    winners: WinnerInfo[];
    /** Seat positions from useTablePositions (all 9 seats) */
    positions: PositionResult[];
    /** Whether the viewport is in portrait mode */
    isPortrait: boolean;
    /** Whether the animation should be active */
    isActive: boolean;
}

/** Format chip amounts: 10000 → "$10K", 1500 → "$1.5K" */
const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
        const k = amount / 1000;
        return `+$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `+$${amount.toLocaleString()}`;
};

export const PotToWinnerAnimation: React.FC<PotToWinnerAnimationProps> = ({
    winners,
    positions,
    isPortrait,
    isActive,
}) => {
    // Container dimensions (must match the coordinate layer in page.tsx)
    const containerW = isPortrait ? 340 : 1050;
    const containerH = isPortrait ? 620 : 470;

    // Pot center — shifted up in portrait to match pb-[30%] offset
    const potCenterX = containerW / 2;
    const potCenterY = isPortrait ? containerH * 0.35 : containerH * 0.45;

    // Build flight paths for each winner
    const flights = useMemo(() => {
        if (!winners?.length || !positions?.length) return [];

        return winners
            .filter(w => w.amount > 0)
            .map((winner, index) => {
                const pos = positions[winner.seat];
                if (!pos) return null;

                // Target = avatar center (convert CSS % to px)
                const targetX = (parseFloat(pos.avatar.left) / 100) * containerW;
                const targetY = (parseFloat(pos.avatar.top) / 100) * containerH;

                // Flight vector
                const dx = targetX - potCenterX;
                const dy = targetY - potCenterY;

                return {
                    key: `pot-flight-${winner.seat}-${index}`,
                    seat: winner.seat,
                    amount: winner.amount,
                    dx,
                    dy,
                    delay: 0.2 + index * 0.4, // Stagger: 200ms initial + 400ms per winner
                };
            })
            .filter(Boolean) as Array<{
                key: string;
                seat: number;
                amount: number;
                dx: number;
                dy: number;
                delay: number;
            }>;
    }, [winners, positions, containerW, containerH, potCenterX, potCenterY]);

    return (
        <AnimatePresence>
            {isActive && flights.map((flight) => (
                <motion.div
                    key={flight.key}
                    className="absolute z-[60] pointer-events-none"
                    style={{
                        left: potCenterX,
                        top: potCenterY,
                        transform: 'translate(-50%, -50%)',
                    }}
                    initial={{
                        scale: 0,
                        opacity: 0,
                        x: 0,
                        y: 0,
                    }}
                    animate={{
                        scale: [0, 1.3, 1, 1, 0.8],
                        opacity: [0, 1, 1, 1, 0],
                        x: [0, 0, flight.dx * 0.3, flight.dx, flight.dx],
                        y: [0, 0, flight.dy * 0.3 - 20, flight.dy, flight.dy],
                    }}
                    transition={{
                        duration: 1.6,
                        delay: flight.delay,
                        times: [0, 0.15, 0.4, 0.75, 1],
                        ease: [0.22, 1, 0.36, 1],
                    }}
                >
                    <div className="bg-black/90 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xl border border-gold-500/40"
                        style={{
                            boxShadow: '0 0 16px rgba(255,215,0,0.3), 0 4px 12px rgba(0,0,0,0.5)',
                        }}
                    >
                        <BetChip size="sm" />
                        <span
                            className="text-gold-400 font-mono font-bold text-sm tabular-nums whitespace-nowrap"
                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                        >
                            {formatAmount(flight.amount)}
                        </span>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    );
};
