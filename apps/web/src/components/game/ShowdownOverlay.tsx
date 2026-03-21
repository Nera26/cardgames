'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandResultData } from '@/contexts/SocketContext';

// ============================================================
// ShowdownOverlay — Just the winning hand name, nothing else.
// Amount/hand info is already shown at the player seat via WinnerRing.
// ============================================================

interface ShowdownOverlayProps {
    handResult: HandResultData | null;
    heroSeatIndex: number;
    isVisible: boolean;
}

export const ShowdownOverlay: React.FC<ShowdownOverlayProps> = ({
    handResult,
    isVisible,
}) => {
    return (
        <AnimatePresence>
            {isVisible && handResult?.handName && (
                <motion.div
                    className="absolute inset-x-0 top-[15%] z-[55] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        delay: 0.3,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                >
                    <span
                        className="text-xl md:text-2xl font-bold tracking-wide"
                        style={{
                            color: 'var(--color-gold-500)',
                            textShadow: '0 0 20px rgba(255,215,0,0.35), 0 2px 6px rgba(0,0,0,0.5)',
                            fontFamily: 'var(--font-sans)',
                        }}
                    >
                        {handResult.handName}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
