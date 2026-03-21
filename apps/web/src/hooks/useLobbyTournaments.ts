/**
 * useLobbyTournaments — React Query hook for Player Tournament Lobby
 *
 * Uses useQuery for fetching public tournaments + useMutation
 * for registration/unregistration. On successful register,
 * invalidates both 'tournaments' cache (to update player count)
 * and triggers balance update via the socket (backend handles this).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { TournamentResponseDto } from '@poker/shared';

interface LobbyTournamentsResponse {
    data: TournamentResponseDto[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface UseLobbyTournamentsOptions {
    status?: string;
    gameType?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export function useLobbyTournaments(options: UseLobbyTournamentsOptions = {}) {
    const queryClient = useQueryClient();
    const { status, gameType, search, page = 1, limit = 20 } = options;

    // ============================================================
    // Query: Fetch public tournament list
    // ============================================================
    const query = useQuery<LobbyTournamentsResponse>({
        queryKey: ['tournaments', { status, gameType, search, page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            if (gameType) params.set('gameType', gameType);
            if (search) params.set('search', search);
            params.set('page', page.toString());
            params.set('limit', limit.toString());

            const { data } = await api.get(`/tournaments?${params}`);
            return data.data; // Unwrap { message, data }
        },
    });

    // ============================================================
    // Mutation: Register for tournament
    // ============================================================
    const registerMutation = useMutation({
        mutationFn: async (tournamentId: string) => {
            const { data } = await api.post('/tournaments/register', { tournamentId });
            return data.data;
        },
        onSuccess: () => {
            toast.success('Registration successful! Good luck at the tables! 🎰');
            // Refresh tournament list (player count updated)
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            // Note: Wallet balance update is pushed via socket by the backend
            // (pushBalanceUpdate in TournamentService → Redis PubSub → NotificationContext)
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || err.message;
            if (message.includes('Insufficient funds')) {
                toast.error('Insufficient funds. Please deposit more to register.');
            } else if (message.includes('Already registered')) {
                toast.error('You are already registered for this tournament.');
            } else if (message.includes('full')) {
                toast.error('Tournament is full. Try again later.');
            } else {
                toast.error(`Registration failed: ${message}`);
            }
        },
    });

    // ============================================================
    // Mutation: Unregister from tournament
    // ============================================================
    const unregisterMutation = useMutation({
        mutationFn: async (tournamentId: string) => {
            await api.delete('/tournaments/unregister', {
                data: { tournamentId },
            });
        },
        onSuccess: () => {
            toast.success('Unregistered successfully. Buy-in refunded.');
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
        onError: (err: any) => {
            toast.error(`Unregistration failed: ${err.response?.data?.message || err.message}`);
        },
    });

    return {
        // Query data
        tournaments: query.data?.data ?? [],
        total: query.data?.meta?.total ?? 0,
        totalPages: query.data?.meta?.totalPages ?? 0,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,

        // Mutations
        register: registerMutation.mutate,
        isRegistering: registerMutation.isPending,

        unregister: unregisterMutation.mutate,
        isUnregistering: unregisterMutation.isPending,
    };
}
