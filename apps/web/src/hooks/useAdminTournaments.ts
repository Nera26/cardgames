/**
 * useAdminTournaments — React Query hook for Admin Tournament CRUD
 *
 * Uses useQuery for fetching + useMutation for create/update/delete.
 * On successful mutations, invalidates the 'admin-tournaments' cache
 * so the DataTable refreshes instantly.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    TournamentResponseDto,
    CreateTournamentDto,
    UpdateTournamentDto,
} from '@poker/shared';

interface AdminTournamentsResponse {
    data: TournamentResponseDto[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface UseAdminTournamentsOptions {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export function useAdminTournaments(options: UseAdminTournamentsOptions = {}) {
    const queryClient = useQueryClient();
    const { status, search, page = 1, limit = 20 } = options;

    // ============================================================
    // Query: Fetch admin tournament list
    // ============================================================
    const query = useQuery<AdminTournamentsResponse>({
        queryKey: ['admin-tournaments', { status, search, page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            if (search) params.set('search', search);
            params.set('page', page.toString());
            params.set('limit', limit.toString());

            const { data } = await api.get(`/admin/tournaments?${params}`);
            return data.data; // Unwrap { message, data }
        },
    });

    // ============================================================
    // Mutation: Create tournament
    // ============================================================
    const createMutation = useMutation({
        mutationFn: async (dto: CreateTournamentDto) => {
            const { data } = await api.post('/admin/tournaments', dto);
            return data.data;
        },
        onSuccess: () => {
            toast.success('Tournament created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['tournaments'] }); // Refresh lobby too
        },
        onError: (err: any) => {
            toast.error(`Failed to create tournament: ${err.response?.data?.message || err.message}`);
        },
    });

    // ============================================================
    // Mutation: Update tournament
    // ============================================================
    const updateMutation = useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdateTournamentDto }) => {
            const { data } = await api.patch(`/admin/tournaments/${id}`, dto);
            return data.data;
        },
        onSuccess: () => {
            toast.success('Tournament updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
        onError: (err: any) => {
            toast.error(`Failed to update tournament: ${err.response?.data?.message || err.message}`);
        },
    });

    // ============================================================
    // Mutation: Delete tournament
    // ============================================================
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/tournaments/${id}`);
        },
        onSuccess: () => {
            toast.success('Tournament deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
        onError: (err: any) => {
            toast.error(`Failed to delete tournament: ${err.response?.data?.message || err.message}`);
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
        createTournament: createMutation.mutate,
        isCreating: createMutation.isPending,

        updateTournament: updateMutation.mutate,
        isUpdating: updateMutation.isPending,

        deleteTournament: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,
    };
}
