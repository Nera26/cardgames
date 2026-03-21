"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SoundContextType {
    isMuted: boolean;
    volume: number;
    toggleMute: () => void;
    setVolume: (v: number) => void;
    playSound: (key: keyof typeof SOUND_ASSETS) => void;
}

const SOUND_ASSETS = {
    deal: "https://assets.mixkit.co/active_storage/sfx/2070/2070-preview.mp3",
    bet: "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3",
    check: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    alert: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    notification: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
    card_fold: "https://assets.mixkit.co/active_storage/sfx/3006/3006-preview.mp3",
    chip_slide: "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3",
    all_in: "https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3",
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const hydrated = React.useRef(false);

    // Initial hydration from localStorage (runs first)
    useEffect(() => {
        const storedMute = localStorage.getItem("isMuted");
        const storedVolume = localStorage.getItem("volume");

        if (storedMute !== null) setIsMuted(storedMute === "true");
        if (storedVolume !== null) setVolume(parseFloat(storedVolume));
        hydrated.current = true;
    }, []);

    // Persist changes — but only AFTER hydration is done
    useEffect(() => {
        if (!hydrated.current) return;
        localStorage.setItem("isMuted", String(isMuted));
        localStorage.setItem("volume", String(volume));
    }, [isMuted, volume]);

    const playSound = useCallback((key: keyof typeof SOUND_ASSETS) => {
        if (isMuted) return;

        const url = SOUND_ASSETS[key];
        const audio = new Audio(url);
        audio.volume = volume;
        audio.play().catch(err => console.debug("Audio playback failed:", err));
    }, [isMuted, volume]);

    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

    return (
        <SoundContext.Provider value={{ isMuted, volume, toggleMute, setVolume, playSound }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error("useSound must be used within a SoundProvider");
    }
    return context;
}
