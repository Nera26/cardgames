'use client';

/**
 * /play — Multi-Table Orchestrator Page
 *
 * 🟣 Purple Cable: The Visual Multiplexer Hub
 *
 * Reads all active tables from SocketContext and renders:
 *   - Desktop (≥768px): DesktopTableGrid — tiled CSS Grid view
 *   - Mobile (<768px): MobileTableTabs — single table with tab switching
 *
 * If no tables are active, redirects to /lobby.
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext';
import { DesktopTableGrid } from '@/components/multitable/DesktopTableGrid';
import { MobileTableTabs } from '@/components/multitable/MobileTableTabs';

export default function PlayPage() {
    const { tables, activeTableId, setActiveTableId } = useSocket();
    const router = useRouter();

    // Derive tableIds from the multiplexed state dictionary
    const tableIds = useMemo(() => Object.keys(tables), [tables]);

    // Redirect to lobby if no tables are active
    useEffect(() => {
        if (tableIds.length === 0) {
            router.replace('/lobby');
        }
    }, [tableIds.length, router]);

    // Auto-set active table if not set
    useEffect(() => {
        if (!activeTableId && tableIds.length > 0) {
            setActiveTableId(tableIds[0]);
        }
    }, [activeTableId, tableIds, setActiveTableId]);

    // Loading / empty state
    if (tableIds.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-white/40">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
                    <p className="text-sm">Redirecting to lobby...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
            {/* Header — Quick stats bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/lobby')}
                        className="text-white/50 hover:text-white/80 transition-colors"
                        title="Back to Lobby"
                    >
                        <i className="fa-solid fa-arrow-left text-sm" />
                    </button>
                    <h1 className="text-white/80 text-sm font-semibold">
                        Multi-Table View
                    </h1>
                    <span className="text-white/30 text-xs">
                        {tableIds.length} table{tableIds.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Add Table Button */}
                    <button
                        onClick={() => router.push('/lobby')}
                        className="
                            px-3 py-1 rounded-lg text-xs font-medium
                            bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                            hover:bg-emerald-500/30 transition-all
                        "
                    >
                        <i className="fa-solid fa-plus text-[10px] mr-1" />
                        Add Table
                    </button>
                </div>
            </div>

            {/* RESPONSIVE LAYOUT */}
            <div className="flex-1 relative min-h-0">
                {/* Desktop: Tiled Grid */}
                <DesktopTableGrid tableIds={tableIds} />

                {/* Mobile: Tab System */}
                <MobileTableTabs
                    tableIds={tableIds}
                    activeTableId={activeTableId}
                    setActiveTableId={setActiveTableId}
                />
            </div>
        </div>
    );
}
