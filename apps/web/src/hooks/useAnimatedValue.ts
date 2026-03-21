'use client';

import { useSpring, useMotionValue, animate, MotionValue } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';

/**
 * useAnimatedValue - Spring-based Number Interpolation
 * 
 * "Interpolate, Don't Teleport" - All numeric values animate smoothly.
 * Uses Framer Motion springs for natural physics-based feel.
 */
export function useAnimatedValue(target: number, options?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
    duration?: number;
}) {
    const {
        stiffness = 100,
        damping = 15,
        mass = 1,
        duration,
    } = options ?? {};

    const motionValue = useMotionValue(target);

    useEffect(() => {
        const controls = animate(motionValue, target, {
            type: duration ? 'tween' : 'spring',
            duration: duration ? duration / 1000 : undefined,
            stiffness,
            damping,
            mass,
        });

        return () => controls.stop();
    }, [target, motionValue, stiffness, damping, mass, duration]);

    return motionValue;
}

/**
 * useSpringValue - Simpler hook that returns the spring value directly
 * For use with Framer Motion's motion components
 */
export function useSpringValue(target: number, config?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
}) {
    const springConfig = useMemo(() => ({
        stiffness: config?.stiffness ?? 100,
        damping: config?.damping ?? 15,
        mass: config?.mass ?? 1,
    }), [config?.stiffness, config?.damping, config?.mass]);

    return useSpring(target, springConfig);
}

/**
 * useCountUp - Hook for animating counting numbers (chips, pot, etc.)
 * Returns current interpolated value as a number
 */
export function useCountUp(target: number, options?: {
    duration?: number;
    onComplete?: () => void;
}): number {
    const { duration = 500, onComplete } = options ?? {};
    const motionValue = useMotionValue(target);
    const currentRef = useRef(target);

    useEffect(() => {
        const controls = animate(motionValue, target, {
            type: 'tween',
            duration: duration / 1000,
            ease: 'easeOut',
            onComplete,
        });

        const unsubscribe = motionValue.on('change', (v) => {
            currentRef.current = Math.round(v);
        });

        return () => {
            controls.stop();
            unsubscribe();
        };
    }, [target, duration, onComplete, motionValue]);

    // Return rounded value for display
    return Math.round(motionValue.get());
}

/**
 * Preset spring configurations for different animation feels
 */
export const SpringPresets = {
    // Quick, snappy (chip counts)
    snappy: { stiffness: 400, damping: 30, mass: 1 },
    // Bouncy (winning pot)
    bouncy: { stiffness: 200, damping: 10, mass: 1 },
    // Smooth (sliding chips)
    smooth: { stiffness: 100, damping: 20, mass: 1 },
    // Heavy (large pots)
    heavy: { stiffness: 80, damping: 25, mass: 2 },
} as const;
