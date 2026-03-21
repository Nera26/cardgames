'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import api from '@/lib/api';
import { useUser } from '@/hooks/useUser';
// import { useProfile } from '@/hooks/useProfile'; // No longer needed directly here
import {
    UserResponse,
    WalletResponseDto,
    TransactionResponseDto,
    DepositDto,
    WithdrawDto
} from '@poker/shared';

// Define the User Profile shape extending Shared DTO per frontend needs
export interface UserProfile extends UserResponse {
    // These come from WalletService now
    balance: number;
    bonusBalance: number;
    transactions: TransactionResponseDto[];
}

interface GameContextType {
    user: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    maxDepositLimit: number; // Config example
    updateBalance: (amount: number) => void; // Legacy or optimistic update
    refreshWallet: () => Promise<void>;
    deposit: (dto: DepositDto) => Promise<void>;
    withdraw: (dto: WithdrawDto) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    // Standardized Hook
    const { user: hookUser, error: hookError, refetch } = useUser();

    // Mapping for backward compatibility if needed, but hookUser matches UserProfile interface mostly
    // We just need to ensure the types align.

    // The Context expects 'UserProfile | null'. 
    // The Prompt asked for "UI never see a null value" from the hook.
    // However, the Existing Context Interface defines `user: UserProfile | null`.
    // To satisfy the prompt "Hook must return default Skeleton", `useUser` does that.
    // To satisfy the existing app without breaking changes, we might need to cast or adjust.
    // IF the new hook user.isLoading is true, that is our "Skeleton".
    // But strict backward compat: existing code might check `if (!user)`.
    // If we return a skeleton user, `!user` is false, and code renders with 0 balance. 
    // This is exactly what is requested: "UI never sees a null value".

    // Stats are now fetched directly from /game/my-stats on the profile page
    const userWithStats: UserProfile = {
        ...hookUser,
    };

    const deposit = async (dto: DepositDto) => {
        try {
            await api.post('/wallet/deposit', dto);
            await refetch();
        } catch (err: unknown) {
            throw new Error((err as any).response?.data?.message || 'Deposit failed');
        }
    };

    const withdraw = async (dto: WithdrawDto) => {
        try {
            await api.post('/wallet/withdraw', dto);
            await refetch();
        } catch (err: unknown) {
            throw new Error((err as any).response?.data?.message || 'Withdrawal failed');
        }
    };

    const updateBalance = (amount: number) => {
        // We can't easily mutate the hook state directly without exposing a setter.
        // For now, triggering a refetch is safer, or we just rely on refetch.
        // If optimistic update is critical, we'd need to add it to useUser.
        // For this step, we'll re-fetch to ensure consistency.
        refetch();
    };

    return (
        <GameContext.Provider value={{
            user: userWithStats, // Now never null (Skeleton initially)
            isLoading: hookUser.isLoading,
            error: hookError,
            maxDepositLimit: 5000,
            updateBalance,
            refreshWallet: refetch,
            deposit,
            withdraw
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

