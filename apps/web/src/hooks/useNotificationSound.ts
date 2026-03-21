'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for playing notification sounds.
 * Only triggers when explicitly called (prevents browser autoplay errors).
 */
export function useNotificationSound() {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (!audioContext) {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            setAudioContext(ctx);
            return ctx;
        }
        return audioContext;
    }, [audioContext]);

    const playAlert = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;

        // Create oscillator for alert sound
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    }, [initAudio]);

    const playSuccess = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }, [initAudio]);

    return { playAlert, playSuccess };
}
