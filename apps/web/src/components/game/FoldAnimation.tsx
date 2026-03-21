'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CardBack } from './visuals/CardFace';

/**
 * FoldAnimation — "Toss Toward Muck" Card Animation
 *
 * Physics model:
 * - Two card backs slide from the player's position toward table center
 * - Cards rotate slightly (pitched toss feel)
 * - Scale shrinks + opacity fades as cards reach the muck
 * - Staggered: card 2 launches 60ms after card 1
 *
 * GPU-composited: only transforms (translate3d, rotateZ, scale) and opacity.
 */

interface FoldAnimationProps {
    /** Player's absolute position (source) */
    from: { x: number; y: number };
    /** Table center / muck position (destination) */
    to: { x: number; y: number };
    /** Animation duration in seconds (adjusted by catch-up) */
    duration?: number;
    /** Called when animation completes */
    onComplete?: () => void;
}

export const FoldAnimation: React.FC<FoldAnimationProps> = ({
    from,
    to,
    duration = 0.4,
    onComplete,
}) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const completedRef = React.useRef(false);

    // Self-destruct TTL: if onAnimationComplete never fires, force unmount
    React.useEffect(() => {
        const ttl = setTimeout(() => {
            if (!completedRef.current) {
                console.warn('[FoldAnimation] ⏰ TTL expired — forcing self-destruct');
                completedRef.current = true;
                onComplete?.();
            }
        }, (duration * 1000) + 500); // 500ms grace period
        return () => clearTimeout(ttl);
    }, [duration, onComplete]);

    const handleComplete = () => {
        if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
        }
    };

    return (
        <>
            {[0, 1].map((cardIdx) => (
                <motion.div
                    key={cardIdx}
                    className="absolute pointer-events-none"
                    style={{
                        left: from.x,
                        top: from.y,
                        transform: 'translate(-50%, -50%)',
                        willChange: 'transform, opacity',
                    }}
                    initial={{
                        x: 0,
                        y: 0,
                        rotateZ: 0,
                        scale: 1,
                        opacity: 1,
                    }}
                    animate={{
                        x: dx,
                        y: dy,
                        rotateZ: cardIdx === 0 ? -18 : 12,
                        scale: 0.55,
                        opacity: 0,
                    }}
                    transition={{
                        duration: duration,
                        delay: cardIdx * 0.06,
                        ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
                    }}
                    onAnimationComplete={cardIdx === 1 ? handleComplete : undefined}
                >
                    <CardBack size="sm" />
                </motion.div>
            ))}
        </>
    );
};
