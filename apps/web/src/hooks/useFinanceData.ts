import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import {
    TransactionResponseDto,
    TransactionType,
    TransactionStatus,
    AdminTransactionQueryDto
} from '@poker/shared';

export interface ExtendedTransaction extends TransactionResponseDto {
    user?: {
        username: string;
        avatarId?: string;
        avatarUrl?: string;
        email?: string;
        bankName?: string;
        accountNumber?: string;
        accountHolderName?: string;
        iban?: string;
    };
    processedBy?: { username: string; avatarId?: string; avatarUrl?: string };
    performedBy?: { username: string; avatarId?: string; avatarUrl?: string };
}

export type FilterType = 'all' | 'deposits' | 'withdrawals' | 'manual';

export function useFinanceData() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch Transactions
    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: AdminTransactionQueryDto = { limit: 20, page: currentPage };

            if (activeFilter === 'deposits') params.type = TransactionType.DEPOSIT;
            if (activeFilter === 'withdrawals') params.type = TransactionType.WITHDRAW;

            const { data } = await api.get('/admin/wallet/transactions', { params });
            setTransactions(data.data as ExtendedTransaction[]);
            setTotalPages(data.meta.totalPages);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilter, currentPage]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Actions
    const handleApprove = async (txId: string, type: TransactionType, finalAmount?: number) => {
        try {
            if (type === TransactionType.DEPOSIT) {
                await api.post(`/admin/wallet/deposit/${txId}/approve`, { finalAmount });
            } else if (type === TransactionType.WITHDRAW) {
                await api.post(`/admin/wallet/withdraw/${txId}/approve`);
            }
            fetchTransactions();
        } catch (error) {
            console.error('Approval failed', error);
        }
    };

    const handleRejectApi = async (txId: string, type: TransactionType, reason?: string) => {
        try {
            if (type === TransactionType.DEPOSIT) {
                await api.post(`/admin/wallet/deposit/${txId}/reject`, { reason });
            } else if (type === TransactionType.WITHDRAW) {
                await api.post(`/admin/wallet/withdraw/${txId}/reject`, { reason });
            }
            fetchTransactions();
        } catch (error) {
            console.error('Rejection failed', error);
        }
    };

    return {
        // State
        activeFilter,
        transactions,
        isLoading,
        currentPage,
        totalPages,

        // Setters
        setActiveFilter,
        setCurrentPage,

        // Actions
        actions: {
            handleApprove,
            handleRejectApi,
            fetchTransactions
        }
    };
}
