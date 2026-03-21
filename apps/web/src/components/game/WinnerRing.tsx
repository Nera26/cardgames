'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WinnerRing — Golden pulsing glow around the winning player's avatar.
 *
 * Wraps any child (typically PlayerAvatar) with a breathing gold ring
 * that appears during the celebration phase.
 */

interface WinnerRingProps {
    /** Whether this player is the winner */
    isWinner: boolean;
    /** The hand description to display (e.g., "Full House", "Flush") */
    handDescription?: string;
    /** Amount won */
    amountWon?: number;
    children: React.ReactNode;
}

export const WinnerRing: React.FC<WinnerRingProps> = ({
    isWinner,
    handDescription,
    amountWon,
    children,
}) => {
    return (
        <div className="relative">
            {/* The Gold Ring */}
            <AnimatePresence>
                {isWinner && (
                    <motion.div
                        className="absolute -inset-2 rounded-full z-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
                            boxShadow: `
                                0 0 20px rgba(255,215,0,0.6),
                                0 0 40px rgba(255,215,0,0.3),
                                0 0 60px rgba(255,215,0,0.15),
                                inset 0 0 20px rgba(255,215,0,0.2)
                            `,
                            border: '2px solid rgba(255,215,0,0.7)',
                        }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [1, 1.08, 1],
                            opacity: [0.8, 1, 0.8],
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{
                            scale: {
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            },
                            opacity: {
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            },
                        }}
                    />
                )}
            </AnimatePresence>

            {/* The wrapped component (PlayerAvatar) */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Hand Description Badge */}
            <AnimatePresence>
                {isWinner && handDescription && (
                    <motion.div
                        className="absolute -bottom-7 left-1/2 z-20 whitespace-nowrap"
                        style={{ transform: 'translateX(-50%)' }}
                        initial={{ y: 10, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -5, opacity: 0, scale: 0.9 }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 20,
                            delay: 0.3,
                        }}
                    >
                        <div
                            className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-center"
                            style={{
                                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                color: '#1a1a1a',
                                boxShadow: '0 2px 8px rgba(255,165,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.3)',
                            }}
                        >
                            {handDescription}
                        </div>
                        {amountWon && amountWon > 0 && (
                            <motion.div
                                className="text-center text-[8px] font-bold text-yellow-400 mt-0.5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                +${amountWon.toLocaleString()}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
