'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShowdownBannerProps {
    /** The winning hand name, e.g. "Three of a Kind" */
    handName: string;
    /** Whether to show the banner */
    isVisible: boolean;
}

/**
 * ShowdownBanner — Golden announcement overlay for the winning hand.
 * Phase 3 of the showdown choreography.
 * 
 * Renders a centered, glowing golden text banner that fades/scales in
 * during the showdown celebration and disappears when the next hand starts.
 */
export const ShowdownBanner: React.FC<ShowdownBannerProps> = ({ handName, isVisible }) => {
    return (
        <AnimatePresence>
            {isVisible && handName && (
                <motion.div
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="
                            px-8 py-3 rounded-xl
                            bg-gradient-to-r from-yellow-900/80 via-yellow-800/90 to-yellow-900/80
                            border border-yellow-500/60
                            shadow-[0_0_40px_rgba(250,204,21,0.3),0_0_80px_rgba(250,204,21,0.15)]
                            backdrop-blur-md
                        "
                        initial={{ scale: 0.7, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: -10 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                            delay: 0.1,
                        }}
                    >
                        <motion.p
                            className="
                                text-xl sm:text-2xl font-bold tracking-wide
                                text-transparent bg-clip-text
                                bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200
                                drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]
                                text-center whitespace-nowrap
                            "
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            {handName}
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
