'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NextHandTimer — SVG circular countdown ring shown at the center of the table.
 *
 * Counts down from the celebration delay to zero, giving players
 * a visual indicator of when the next hand will be dealt.
 */

interface NextHandTimerProps {
    /** Duration of the countdown in milliseconds */
    durationMs: number;
    /** Whether the timer is active */
    isActive: boolean;
    /** Optional label text */
    label?: string;
}

const RING_SIZE = 56;
const STROKE_WIDTH = 3;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const NextHandTimer: React.FC<NextHandTimerProps> = ({
    durationMs,
    isActive,
    label = 'Next Hand',
}) => {
    const [progress, setProgress] = useState(1); // 1.0 = full, 0.0 = empty
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil(durationMs / 1000));

    useEffect(() => {
        if (!isActive) {
            setProgress(1);
            setSecondsLeft(Math.ceil(durationMs / 1000));
            return;
        }

        const startTime = Date.now();
        const endTime = startTime + durationMs;

        const tick = () => {
            const now = Date.now();
            const remaining = Math.max(0, endTime - now);
            const pct = remaining / durationMs;
            setProgress(pct);
            setSecondsLeft(Math.ceil(remaining / 1000));

            if (remaining > 0) {
                requestAnimationFrame(tick);
            }
        };

        const rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isActive, durationMs]);

    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    className="flex flex-col items-center gap-1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    {/* SVG Ring */}
                    <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
                        <svg
                            width={RING_SIZE}
                            height={RING_SIZE}
                            className="transform -rotate-90"
                        >
                            {/* Background ring */}
                            <circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RADIUS}
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={STROKE_WIDTH}
                            />
                            {/* Progress ring */}
                            <circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RADIUS}
                                fill="none"
                                stroke="url(#timer-gradient)"
                                strokeWidth={STROKE_WIDTH}
                                strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={strokeDashoffset}
                                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                            />
                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFD700" />
                                    <stop offset="100%" stopColor="#FFA500" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Center number */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span
                                className="text-base font-bold tabular-nums"
                                style={{
                                    color: secondsLeft <= 2 ? '#FF6B6B' : '#FFD700',
                                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                }}
                            >
                                {secondsLeft}
                            </span>
                        </div>
                    </div>

                    {/* Label */}
                    <span
                        className="text-[8px] font-medium uppercase tracking-widest"
                        style={{
                            color: 'rgba(255,215,0,0.7)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                    >
                        {label}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
