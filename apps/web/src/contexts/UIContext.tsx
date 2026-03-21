'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type TableSkin = 'green' | 'blue' | 'red' | 'midnight';

interface UIContextType {
    tableSkin: TableSkin;
    setTableSkin: (skin: TableSkin) => void;
    // 🟣 Pro Settings
    useFourColorDeck: boolean;
    setUseFourColorDeck: (v: boolean) => void;
    displayInBB: boolean;
    setDisplayInBB: (v: boolean) => void;
    autoMuck: boolean;
    setAutoMuck: (v: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════
// 🟣 Purple Cable: CSS variable mapping per skin
// These drive the game page's var(--color-table-felt)
// and var(--color-table-border) radial gradient system.
// ═══════════════════════════════════════════════════════
const CSS_VARS: Record<TableSkin, { felt: string; border: string }> = {
    green:    { felt: '#3d6b56', border: '#5c4033' },
    blue:     { felt: '#1e4a8a', border: '#2a3a5c' },
    red:      { felt: '#7a2030', border: '#5c2a2a' },
    midnight: { felt: '#1a1d28', border: '#2a2d3a' },
};

// 🟣 Pro Settings localStorage key
const SETTINGS_KEY = 'poker_pro_settings';

interface ProSettings {
    useFourColorDeck: boolean;
    displayInBB: boolean;
    autoMuck: boolean;
}

const DEFAULT_SETTINGS: ProSettings = {
    useFourColorDeck: false,
    displayInBB: false,
    autoMuck: false,
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tableSkin, setTableSkinState] = useState<TableSkin>('green');
    const [useFourColorDeck, setUseFourColorDeckState] = useState(false);
    const [displayInBB, setDisplayInBBState] = useState(false);
    const [autoMuck, setAutoMuckState] = useState(false);
    const hydrated = React.useRef(false);

    // Initial hydration from localStorage (runs first)
    useEffect(() => {
        const savedSkin = localStorage.getItem('poker_table_skin') as TableSkin;
        if (savedSkin && ['green', 'blue', 'red', 'midnight'].includes(savedSkin)) {
            setTableSkinState(savedSkin);
        }
        // Pro settings
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const parsed: Partial<ProSettings> = JSON.parse(raw);
                if (parsed.useFourColorDeck !== undefined) setUseFourColorDeckState(parsed.useFourColorDeck);
                if (parsed.displayInBB !== undefined) setDisplayInBBState(parsed.displayInBB);
                if (parsed.autoMuck !== undefined) setAutoMuckState(parsed.autoMuck);
            }
        } catch { /* corrupt localStorage — use defaults */ }
        hydrated.current = true;
    }, []);

    // 🟣 Sync CSS custom properties to :root so var(--color-table-felt)
    // and var(--color-table-border) update reactively in the game page
    useEffect(() => {
        const vars = CSS_VARS[tableSkin];
        const root = document.documentElement;
        root.style.setProperty('--color-table-felt', vars.felt);
        root.style.setProperty('--color-table-border', vars.border);
    }, [tableSkin]);

    // Persist pro settings — only AFTER hydration
    useEffect(() => {
        if (!hydrated.current) return;
        const settings: ProSettings = { useFourColorDeck, displayInBB, autoMuck };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [useFourColorDeck, displayInBB, autoMuck]);

    const setTableSkin = useCallback((skin: TableSkin) => {
        setTableSkinState(skin);
        localStorage.setItem('poker_table_skin', skin);
    }, []);

    const setUseFourColorDeck = useCallback((v: boolean) => setUseFourColorDeckState(v), []);
    const setDisplayInBB = useCallback((v: boolean) => setDisplayInBBState(v), []);
    const setAutoMuck = useCallback((v: boolean) => setAutoMuckState(v), []);

    return (
        <UIContext.Provider value={{
            tableSkin, setTableSkin,
            useFourColorDeck, setUseFourColorDeck,
            displayInBB, setDisplayInBB,
            autoMuck, setAutoMuck,
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
