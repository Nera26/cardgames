'use client';

import React, { useMemo } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedChipStackProps {
    amount: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    layoutId?: string;
    animate?: boolean;
    showValue?: boolean;
}

// Chip colors based on value
const getChipColor = (value: number): string => {
    if (value >= 10000) return 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-300';
    if (value >= 1000) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-200';
    if (value >= 500) return 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300';
    if (value >= 100) return 'bg-gradient-to-br from-green-500 to-green-700 border-green-300';
    return 'bg-gradient-to-br from-red-500 to-red-700 border-red-300';
};

const sizeConfig = {
    sm: { chip: 'w-6 h-6', text: 'text-[8px]', stack: 'h-8' },
    md: { chip: 'w-8 h-8', text: 'text-[10px]', stack: 'h-10' },
    lg: { chip: 'w-10 h-10', text: 'text-xs', stack: 'h-12' },
};

/**
 * AnimatedChipStack - Spring-interpolated chip display
 * 
 * Uses Framer Motion springs for smooth value transitions.
 * Supports layoutId for shared element transitions (chip slide to pot).
 */
export const AnimatedChipStack: React.FC<AnimatedChipStackProps> = ({
    amount,
    size = 'md',
    className,
    layoutId,
    animate = true,
    showValue = true,
}) => {
    // Spring-animated value
    const springValue = useSpring(amount, {
        stiffness: 100,
        damping: 15,
        mass: 1,
    });

    // Round the spring value for display
    const displayValue = useTransform(springValue, (v) => Math.round(v));

    // Calculate chip stack (visual representation)
    const chipBreakdown = useMemo(() => {
        if (amount <= 0) return [];

        const chips: { value: number; count: number }[] = [];
        let remaining = amount;

        const denominations = [10000, 1000, 500, 100, 25, 5, 1];
        for (const denom of denominations) {
            if (remaining >= denom) {
                const count = Math.floor(remaining / denom);
                chips.push({ value: denom, count: Math.min(count, 3) }); // Max 3 chips per denomination
                remaining -= count * denom;
            }
            if (chips.length >= 4) break; // Max 4 stacks
        }

        return chips;
    }, [amount]);

    const config = sizeConfig[size];

    if (amount <= 0) return null;

    return (
        <motion.div
            layoutId={layoutId}
            className={cn('relative flex flex-col items-center', className)}
            style={{ willChange: 'transform, opacity' }}
            initial={animate ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            {/* Chip Stack Visual */}
            <div className={cn('relative flex items-end justify-center gap-0.5', config.stack)}>
                {chipBreakdown.map((stack, stackIdx) => (
                    <div key={stackIdx} className="relative flex flex-col-reverse">
                        {Array.from({ length: Math.min(stack.count, 3) }).map((_, chipIdx) => (
                            <motion.div
                                key={chipIdx}
                                className={cn(
                                    'rounded-full border-2 shadow-md',
                                    getChipColor(stack.value),
                                    config.chip
                                )}
                                style={{
                                    marginTop: chipIdx > 0 ? '-60%' : 0,
                                    zIndex: chipIdx,
                                }}
                                initial={animate ? { y: -20, opacity: 0 } : false}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 20,
                                    delay: stackIdx * 0.05 + chipIdx * 0.02,
                                }}
                            >
                                {/* Chip shine effect */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Animated Value Display */}
            {showValue && (
                <motion.div
                    className={cn(
                        'mt-1 px-2 py-0.5 bg-black/80 rounded-full font-bold text-white',
                        config.text
                    )}
                    initial={animate ? { y: 5, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <motion.span>
                        ${displayValue.get().toLocaleString()}
                    </motion.span>
                </motion.div>
            )}
        </motion.div>
    );
};

/**
 * FlyingChipStack - For overlay animations (chip slide to pot)
 */
export const FlyingChipStack: React.FC<{
    amount: number;
    from: { x: number; y: number };
    to: { x: number; y: number };
    onComplete?: () => void;
    duration?: number;
}> = ({ amount, from, to, onComplete, duration = 500 }) => {
    const completedRef = React.useRef(false);

    // Self-destruct TTL: if onAnimationComplete never fires, force unmount
    React.useEffect(() => {
        const ttl = setTimeout(() => {
            if (!completedRef.current) {
                console.warn('[FlyingChipStack] ⏰ TTL expired — forcing self-destruct');
                completedRef.current = true;
                onComplete?.();
            }
        }, duration + 500); // 500ms grace period after expected duration
        return () => clearTimeout(ttl);
    }, [duration, onComplete]);

    const handleComplete = () => {
        if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
        }
    };

    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ left: from.x, top: from.y, willChange: 'transform, opacity' }}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{
                x: to.x - from.x,
                y: to.y - from.y,
                scale: 0.8,
            }}
            transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                duration: duration / 1000,
            }}
            onAnimationComplete={handleComplete}
        >
            <AnimatedChipStack amount={amount} size="sm" animate={false} />
        </motion.div>
    );
};
