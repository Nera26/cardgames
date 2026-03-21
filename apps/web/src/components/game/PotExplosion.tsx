'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedChipStack } from './AnimatedChipStack';

interface PotExplosionProps {
    amount: number;
    winnerCoords: { x: number; y: number };
    splitPots?: { amount: number; coords: { x: number; y: number } }[];
    /** 🟣 Iron Grid: actual pot DOM position for accurate fly offset */
    potOrigin?: { x: number; y: number };
    onComplete?: () => void;
}

/**
 * PotExplosion - Winner Scoop Animation with Confetti
 * 
 * Physics:
 * 1. Pot explodes into N stacks (or 1 for single winner)
 * 2. Stacks fly to winner's avatar position
 * 3. Confetti/particle burst behind winner
 */
export const PotExplosion: React.FC<PotExplosionProps> = ({
    amount,
    winnerCoords,
    splitPots,
    potOrigin,
    onComplete,
}) => {
    const [phase, setPhase] = useState<'explode' | 'fly' | 'complete'>('explode');
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

    // Generate confetti particles
    useEffect(() => {
        const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: Math.random() * 80 - 40,
            y: Math.random() * 80 - 40,
            color: colors[i % colors.length],
        }));
        setParticles(newParticles);
    }, []);

    // Animation sequence
    useEffect(() => {
        const timer1 = setTimeout(() => setPhase('fly'), 300);
        const timer2 = setTimeout(() => {
            setPhase('complete');
            onComplete?.();
        }, 1000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    // If split pot, render multiple stacks
    const stacks = splitPots?.length ? splitPots : [{ amount, coords: winnerCoords }];

    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
            <AnimatePresence>
                {phase !== 'complete' && (
                    <>
                        {/* Chip Stacks Flying to Winners */}
                        {stacks.map((stack, idx) => (
                            <motion.div
                                key={idx}
                                className="absolute"
                                style={{
                                    left: '50%',
                                    top: '30%',
                                    transform: 'translate(-50%, -50%)',
                                    willChange: 'transform, opacity',
                                }}
                                initial={{ scale: 1 }}
                                animate={phase === 'fly' ? {
                                    x: stack.coords.x - (potOrigin?.x ?? window.innerWidth / 2),
                                    y: stack.coords.y - (potOrigin?.y ?? window.innerHeight * 0.3),
                                    scale: 0.5,
                                } : {
                                    scale: 1.2,
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 20,
                                    delay: idx * 0.1,
                                }}
                            >
                                <AnimatedChipStack
                                    amount={stack.amount}
                                    size="lg"
                                    animate={false}
                                />
                            </motion.div>
                        ))}

                        {/* Confetti Particles at Winner Position */}
                        {phase === 'fly' && particles.map((p) => (
                            <motion.div
                                key={p.id}
                                className="absolute rounded-full"
                                style={{
                                    left: winnerCoords.x,
                                    top: winnerCoords.y,
                                    width: 8,
                                    height: 8,
                                    backgroundColor: p.color,
                                    willChange: 'transform, opacity',
                                }}
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{
                                    x: p.x * 3,
                                    y: p.y * 3 - 50, // Bias upward
                                    scale: [0, 1.5, 1],
                                    opacity: [1, 1, 0],
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

/**
 * SparkleEffect - Ambient sparkles around winners
 */
export const SparkleEffect: React.FC<{
    x: number;
    y: number;
    active: boolean;
}> = ({ x, y, active }) => {
    if (!active) return null;

    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                        boxShadow: '0 0 6px rgba(250, 204, 21, 0.8)',
                    }}
                    animate={{
                        x: Math.cos((i / 6) * Math.PI * 2) * 40,
                        y: Math.sin((i / 6) * Math.PI * 2) * 40,
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.15,
                    }}
                />
            ))}
        </motion.div>
    );
};
