'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { UserListResponse, UserResponse, UpdateRoleDto, Role } from '@poker/shared';

interface UseAdminUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isBanned?: boolean;
    sortBy?: 'createdAt' | 'balance';
    order?: 'asc' | 'desc';
}

interface UseAdminUsersReturn {
    users: UserResponse[];
    total: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    banUser: (userId: string) => Promise<void>;
    unbanUser: (userId: string) => Promise<void>;
    updateRole: (userId: string, role: Role) => Promise<void>;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}): UseAdminUsersReturn {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { page = 1, limit = 20, search, role, isBanned, sortBy, order } = options;

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', limit.toString());
            if (search) params.set('search', search);
            if (role) params.set('role', role);
            if (isBanned !== undefined) params.set('isBanned', isBanned.toString());
            if (sortBy) params.set('sortBy', sortBy);
            if (order) params.set('order', order);

            const { data } = await api.get<UserListResponse>(`/users?${params}`);
            setUsers(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load users';
            setError(message);
            console.error('[useAdminUsers] Error:', message);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, role, isBanned, sortBy, order]);

    const banUser = useCallback(async (userId: string) => {
        try {
            await api.post(`/users/${userId}/ban`);
            await fetchUsers(); // Refresh list
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to ban user';
            throw new Error(message);
        }
    }, [fetchUsers]);

    const unbanUser = useCallback(async (userId: string) => {
        try {
            await api.post(`/users/${userId}/unban`);
            await fetchUsers(); // Refresh list
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to unban user';
            throw new Error(message);
        }
    }, [fetchUsers]);

    const updateRole = useCallback(async (userId: string, newRole: Role) => {
        try {
            await api.patch<UserResponse>(`/users/${userId}/role`, { role: newRole } as UpdateRoleDto);
            await fetchUsers(); // Refresh list
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update role';
            throw new Error(message);
        }
    }, [fetchUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return {
        users,
        total,
        totalPages,
        isLoading,
        error,
        refetch: fetchUsers,
        banUser,
        unbanUser,
        updateRole,
    };
}
