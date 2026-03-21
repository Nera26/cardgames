import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    UserResponse,
    WalletResponseDto,
    TransactionResponseDto
} from '@poker/shared';

// Combined User Interface
export interface User extends UserResponse {
    balance: number;
    bonusBalance: number;
    transactions: TransactionResponseDto[];
    isLoading: boolean; // Field to check if this is the skeleton or real data
}

// Skeleton State - NEVER NULL
const SKELETON_USER: User = {
    id: 'skeleton-user',
    email: '',
    username: 'Loading...',
    role: 'USER',
    isVerified: false,
    isBanned: false,
    createdAt: new Date().toISOString(),
    // Wallet Defaults
    balance: 0,
    bonusBalance: 0,
    transactions: [],
    // State
    isLoading: true,
    // Tier defaults (from UserResponse)
    tier: 'BRONZE',
    lifetimeRake: 0,
    nextTier: null,
    nextTierProgress: 0,
    rakeToNextTier: 0,
    bio: null,
    avatarUrl: null,
    avatarId: 'avatar_1', // Default avatar
    bankName: null,
    accountNumber: null,
    accountHolderName: null,
    iban: null
};

export function useUser() {
    const [user, setUser] = useState<User>(SKELETON_USER);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // No token, reset to skeleton but maybe stop loading? 
            // Or just leave as skeleton with isLoading=false?
            // Usually if no token, we might want null or a specific "Guest" state.
            // Requirement says "Never see a null value". 
            // We'll keep skeleton but set isLoading to false so UI shows "Guest" or login prompt.
            setUser(prev => ({ ...prev, isLoading: false, username: 'Guest' }));
            return;
        }

        try {
            // Parallel fetch for speed
            const [userRes, walletRes, txRes] = await Promise.all([
                api.get<UserResponse>('/users/me'),
                api.get<WalletResponseDto>('/wallet/balance'),
                api.get<{ data: TransactionResponseDto[] }>('/wallet/transactions')
            ]);

            const profile = userRes.data;
            const wallet = walletRes.data;
            const transactions = txRes.data.data;

            setUser({
                ...profile,
                balance: Number(wallet.realBalance),
                bonusBalance: Number(wallet.bonusBalance),
                transactions: transactions,
                isLoading: false,
            });
            setError(null);

        } catch (err: unknown) {
            console.error('[useUser] Failed to load user data', err);
            // On error, keep skeleton but update loading state? 
            // Or maybe show error in user object?
            setError('Failed to load user profile');
            setUser(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    // Watch auth state — after login, isAuthenticated transitions false→true,
    // which re-triggers fetchUser with the now-available JWT token.
    const { isAuthenticated } = useAuth();

    // Fetch on mount AND when auth state changes
    useEffect(() => {
        fetchUser();
    }, [fetchUser, isAuthenticated]);

    // ── 🔵 BLUE CABLE: Real-time balance sync ──
    // Listen for WALLET_BALANCE_UPDATED DOM events dispatched by
    // NotificationContext when the backend pushes a balance change.
    useEffect(() => {
        const handleBalanceUpdate = () => {
            console.log('[useUser] 💰 Balance update received, refetching...');
            fetchUser();
        };
        window.addEventListener('wallet:balance_updated', handleBalanceUpdate);
        return () => window.removeEventListener('wallet:balance_updated', handleBalanceUpdate);
    }, [fetchUser]);

    return {
        user,
        error,
        refetch: fetchUser,
    };
}
