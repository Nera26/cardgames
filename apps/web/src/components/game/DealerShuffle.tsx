'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CardBack } from './visuals/CardFace';

/**
 * DealerShuffle — Premium casino-grade card mixing animation.
 *
 * 3-phase sequence at the dealer center:
 *   Phase 1: Cascade fan spread (cards fan out)
 *   Phase 2: Riffle ripple (alternating lift wave)
 *   Phase 3: Snap collect (cards compress back with bounce)
 *
 * Renders inside the OverlayLayer portal at absolute dealer coordinates.
 */

const CARD_COUNT = 6;
export const SHUFFLE_DURATION_MS = 800;
const SHUFFLE_DURATION_S = SHUFFLE_DURATION_MS / 1000;

interface DealerShuffleProps {
    /** Dealer center coordinates (absolute, within OverlayLayer) */
    x: number;
    y: number;
    /** Called when shuffle animation completes */
    onComplete?: () => void;
}

export const DealerShuffle: React.FC<DealerShuffleProps> = ({ x, y, onComplete }) => {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{
                left: x - 24,  // center the card stack (~48px card width / 2)
                top: y - 34,   // center vertically (~68px card height / 2)
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: SHUFFLE_DURATION_S - 0.05 }}
            onAnimationComplete={onComplete}
        >
            {Array.from({ length: CARD_COUNT }).map((_, i) => {
                // Fan angle: centered around 0, spread ±30°
                const normalizedIndex = (i - (CARD_COUNT - 1) / 2);
                const fanAngle = normalizedIndex * 12;
                const fanX = normalizedIndex * 14;
                const isLeftHalf = i < CARD_COUNT / 2;

                return (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            transformOrigin: '50% 100%', // pivot from bottom center
                            zIndex: i,
                        }}
                        initial={{
                            rotateZ: 0,
                            x: 0,
                            y: 0,
                            scale: 1,
                        }}
                        animate={{
                            // Phase 1 (0→35%): Fan out
                            // Phase 2 (35→65%): Riffle ripple — alternating lift
                            // Phase 3 (65→100%): Snap back
                            rotateZ: [0, fanAngle, fanAngle * 0.3, 0],
                            x: [0, fanX, fanX * 0.2, 0],
                            y: [0, -8, isLeftHalf ? -20 : 8, 0],
                            scale: [1, 1.02, 1.06, 1],
                        }}
                        transition={{
                            duration: SHUFFLE_DURATION_S,
                            times: [0, 0.35, 0.65, 1],
                            ease: 'easeInOut',
                        }}
                    >
                        <motion.div
                            // Per-card shadow that grows during the fan
                            animate={{
                                boxShadow: [
                                    '0 1px 2px rgba(0,0,0,0.3)',
                                    '0 4px 8px rgba(0,0,0,0.4)',
                                    '0 6px 12px rgba(0,0,0,0.5)',
                                    '0 1px 3px rgba(0,0,0,0.3)',
                                ],
                            }}
                            transition={{
                                duration: SHUFFLE_DURATION_S,
                                times: [0, 0.35, 0.65, 1],
                                ease: 'easeInOut',
                            }}
                            className="rounded-md overflow-hidden"
                        >
                            <CardBack size="sm" />
                        </motion.div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};
