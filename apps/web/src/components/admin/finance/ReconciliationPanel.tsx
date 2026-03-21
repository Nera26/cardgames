'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import DriftInspectorModal from './DriftInspectorModal';

interface ReconciliationReport {
    id: string;
    timestamp: string;
    totalWalletBalance: string;
    totalChipsInPlay: string;
    expectedBalance: string;
    systemDiscrepancy: string;
    status: string;
    details: Record<string, any> | null;
}

export default function ReconciliationPanel() {
    const [reports, setReports] = useState<ReconciliationReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isForcing, setIsForcing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showDriftInspector, setShowDriftInspector] = useState(false);

    const fetchReports = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/system/reconciliation');
            setReports(data);
        } catch (err) {
            console.error('Failed to fetch reconciliation reports:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleForceAudit = async () => {
        setIsForcing(true);
        try {
            await api.post('/admin/system/audit/force');
            await fetchReports(); // Refresh list
        } catch (err) {
            console.error('Force audit failed:', err);
        } finally {
            setIsForcing(false);
        }
    };

    const formatCurrency = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '$0.00';
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const latest = reports[0];
    const hasDrift = latest && latest.status === 'DRIFT';
    const matchCount = reports.filter(r => r.status === 'MATCH').length;
    const driftCount = reports.filter(r => r.status === 'DRIFT').length;

    return (
        <section className="rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${hasDrift
                        ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                        : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                        }`} />
                    <h2 className="text-lg font-bold text-white tracking-tight">
                        System Reconciliation
                    </h2>
                    <span className="text-xs text-white/40 font-mono">
                        🟡 Yellow Cable
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Summary pills */}
                    <div className="flex gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                            ✓ {matchCount} Match
                        </span>
                        {driftCount > 0 && (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20 animate-pulse">
                                ⚠ {driftCount} Drift
                            </span>
                        )}
                    </div>
                    {/* Inspect Drift Button — only show when drift detected */}
                    {hasDrift && (
                        <button
                            onClick={() => setShowDriftInspector(true)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                        >
                            🔍 Inspect Drift
                        </button>
                    )}
                    <button
                        onClick={handleForceAudit}
                        disabled={isForcing}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
                    >
                        {isForcing ? (
                            <span className="flex items-center gap-2">
                                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                Auditing...
                            </span>
                        ) : '⚡ Force Audit'}
                    </button>
                </div>
            </div>

            {/* Latest Status Banner */}
            {latest && (
                <div className={`px-6 py-3 text-sm font-medium flex items-center justify-between ${hasDrift
                    ? 'bg-red-500/5 border-b border-red-500/20 text-red-300'
                    : 'bg-emerald-500/5 border-b border-emerald-500/20 text-emerald-300'
                    }`}>
                    <span>
                        {hasDrift
                            ? `🚨 DRIFT DETECTED — $${parseFloat(latest.systemDiscrepancy).toLocaleString()} discrepancy`
                            : '✅ All systems balanced — No discrepancy detected'}
                    </span>
                    <span className="text-white/30 text-xs">
                        Last check: {formatTime(latest.timestamp)}
                    </span>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-white/30 text-sm">
                        <svg className="w-5 h-5 animate-spin mr-3" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Loading audit reports...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-16 text-white/30 text-sm">
                        No reconciliation reports yet. Press &quot;Force Audit&quot; to trigger one.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                                <th className="text-left px-6 py-3 font-semibold">Timestamp</th>
                                <th className="text-right px-6 py-3 font-semibold">Expected Balance</th>
                                <th className="text-right px-6 py-3 font-semibold">Wallets</th>
                                <th className="text-right px-6 py-3 font-semibold">Chips in Play</th>
                                <th className="text-right px-6 py-3 font-semibold">Discrepancy</th>
                                <th className="text-center px-6 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r, i) => {
                                const isDrift = r.status === 'DRIFT';
                                const disc = parseFloat(r.systemDiscrepancy);
                                const isExpanded = expandedId === r.id;

                                return (
                                    <React.Fragment key={r.id}>
                                        <tr
                                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                            className={`
                                                border-b border-white/5 cursor-pointer transition-all
                                                ${isDrift
                                                    ? 'bg-red-500/[0.03] hover:bg-red-500/[0.08]'
                                                    : 'hover:bg-white/[0.03]'
                                                }
                                                ${i === 0 ? 'font-medium' : 'text-white/60'}
                                            `}
                                        >
                                            <td className="px-6 py-3.5 font-mono text-xs">
                                                <span className="text-white/80">{formatTime(r.timestamp)}</span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-mono text-white/70">
                                                {formatCurrency(r.expectedBalance)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-mono text-white/70">
                                                {formatCurrency(r.totalWalletBalance)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-mono text-blue-300/70">
                                                {formatCurrency(r.totalChipsInPlay)}
                                            </td>
                                            <td className={`px-6 py-3.5 text-right font-mono font-bold ${isDrift
                                                ? 'text-red-400'
                                                : 'text-emerald-400/60'
                                                }`}>
                                                {isDrift
                                                    ? (disc > 0 ? '+' : '') + formatCurrency(r.systemDiscrepancy)
                                                    : '$0.00'}
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                {isDrift ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        DRIFT
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        MATCH
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                        {/* Expandable details row */}
                                        {isExpanded && r.details && (
                                            <tr className={isDrift ? 'bg-red-500/[0.02]' : 'bg-white/[0.01]'}>
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                        {Object.entries(r.details).map(([key, value]) => (
                                                            <div key={key} className="space-y-1">
                                                                <span className="text-white/30 uppercase tracking-wider text-[10px]">
                                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                </span>
                                                                <p className="text-white/70 font-mono">
                                                                    {typeof value === 'number'
                                                                        ? formatCurrency(value.toString())
                                                                        : String(value)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Drift Inspector Modal */}
            {showDriftInspector && (
                <DriftInspectorModal
                    onClose={() => {
                        setShowDriftInspector(false);
                        fetchReports(); // Refresh after potential resolution
                    }}
                />
            )}
        </section>
    );
}
