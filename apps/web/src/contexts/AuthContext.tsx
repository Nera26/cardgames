"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
// We use 'any' or a generic User type if not strictly defined, 
// but sticking to the UserResponse from shared is better if available.
// Based on useProfile.ts, it uses UserResponse.
import { UserResponse } from "@poker/shared";
import LoadingScreen from "@/components/ui/LoadingScreen";

interface AuthContextType {
    user: UserResponse | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (accessToken: string, user: UserResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // 🟣 Synchronous Hydration: read cached user BEFORE first render.
    // This eliminates the "Verifying Identity..." flash entirely.
    const [user, setUser] = useState<UserResponse | null>(() => {
        if (typeof window === 'undefined') return null; // SSR safety
        try {
            const stored = localStorage.getItem("user");
            const token = localStorage.getItem("accessToken");
            if (stored && token) return JSON.parse(stored);
        } catch { /* corrupt data */ }
        return null;
    });

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // specific check to derive authenticated state
    const isAuthenticated = !!user;

    // Background validation — refresh user data silently, never blocks UI
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token || !user) return; // Nothing to validate

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        api.get('/users/me', { signal: controller.signal })
            .then(({ data }) => {
                clearTimeout(timeout);
                setUser(data);
                localStorage.setItem("user", JSON.stringify(data));
            })
            .catch((err: any) => {
                clearTimeout(timeout);
                if (err?.code === 'ERR_CANCELED' || err?.name === 'AbortError') {
                    console.warn('[Auth] Background validation timed out, using cached user');
                    return;
                }
                if (err?.response?.status === 401) {
                    console.error('[Auth] Token invalid, logging out');
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                    setUser(null);
                }
            });

        return () => { clearTimeout(timeout); controller.abort(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = (accessToken: string, userData: UserResponse) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        // Notify SocketContext to connect with the new token
        window.dispatchEvent(new Event('auth:changed'));
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
        // Notify SocketContext to disconnect immediately
        window.dispatchEvent(new Event('auth:changed'));
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
