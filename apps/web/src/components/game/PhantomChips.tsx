'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedChipStack } from './AnimatedChipStack';

type PhantomState = 'pending' | 'confirmed' | 'rejected';

interface PhantomChipsProps {
    amount: number;
    fromCoords: { x: number; y: number };
    toCoords: { x: number; y: number };
    state: PhantomState;
    onComplete?: () => void;
}

/**
 * PhantomChips - Optimistic UI for Betting
 * 
 * The UI "lies" to the user for instant feedback:
 * 1. User clicks "Raise $500"
 * 2. Immediately spawn phantom chips at their seat
 * 3. Animate to pot center
 * 4. If server confirms: merge with real pot
 * 5. If server rejects: reverse animation (gravity)
 */
export const PhantomChips: React.FC<PhantomChipsProps> = ({
    amount,
    fromCoords,
    toCoords,
    state,
    onComplete,
}) => {
    const [position, setPosition] = useState(fromCoords);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (state === 'pending') {
            // Animate to pot
            setPosition(toCoords);
        } else if (state === 'rejected') {
            // Reverse animation back to source
            setPosition(fromCoords);
            setTimeout(() => {
                setVisible(false);
                onComplete?.();
            }, 500);
        } else if (state === 'confirmed') {
            // Disappear (merge with real pot)
            setTimeout(() => {
                setVisible(false);
                onComplete?.();
            }, 100);
        }
    }, [state, fromCoords, toCoords, onComplete]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="absolute pointer-events-none"
                    style={{
                        left: 0,
                        top: 0,
                        // Phantom chips are slightly transparent
                        opacity: state === 'pending' ? 0.8 : 1,
                        willChange: 'transform, opacity',
                    }}
                    initial={{ x: fromCoords.x, y: fromCoords.y, scale: 1 }}
                    animate={{
                        x: position.x,
                        y: position.y,
                        scale: state === 'rejected' ? 1.1 : 0.9,
                    }}
                    exit={{
                        scale: 0,
                        opacity: 0,
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: state === 'rejected' ? 150 : 200,
                        damping: state === 'rejected' ? 10 : 20,
                    }}
                >
                    <AnimatedChipStack
                        amount={amount}
                        size="sm"
                        animate={false}
                        showValue={true}
                    />

                    {/* Rejection shake effect */}
                    {state === 'rejected' && (
                        <motion.div
                            className="absolute inset-0 rounded-full bg-red-500/30"
                            animate={{
                                x: [0, -5, 5, -5, 5, 0],
                            }}
                            transition={{ duration: 0.4 }}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * Hook to manage phantom chip state
 */
export function usePhantomChips() {
    const [phantoms, setPhantoms] = useState<Map<string, {
        id: string;
        amount: number;
        fromCoords: { x: number; y: number };
        toCoords: { x: number; y: number };
        state: PhantomState;
    }>>(new Map());

    const spawn = (
        id: string,
        amount: number,
        fromCoords: { x: number; y: number },
        toCoords: { x: number; y: number }
    ) => {
        setPhantoms(prev => {
            const next = new Map(prev);
            next.set(id, { id, amount, fromCoords, toCoords, state: 'pending' });
            return next;
        });
    };

    const confirm = (id: string) => {
        setPhantoms(prev => {
            const next = new Map(prev);
            const phantom = next.get(id);
            if (phantom) {
                next.set(id, { ...phantom, state: 'confirmed' });
            }
            return next;
        });
    };

    const reject = (id: string) => {
        setPhantoms(prev => {
            const next = new Map(prev);
            const phantom = next.get(id);
            if (phantom) {
                next.set(id, { ...phantom, state: 'rejected' });
            }
            return next;
        });
    };

    const remove = (id: string) => {
        setPhantoms(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    };

    return {
        phantoms: Array.from(phantoms.values()),
        spawn,
        confirm,
        reject,
        remove,
    };
}
