'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface OrphanedTransaction {
    buyInId: string;
    userId: string;
    username: string;
    amount: number;
    referenceId: string | null;
    tableId: string | null;
    createdAt: string;
}

interface DriftAnalysis {
    orphanedTransactions: OrphanedTransaction[];
    totalGhostMoney: number;
    affectedUsers: number;
    currentDrift: string;
    analyzedAt: string;
}

interface Props {
    onClose: () => void;
}

export default function DriftInspectorModal({ onClose }: Props) {
    const [analysis, setAnalysis] = useState<DriftAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const [resolved, setResolved] = useState(false);
    const [resolveResult, setResolveResult] = useState<{
        refundedCount: number;
        totalRefunded: number;
        skippedCount: number;
        errors: string[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const { data } = await api.get('/admin/system/drift-analysis');
                setAnalysis(data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch drift analysis');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalysis();
    }, []);

    const handleResolve = async () => {
        if (!analysis || analysis.orphanedTransactions.length === 0) return;

        const confirmed = window.confirm(
            `⚠️ FINANCIAL MUTATION\n\nThis will refund ${analysis.orphanedTransactions.length} orphaned transactions totaling $${analysis.totalGhostMoney.toLocaleString()}.\n\nThis action is logged with your admin ID.\n\nProceed?`
        );
        if (!confirmed) return;

        setIsResolving(true);
        try {
            const referenceIds = analysis.orphanedTransactions
                .map(t => t.referenceId)
                .filter((id): id is string => id !== null);

            const { data } = await api.post('/admin/system/resolve-drift', { referenceIds });
            setResolveResult(data);
            setResolved(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Resolution failed');
        } finally {
            setIsResolving(false);
        }
    };

    const formatCurrency = (val: number) =>
        `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl shadow-red-500/10">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-lg">
                            🔍
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Drift Inspector</h2>
                            <p className="text-xs text-white/40">
                                Orphaned BUY_IN transactions — no matching CASH_OUT
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                            <svg className="w-5 h-5 animate-spin mr-3" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            Scanning for orphaned transactions...
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-20 text-red-400 text-sm">
                            ❌ {error}
                        </div>
                    ) : analysis && analysis.orphanedTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-emerald-400 text-sm gap-3">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-3xl">
                                ✅
                            </div>
                            <span className="font-semibold">No orphaned transactions found</span>
                            <span className="text-white/30 text-xs">The vault is clean — all BUY_INs have matching CASH_OUTs</span>
                        </div>
                    ) : analysis ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 p-6">
                                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                                    <span className="text-[10px] uppercase tracking-wider text-red-400/60">Ghost Money</span>
                                    <p className="text-2xl font-bold text-red-400 mt-1 font-mono">
                                        {formatCurrency(analysis.totalGhostMoney)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                                    <span className="text-[10px] uppercase tracking-wider text-amber-400/60">Orphaned Txns</span>
                                    <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                                        {analysis.orphanedTransactions.length}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
                                    <span className="text-[10px] uppercase tracking-wider text-blue-400/60">Affected Users</span>
                                    <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">
                                        {analysis.affectedUsers}
                                    </p>
                                </div>
                            </div>

                            {/* Transaction Table */}
                            <div className="px-6 pb-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                                            <th className="text-left px-4 py-2 font-semibold">User</th>
                                            <th className="text-right px-4 py-2 font-semibold">Amount</th>
                                            <th className="text-left px-4 py-2 font-semibold">Reference</th>
                                            <th className="text-left px-4 py-2 font-semibold">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.orphanedTransactions.map((t) => (
                                            <tr
                                                key={t.buyInId}
                                                className="border-b border-white/5 hover:bg-red-500/[0.03] transition-colors"
                                            >
                                                <td className="px-4 py-2.5">
                                                    <span className="text-white/80 font-medium">{t.username}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-red-400 font-bold">
                                                    {formatCurrency(t.amount)}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-white/30 font-mono text-xs">
                                                        {t.referenceId ? `...${t.referenceId.slice(-12)}` : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-xs text-white/50">
                                                    {formatTime(t.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Resolution Result */}
                            {resolveResult && (
                                <div className="mx-6 mb-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-emerald-400 font-bold">✅ Resolution Complete</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <span className="text-white/30">Refunded</span>
                                            <p className="text-emerald-400 font-mono font-bold">
                                                {resolveResult.refundedCount} txns — {formatCurrency(resolveResult.totalRefunded)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-white/30">Skipped (already done)</span>
                                            <p className="text-amber-400 font-mono">{resolveResult.skippedCount}</p>
                                        </div>
                                        <div>
                                            <span className="text-white/30">Errors</span>
                                            <p className="text-red-400 font-mono">{resolveResult.errors.length}</p>
                                        </div>
                                    </div>
                                    {resolveResult.errors.length > 0 && (
                                        <div className="mt-3 text-xs text-red-400/70">
                                            {resolveResult.errors.map((e, i) => (
                                                <p key={i}>❌ {e}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Close
                    </button>
                    {analysis && analysis.orphanedTransactions.length > 0 && !resolved && (
                        <button
                            onClick={handleResolve}
                            disabled={isResolving}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 flex items-center gap-2"
                        >
                            {isResolving ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    Processing Refunds...
                                </>
                            ) : (
                                <>⚡ Resolve &amp; Refund ({analysis.orphanedTransactions.length} txns — {formatCurrency(analysis.totalGhostMoney)})</>
                            )}
                        </button>
                    )}
                    {resolved && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white transition-all shadow-lg"
                        >
                            ✅ Done — Close &amp; Refresh
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
