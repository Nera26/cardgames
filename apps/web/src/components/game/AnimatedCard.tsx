'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/types/game';
import { CardFace, CardBack } from './visuals/CardFace';

interface AnimatedCardProps {
    card: Card;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
    layoutId?: string;
    delay?: number;
    isWinning?: boolean;
    isDimmed?: boolean;
    /** When false, card is invisible (waiting for FlyingCard deal). When true, springs into place. */
    dealReady?: boolean;
    /** When true, skip the entrance animation (card was already on the board). */
    skipEntrance?: boolean;
    onFlipComplete?: () => void;
}

const sizeConfig = {
    xs: { width: 38, height: 54, cardSize: 'sm' as const },
    sm: { width: 48, height: 68, cardSize: 'sm' as const },
    md: { width: 64, height: 90, cardSize: 'md' as const },
    lg: { width: 76, height: 106, cardSize: 'lg' as const },
};

/**
 * AnimatedCard - 3D Flip Animation with Shine Effect
 * 
 * Features:
 * - 3D flip from face-down to face-up
 * - Shine sweep effect for winning cards
 * - Staggered spawn from dealer position
 * - layoutId for shared element transitions
 */
const AnimatedCardInner: React.FC<AnimatedCardProps> = ({
    card,
    size = 'md',
    className,
    layoutId,
    delay = 0,
    isWinning = false,
    isDimmed = false,
    dealReady = true,
    skipEntrance = false,
    onFlipComplete,
}) => {
    const [isFlipped, setIsFlipped] = useState(card.isFaceUp);
    const config = sizeConfig[size];



    // Trigger flip animation when isFaceUp changes
    React.useEffect(() => {
        if (card.isFaceUp !== isFlipped) {

            setIsFlipped(card.isFaceUp);
            if (card.isFaceUp && onFlipComplete) {
                setTimeout(onFlipComplete, 300);
            }
        }
    }, [card.isFaceUp, isFlipped, onFlipComplete]);

    return (
        <motion.div
            layoutId={layoutId}
            className={cn('relative perspective-1000', className)}
            style={{
                width: config.width,
                height: config.height,
                transformStyle: 'preserve-3d',
                // 🔴 Only promote to GPU layer during active animation, not idle
                willChange: !dealReady ? 'transform, opacity' : 'auto',
            }}
            initial={skipEntrance
                ? { opacity: 1, scale: 1, rotateY: isFlipped ? 0 : 180, rotateZ: 0 }
                : { opacity: 0, scale: 0.85, rotateY: 180, rotateZ: 3 }
            }
            animate={{
                opacity: dealReady ? 1 : 0,
                scale: dealReady ? 1 : 0.85,
                rotateY: dealReady ? (isFlipped ? 0 : 180) : 180,
                rotateZ: 0,
            }}
            transition={skipEntrance
                ? { duration: 0 }
                : {
                    type: 'spring',
                    stiffness: 260,
                    damping: 22,
                    delay: dealReady ? delay : 0,
                    rotateY: { duration: 0.5, ease: 'easeOut', delay: dealReady ? delay + 0.1 : 0 },
                    rotateZ: { type: 'spring', stiffness: 180, damping: 14, delay: dealReady ? delay : 0 },
                }
            }
        >
            {/* Card Back */}
            <motion.div
                className="absolute inset-0 backface-hidden"
                style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                }}
            >
                <CardBack size={config.cardSize} />
            </motion.div>

            {/* Card Front */}
            <motion.div
                className="absolute inset-0 backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
            >
                <div className="relative w-full h-full">
                    <CardFace
                        rank={card.rank}
                        suit={card.suit}
                        size={config.cardSize}
                    />

                    {/* Showdown Dim Overlay — subtly darkens non-winning cards */}
                    {isDimmed && (
                        <div className="absolute inset-0 bg-black/25 rounded-md z-10 pointer-events-none transition-opacity duration-300" />
                    )}

                    {/* Winning Shine Effect */}
                    <AnimatePresence>
                        {isWinning && (
                            <motion.div
                                className="absolute inset-0 pointer-events-none overflow-hidden rounded-md"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/50 to-transparent"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '200%' }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: 2,
                                        ease: 'easeInOut',
                                    }}
                                />
                                {/* Gold Border Glow */}
                                <div className="absolute inset-0 rounded-md ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const AnimatedCard = React.memo(AnimatedCardInner);


/**
 * FlyingCard - Pitched card deal animation with Z-axis lift
 *
 * Physics model:
 * - Spin: deterministic rotateZ based on card index (like a pitched card)
 * - Z-lift: scale keyframes [1 → 1.15 → 0.7] simulate arc over felt
 * - Shadow: expands mid-flight, tightens on landing
 * - Friction: spring stiffness 140, damping 20, mass 0.6
 */
const FlyingCardInner: React.FC<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    delay?: number;
    /** Deterministic index for spin angle variation */
    cardIndex?: number;
    onComplete?: () => void;
}> = ({ from, to, delay = 0, cardIndex = 0, onComplete }) => {
    // Deterministic spin: varies per card but consistent across renders
    const spinAngle = useMemo(() => {
        const seed = (cardIndex * 137 + 47) % 240;
        return seed - 120; // Range: -120 to +120 degrees
    }, [cardIndex]);

    // Flight duration for keyframe timing (matches spring settle ~0.5s)
    const flightDuration = 0.5;

    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ left: from.x, top: from.y, willChange: 'transform, opacity' }}
            initial={{
                x: 0,
                y: 0,
                rotateZ: spinAngle,
                opacity: 1,
            }}
            animate={{
                x: to.x - from.x,
                y: to.y - from.y,
                rotateZ: 0,
                opacity: 0,
                // Z-axis lift: scale [1 → 1.15 peak → 0.7 landing]
                scale: [1, 1.15, 0.7],
                // Shadow: grows mid-flight, collapses on landing
                boxShadow: [
                    '0 2px 4px rgba(0,0,0,0.3)',
                    '0 12px 24px rgba(0,0,0,0.5)',
                    '0 1px 2px rgba(0,0,0,0.2)',
                ],
            }}
            transition={{
                // Position: felt-friction spring
                x: { type: 'spring', stiffness: 140, damping: 20, mass: 0.6, delay },
                y: { type: 'spring', stiffness: 140, damping: 20, mass: 0.6, delay },
                // Spin: decelerates with friction
                rotateZ: { type: 'spring', stiffness: 100, damping: 16, mass: 0.6, delay },
                // Z-axis lift arc (keyframes)
                scale: { times: [0, 0.45, 1], duration: flightDuration, ease: 'easeOut', delay },
                // Shadow arc matches scale
                boxShadow: { times: [0, 0.45, 1], duration: flightDuration, ease: 'easeOut', delay },
                // Fade out as it reaches destination
                opacity: { duration: 0.12, delay: delay + flightDuration - 0.05 },
            }}
            onAnimationComplete={onComplete}
        >
            <AnimatedCard
                card={{ rank: '?', suit: 'spades', isFaceUp: false }}
                size="sm"
                dealReady={true}
            />
        </motion.div>
    );
};

export const FlyingCard = React.memo(FlyingCardInner);


