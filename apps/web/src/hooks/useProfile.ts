'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    UserResponse,
    UpdateProfileDto,
    TIER_CONFIG,
    TIER_ORDER
} from '@poker/shared';

interface UseProfileReturn {
    profile: UserResponse | null;
    isLoading: boolean;
    error: string | null;
    updateProfile: (data: UpdateProfileDto) => Promise<void>;
    refetch: () => Promise<void>;
    tierConfig: typeof TIER_CONFIG;
    tierOrder: typeof TIER_ORDER;
}

export function useProfile(): UseProfileReturn {
    const [profile, setProfile] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const { data } = await api.get<UserResponse>('/users/me');
            setProfile(data);
        } catch (err: unknown) {
            const message = (err as any).response?.data?.message || 'Failed to load profile';
            setError(message);
            console.error('[useProfile] Error:', message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateProfile = useCallback(async (dto: UpdateProfileDto) => {
        try {
            setError(null);
            const { data } = await api.patch<UserResponse>('/users/me', dto);
            setProfile(data);
        } catch (err: unknown) {
            const message = (err as any).response?.data?.message || 'Failed to update profile';
            setError(message);
            throw new Error(message);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        profile,
        isLoading,
        error,
        updateProfile,
        refetch: fetchProfile,
        tierConfig: TIER_CONFIG,
        tierOrder: TIER_ORDER,
    };
}
