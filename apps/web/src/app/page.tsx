"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Root page - redirects based on auth state
 * If authenticated -> /lobby
 * If not authenticated -> /login
 */
export default function RootPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace('/lobby');
            } else {
                router.replace('/login');
            }
        }
    }, [isAuthenticated, isLoading, router]);

    // Show loading while checking auth
    return (
        <div className="flex items-center justify-center min-h-screen bg-primary-bg">
            <div className="text-accent-yellow text-xl">Loading...</div>
        </div>
    );
}
