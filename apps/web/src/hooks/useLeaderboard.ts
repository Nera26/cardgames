import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    LeaderboardResponseDto,
    LeaderboardPlayerDto,
    LeaderboardTimeframe,
    GameMode,
} from '@poker/shared';

interface UseLeaderboardOptions {
    timeframe: LeaderboardTimeframe;
    gameMode: GameMode;
    page?: number;
    limit?: number;
}

interface UseLeaderboardReturn {
    players: LeaderboardPlayerDto[];
    total: number;
    totalPages: number;
    page: number;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useLeaderboard({
    timeframe,
    gameMode,
    page = 1,
    limit = 20,
}: UseLeaderboardOptions): UseLeaderboardReturn {
    const [players, setPlayers] = useState<LeaderboardPlayerDto[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(page);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await api.get<{ message: string; data: LeaderboardResponseDto }>(
                '/leaderboard',
                {
                    params: {
                        timeframe,
                        gameMode,
                        page,
                        limit,
                    },
                },
            );

            const data = res.data.data;
            setPlayers(data.players);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setCurrentPage(data.page);
        } catch (err: unknown) {
            console.error('[useLeaderboard] Failed to fetch leaderboard', err);
            setError('Failed to load leaderboard data');
        } finally {
            setIsLoading(false);
        }
    }, [timeframe, gameMode, page, limit]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        players,
        total,
        totalPages,
        page: currentPage,
        isLoading,
        error,
        refetch: fetchLeaderboard,
    };
}
