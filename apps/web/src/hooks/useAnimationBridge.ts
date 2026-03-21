'use client';

import { useRef, useCallback } from 'react';
import { AnimationEvent } from '@/hooks/useAnimationQueue';

/**
 * useAnimationBridge — Shared channel between MotionOrchestrator and useGameOrchestrator
 *
 * Problem: These two systems live at different React context levels.
 * useGameOrchestrator runs BEFORE MotionOrchestrator provides its context.
 * This hook provides a ref-based bridge that both can connect to.
 *
 * Usage:
 *   const bridge = useAnimationBridge();
 *   // Pass bridge.register to MotionOrchestrator (it calls this to register its settler)
 *   // Pass bridge.onAnimationSettled to useGameOrchestrator (it subscribes to completions)
 */

export type AnimationSettledCallback = (event: AnimationEvent) => void;
export type AnimationSettledSubscriber = (callback: AnimationSettledCallback) => () => void;

export function useAnimationBridge() {
    // The actual settler function from useAnimationQueue (set by MotionOrchestrator)
    const settlerRef = useRef<AnimationSettledSubscriber | null>(null);

    /**
     * Called by MotionOrchestrator to register its onAnimationSettled function.
     */
    const register = useCallback((settler: AnimationSettledSubscriber) => {
        settlerRef.current = settler;
    }, []);

    /**
     * Proxy subscriber for useGameOrchestrator.
     * Forwards subscription to the actual settler when available.
     */
    const onAnimationSettled: AnimationSettledSubscriber = useCallback((callback) => {
        if (settlerRef.current) {
            return settlerRef.current(callback);
        }
        // If settler not registered yet, return no-op cleanup
        return () => { };
    }, []);

    return {
        register,
        onAnimationSettled,
    };
}
