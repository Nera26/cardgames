'use client';

import { useState, useCallback } from 'react';
import type { BroadcastPriority } from '@/types/broadcast';

/**
 * Custom hook for playing system notification sounds.
 * Supports priority-based sounds for Info/Warning/Critical alerts.
 */
export function useSystemSound() {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (!audioContext) {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            setAudioContext(ctx);
            return ctx;
        }
        return audioContext;
    }, [audioContext]);

    /**
     * Play Info sound - gentle low frequency tone
     */
    const playInfo = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.setValueAtTime(450, ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }, [initAudio]);

    /**
     * Play Warning sound - medium frequency rising tone
     */
    const playWarning = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    }, [initAudio]);

    /**
     * Play Critical sound - urgent high frequency dual beeps
     */
    const playCritical = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;

        // First beep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);

        // Second beep
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(900, ctx.currentTime + 0.2);
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc2.start(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.35);
    }, [initAudio]);

    /**
     * Play preview sound based on priority level
     */
    const playPreview = useCallback((priority: BroadcastPriority) => {
        switch (priority) {
            case 'info':
                playInfo();
                break;
            case 'warning':
                playWarning();
                break;
            case 'critical':
                playCritical();
                break;
        }
    }, [playInfo, playWarning, playCritical]);

    return { playInfo, playWarning, playCritical, playPreview };
}
