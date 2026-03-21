'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Animation Event Types
 */
export type AnimationEvent = {
    id: string;
    type: 'deal' | 'bet' | 'showdown' | 'win' | 'fold' | 'community_cards';
    priority: 'essential' | 'non-essential';
    duration: number; // Base duration in ms
    data: Record<string, unknown>;
};

export type AnimationState = {
    current: AnimationEvent | null;
    queue: AnimationEvent[];
    isPlaying: boolean;
    speedMultiplier: number;
};

/**
 * useAnimationQueue - Event Queue with Catch-up Protocol
 * 
 * Prevents animation "jank" when socket events arrive in bursts.
 * 
 * Catch-up Protocol:
 * - Queue > 3: Reduce animation duration by 50%
 * - Queue > 5: Skip non-essential animations, warp to final state
 */
export function useAnimationQueue() {
    const [state, setState] = useState<AnimationState>({
        current: null,
        queue: [],
        isPlaying: false,
        speedMultiplier: 1,
    });

    const onCompleteRef = useRef<Map<string, () => void>>(new Map());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Subscriber callbacks fired when any animation completes
    const settledCallbacksRef = useRef<Set<(event: AnimationEvent) => void>>(new Set());
    const lastCompletedRef = useRef<AnimationEvent | null>(null);

    /**
     * Calculate speed multiplier based on queue length
     */
    const getSpeedMultiplier = useCallback((queueLength: number): number => {
        if (queueLength > 5) return 4; // 4x speed (skip most)
        if (queueLength > 3) return 2; // 2x speed (50% duration)
        return 1; // Normal speed
    }, []);

    /**
     * Should skip this animation? (Catch-up Protocol)
     */
    const shouldSkip = useCallback((event: AnimationEvent, queueLength: number): boolean => {
        // Never skip essential animations
        if (event.priority === 'essential') return false;
        // Skip non-essential when queue > 5
        return queueLength > 5;
    }, []);

    /**
     * Process queue via useEffect - React's proper way to handle async state
     */
    useEffect(() => {
        // If already playing, don't start new processing
        if (state.isPlaying || state.queue.length === 0) return;

        const [next, ...rest] = state.queue;
        const speedMultiplier = getSpeedMultiplier(state.queue.length);

        // Check if we should skip this animation
        if (shouldSkip(next, state.queue.length)) {
            // Fire completion callback immediately (warp to final state)
            const callback = onCompleteRef.current.get(next.id);
            if (callback) {
                callback();
                onCompleteRef.current.delete(next.id);
            }
            // Remove from queue and try again
            setState(prev => ({
                ...prev,
                queue: rest,
                speedMultiplier,
            }));
            return;
        }

        // Start playing this animation
        // console.log removed — fires on every animation play (perf)

        setState(prev => ({
            ...prev,
            current: next,
            queue: rest,
            isPlaying: true,
            speedMultiplier,
        }));

        // Calculate actual duration with speed multiplier
        const actualDuration = next.duration / speedMultiplier;

        // Schedule completion
        timeoutRef.current = setTimeout(() => {
            const callback = onCompleteRef.current.get(next.id);
            if (callback) {
                callback();
                onCompleteRef.current.delete(next.id);
            }
            // Track what just completed for subscribers
            lastCompletedRef.current = next;
            // Notify settled subscribers
            settledCallbacksRef.current.forEach(cb => cb(next));
            // Mark as done, which will trigger next in queue
            setState(prev => ({
                ...prev,
                current: null,
                isPlaying: false,
            }));
        }, actualDuration);

    }, [state.queue, state.isPlaying, getSpeedMultiplier, shouldSkip]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    /**
     * Enqueue an animation event
     */
    const enqueue = useCallback((event: AnimationEvent, onComplete?: () => void) => {
        // console.log removed — fires on every animation enqueue (perf)

        if (onComplete) {
            onCompleteRef.current.set(event.id, onComplete);
        }

        setState((prev) => ({
            ...prev,
            queue: [...prev.queue, event],
        }));
    }, []);

    /**
     * Clear all queued animations (for cleanup)
     */
    const clear = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        onCompleteRef.current.clear();
        setState({
            current: null,
            queue: [],
            isPlaying: false,
            speedMultiplier: 1,
        });
    }, []);

    /**
     * Get effective duration for current animation
     */
    const getEffectiveDuration = useCallback((baseDuration: number): number => {
        return baseDuration / (state.speedMultiplier || 1);
    }, [state.speedMultiplier]);

    /**
     * Subscribe to animation completion events.
     * Returns an unsubscribe function.
     */
    const onAnimationSettled = useCallback((callback: (event: AnimationEvent) => void) => {
        settledCallbacksRef.current.add(callback);
        return () => { settledCallbacksRef.current.delete(callback); };
    }, []);

    return {
        current: state.current,
        queueLength: state.queue.length,
        isPlaying: state.isPlaying,
        speedMultiplier: state.speedMultiplier,
        lastCompleted: lastCompletedRef.current,
        enqueue,
        clear,
        getEffectiveDuration,
        onAnimationSettled,
    };
}
