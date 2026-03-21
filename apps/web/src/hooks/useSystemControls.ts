'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';

// ════════════════════════════════════════════════════════════════
// 🔵 BLUE CABLE: System Controls Hook
//
// Maps to the admin-system.controller.ts endpoints:
//   GET    /admin/system/lockdown  → status check
//   POST   /admin/system/lockdown  → activate kill switch
//   DELETE /admin/system/lockdown  → lift lockdown
// ════════════════════════════════════════════════════════════════

export interface LockdownStatus {
    locked: boolean;
    details: {
        reason?: string;
        triggeredAt?: string;
        source?: string;
        reportId?: string;
        discrepancy?: string;
    } | null;
}

export interface InvariantReport {
    id: string;
    timestamp: string;
    totalWalletBalance: string;
    totalChipsInPlay: string;
    expectedBalance: string;
    systemDiscrepancy: string;
    status: 'MATCH' | 'DRIFT';
    details: {
        deposits?: string;
        withdrawals?: string;
        adminCredits?: string;
        adminDebits?: string;
        netPool?: string;
        playerWallets?: string;
        houseBalance?: string;
        redisChips?: number;
        tableCount?: number;
        // Legacy fields
        walletDetail?: { real: number; bonus: number };
    } | null;
}

export function useSystemControls() {
    const [lockdownStatus, setLockdownStatus] = useState<LockdownStatus>({ locked: false, details: null });
    const [latestReport, setLatestReport] = useState<InvariantReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isLifting, setIsLifting] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Fetch lockdown status ──
    const fetchLockdownStatus = useCallback(async () => {
        try {
            const { data } = await api.get<LockdownStatus>('/admin/system/lockdown');
            setLockdownStatus(data);
        } catch (err) {
            console.error('Failed to fetch lockdown status', err);
        }
    }, []);

    // ── Fetch latest reconciliation report ──
    const fetchLatestReport = useCallback(async () => {
        try {
            const { data } = await api.get<InvariantReport[]>('/admin/system/reconciliation', {
                params: { limit: 1 },
            });
            if (Array.isArray(data) && data.length > 0) {
                setLatestReport(data[0]);
            }
        } catch {
            // Endpoint may not exist yet — graceful fallback
            setLatestReport(null);
        }
    }, []);

    // ── Activate Lockdown (POST) ──
    const activateLockdown = useCallback(async (reason?: string) => {
        setIsActivating(true);
        setError(null);
        try {
            await api.post('/admin/system/lockdown', { reason });
            await fetchLockdownStatus(); // Re-fetch status
            return true;
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to activate lockdown');
            return false;
        } finally {
            setIsActivating(false);
        }
    }, [fetchLockdownStatus]);

    // ── Lift Lockdown (DELETE) ──
    const liftLockdown = useCallback(async () => {
        setIsLifting(true);
        setError(null);
        try {
            await api.delete('/admin/system/lockdown');
            await fetchLockdownStatus(); // Re-fetch status
            return true;
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to lift lockdown');
            return false;
        } finally {
            setIsLifting(false);
        }
    }, [fetchLockdownStatus]);

    // ── Auto-fetch on mount + 30s polling ──
    useEffect(() => {
        fetchLockdownStatus();
        fetchLatestReport();

        const interval = setInterval(() => {
            fetchLockdownStatus();
            fetchLatestReport();
        }, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, [fetchLockdownStatus, fetchLatestReport]);

    // ── Force Audit (POST) ──
    const forceAudit = useCallback(async () => {
        setIsAuditing(true);
        try {
            const { data } = await api.post<InvariantReport>('/admin/system/audit/force');
            setLatestReport(data);
            return data;
        } catch (err: any) {
            console.error('Force audit failed', err);
            // Fallback: just re-fetch the latest report
            await fetchLatestReport();
            return null;
        } finally {
            setIsAuditing(false);
        }
    }, [fetchLatestReport]);

    return {
        lockdownStatus,
        latestReport,
        isLoading,
        isActivating,
        isLifting,
        isAuditing,
        error,
        activateLockdown,
        liftLockdown,
        forceAudit,
        refresh: () => {
            fetchLockdownStatus();
            fetchLatestReport();
        },
    };
}
