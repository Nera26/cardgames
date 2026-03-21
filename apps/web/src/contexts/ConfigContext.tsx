"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface Config {
    system: {
        maintenance: boolean;
        version: string;
    };
    auth: {
        allowRegistration: boolean;
        googleEnabled: boolean;
    };
    bank: any;
    features: {
        chat: boolean;
        leaderboard: boolean;
    };
}

interface ConfigContextType {
    config: Config | null;
    isLoading: boolean;
    error: any;
}

const ConfigContext = createContext<ConfigContextType>({
    config: null,
    isLoading: true,
    error: null,
});

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
    const [config, setConfig] = useState<Config | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        let cancelled = false;
        let attempt = 0;

        const fetchConfig = async () => {
            while (!cancelled) {
                try {
                    const { data } = await api.get('/config/init');
                    if (!cancelled) {
                        setConfig(data);
                        setError(null);
                        setIsLoading(false);
                    }
                    return; // Success — stop retrying
                } catch (err) {
                    attempt++;
                    console.error(`Failed to fetch config (attempt ${attempt}):`, err);
                    if (!cancelled) {
                        setError(err);
                        // Mark loading as done after the first failed attempt so the
                        // rest of the app (auth, routing) is not blocked while we
                        // keep retrying in the background.
                        setIsLoading(false);
                    }
                    // Exponential backoff: 2s, 4s, 8s, 16s, capped at 30s.
                    const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        };

        fetchConfig();
        return () => { cancelled = true; };
    }, []);

    // Maintenance wall — only shown once config has actually loaded
    if (config?.system.maintenance) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
                <div className="w-24 h-24 mb-6 text-yellow-500">
                    <i className="fa-solid fa-screwdriver-wrench text-6xl animate-bounce"></i>
                </div>
                <h1 className="text-4xl font-bold mb-4 tracking-tighter">Under Maintenance</h1>
                <p className="text-slate-400 max-w-md">
                    PokerHub is currently undergoing scheduled maintenance to improve your experience.
                    We&apos;ll be back shortly with more action!
                </p>
                <div className="mt-8 px-4 py-2 bg-slate-900 rounded-full text-sm text-slate-500 border border-slate-800">
                    System Version: {config.system.version}
                </div>
            </div>
        );
    }

    return (
        <ConfigContext.Provider value={{ config, isLoading, error }}>
            {/* Connection banner — visible only while config is missing due to API error */}
            {!config && error && (
                <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2 px-4 bg-amber-600/90 text-white text-sm backdrop-blur-sm animate-pulse">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>Connecting to server… retrying automatically</span>
                </div>
            )}
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
