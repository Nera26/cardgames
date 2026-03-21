import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BankConfigDto } from '@poker/shared';

// Defensive default state to prevent crashes
const DEFAULT_CONFIG: BankConfigDto = {
    iban: '',
    bic: '',
    bankName: '',
    holderName: '',
    instructions: '',
    isActive: false,
};

interface UseBankConfigOptions {
    isAdmin?: boolean;
}

export const useBankConfig = (options: UseBankConfigOptions = { isAdmin: false }) => {
    const queryClient = useQueryClient();

    const query = useQuery<BankConfigDto>({
        queryKey: ['bankConfig'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/config/bank');
                return data;
            } catch (error) {
                console.error('Failed to fetch bank config', error);
                return DEFAULT_CONFIG;
            }
        },
        // Populate cache with default if query fails
        initialData: DEFAULT_CONFIG,
    });

    const updateConfig = useMutation({
        mutationFn: async (newConfig: BankConfigDto) => {
            const { data } = await api.put('/config/admin/bank', newConfig);
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['bankConfig'], data);
            // Invalidate to ensure freshness
            queryClient.invalidateQueries({ queryKey: ['bankConfig'] });
        },
    });

    const historyQuery = useQuery({
        queryKey: ['bankHistory'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/config/admin/bank/history');
                return data;
            } catch (error) {
                console.error('Failed to fetch bank history', error);
                return [];
            }
        },
        initialData: [],
        enabled: !!options.isAdmin // Only fetch if admin
    });

    const restoreConfig = useMutation({
        mutationFn: async (historyId: string) => {
            const { data } = await api.post(`/config/admin/bank/restore/${historyId}`);
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['bankConfig'], data);
            queryClient.invalidateQueries({ queryKey: ['bankConfig'] });
            queryClient.invalidateQueries({ queryKey: ['bankHistory'] });
        },
    });

    return {
        config: query.data ?? DEFAULT_CONFIG,
        isLoading: query.isLoading,
        error: query.error,
        updateConfig,
        history: historyQuery.data,
        isHistoryLoading: historyQuery.isLoading,
        restoreConfig,
    };
};
