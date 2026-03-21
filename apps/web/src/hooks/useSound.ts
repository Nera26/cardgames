'use client';

import { useCallback, useRef, useEffect } from 'react';

/**
 * Sound Types for the Game
 */
export type SoundType =
    | 'chip_slide'
    | 'chip_impact'
    | 'card_slide'
    | 'card_flip'
    | 'win_fanfare'
    | 'fold'
    | 'check'
    | 'timer_tick';

/**
 * Sound file mappings
 */
const SOUND_FILES: Record<SoundType, string> = {
    chip_slide: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
    chip_impact: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3',
    card_slide: 'https://assets.mixkit.co/active_storage/sfx/2070/2070-preview.mp3',
    card_flip: 'https://assets.mixkit.co/active_storage/sfx/3006/3006-preview.mp3',
    win_fanfare: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
    fold: 'https://assets.mixkit.co/active_storage/sfx/3006/3006-preview.mp3',
    check: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    timer_tick: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
};

/**
 * useSound - Audio Manager with Synchronized Timing
 * 
 * Key Rule: Sounds trigger on animation END (impact), not start.
 * This creates the "heaviness" feel for chips.
 */
export function useSound() {
    const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
    const isMutedRef = useRef(false);

    /**
     * Preload all sounds on mount
     */
    useEffect(() => {
        if (typeof window === 'undefined') return;

        Object.entries(SOUND_FILES).forEach(([type, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            // Set low volume by default
            audio.volume = 0.5;
            audioCache.current.set(type as SoundType, audio);
        });

        return () => {
            audioCache.current.forEach((audio) => {
                audio.pause();
                audio.src = '';
            });
            audioCache.current.clear();
        };
    }, []);

    /**
     * Play a sound immediately
     */
    const play = useCallback((type: SoundType, volume?: number) => {
        if (isMutedRef.current) return;
        if (typeof window === 'undefined') return;

        const audio = audioCache.current.get(type);
        if (audio) {
            // Clone for overlapping sounds
            const clone = audio.cloneNode() as HTMLAudioElement;
            if (volume !== undefined) clone.volume = volume;
            clone.play().catch(() => {
                // Ignore autoplay restrictions
            });
        }
    }, []);

    /**
     * Schedule a sound to play after a delay (for animation sync)
     * Returns a cancel function
     */
    const playAfter = useCallback((type: SoundType, delayMs: number, volume?: number): (() => void) => {
        const timeoutId = setTimeout(() => {
            play(type, volume);
        }, delayMs);

        return () => clearTimeout(timeoutId);
    }, [play]);

    /**
     * Toggle mute state
     */
    const toggleMute = useCallback(() => {
        isMutedRef.current = !isMutedRef.current;
        return !isMutedRef.current;
    }, []);

    /**
     * Set mute state directly
     */
    const setMute = useCallback((muted: boolean) => {
        isMutedRef.current = muted;
    }, []);

    /**
     * Check if muted
     */
    const isMuted = useCallback(() => isMutedRef.current, []);

    return {
        play,
        playAfter,
        toggleMute,
        setMute,
        isMuted,
    };
}

/**
 * Sound timing presets for different animations
 * These define when to trigger sound relative to animation duration
 */
export const SoundTiming = {
    // Sound at animation end (impact)
    onImpact: (duration: number) => duration - 50,
    // Sound at animation start
    onStart: () => 0,
    // Sound at midpoint
    onMidpoint: (duration: number) => duration / 2,
    // Staggered sounds (for multiple chips)
    staggered: (index: number, gap: number) => index * gap,
} as const;
