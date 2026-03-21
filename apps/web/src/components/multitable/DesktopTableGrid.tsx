'use client';

/**
 * DesktopTableGrid — Playable Multi-Table Grid for Desktop Grinders
 * 
 * 🟣 Purple Cable: Visual Multiplexer (Rip & Replace v2)
 * 
 * Each cell renders the REAL PokerTableContent + GameControls so
 * grinders can fold/call/raise directly from the 2×2 grid without
 * navigating away. No more placeholder mini-felts.
 * 
 * Architecture:
 *   GridTableCell → useGameTable(tableId) → useGameOrchestrator
 *                 → PokerTableContent (inside UniversalScaler)
 *                 → GameControls (absolute positioned inside cell)
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext';
import { useGameTable } from '@/hooks/useGameTable';
import { useGameOrchestrator, DisplayTableState } from '@/hooks/useGameOrchestrator';
import { PokerTableContent, LANDSCAPE_RADIUS } from '@/components/game/PokerTableContent';
import { GameControls } from '@/components/game/GameControls';
import { UniversalScaler } from '@/components/game/UniversalScaler';
import { TableLayoutProvider } from '@/contexts/TableLayoutContext';
import { toast } from 'sonner';
import { Card as CardType, Player } from '@/types/game';

interface DesktopTableGridProps {
    tableIds: string[];
}

const MAX_TABLES = 4;

export function DesktopTableGrid({ tableIds }: DesktopTableGridProps) {
    const router = useRouter();
    const count = tableIds.length;

    // Grid layout: always 2×2 when ≥2 tables (so the empty slot has a home)
    const gridClass = count <= 1
        ? 'grid-cols-1 grid-rows-1'
        : 'grid-cols-2 grid-rows-2';

    // How many empty slots to show (fill the grid)
    const emptySlots = count >= MAX_TABLES ? 0 : count <= 1 ? 1 : (MAX_TABLES - count);

    return (
        <div className={`hidden md:grid ${gridClass} w-full h-full gap-2 p-2`}>
            {tableIds.map((tableId) => (
                <GridTableCell
                    key={tableId}
                    tableId={tableId}
                />
            ))}

            {/* EMPTY SLOTS — "Add Table" entry points */}
            {Array.from({ length: emptySlots }).map((_, i) => (
                <EmptySlot key={`empty-${i}`} onClick={() => router.push('/lobby')} />
            ))}
        </div>
    );
}

// ============================================================
// GridTableCell — Fully Playable Mini-Client
// ============================================================
// Each cell runs its own useGameTable + useGameOrchestrator, creating
// an isolated state subscription reading from the central SocketContext.
// This is how tier-one clients (PokerStars, GGPoker) operate.
// ============================================================

function GridTableCell({ tableId }: { tableId: string }) {
    const router = useRouter();
    const { toggleSitOut } = useSocket();

    // 🔴 Red Cable: per-table socket state + action handlers
    const {
        tableState,
        heroPlayer,
        heroSeatIndex,
        isJoined,
        isMyTurn,
        currentCallAmount,
        minRaise,
        bigBlind,
        fold,
        check,
        call,
        raise,
        allIn,
    } = useGameTable({ tableId, autoJoin: false });

    // 🟣 Purple Cable: Animation orchestrator (lagged display state)
    const effectiveTableState = useMemo<DisplayTableState | null>(() => {
        if (!tableState) return null;
        return tableState as DisplayTableState;
    }, [tableState]);

    const { displayState } = useGameOrchestrator(effectiveTableState);

    const phase = displayState?.phase;

    // 🔒 Double-tap Guard: prevent rapid action spam
    const actionPendingRef = useRef(false);
    const [isActionPending, setIsActionPending] = useState(false);
    const pendingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const markPending = useCallback(() => {
        actionPendingRef.current = true;
        setIsActionPending(true);
        // Auto-clear after 3s safety
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = setTimeout(() => {
            actionPendingRef.current = false;
            setIsActionPending(false);
        }, 3000);
    }, []);

    const clearPending = useCallback(() => {
        actionPendingRef.current = false;
        setIsActionPending(false);
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    }, []);

    // Clear pending on turn change
    useEffect(() => {
        clearPending();
    }, [isMyTurn]); // eslint-disable-line react-hooks/exhaustive-deps

    // 🔒 Guarded action wrappers
    const guardedFold = useCallback(async () => {
        if (actionPendingRef.current) return;
        markPending();
        try { await fold(); } catch (err: any) { toast.error(err?.message || 'Action rejected'); } finally { clearPending(); }
    }, [fold, markPending, clearPending]);

    const guardedCheck = useCallback(async () => {
        if (actionPendingRef.current) return;
        markPending();
        try { await check(); } catch (err: any) { toast.error(err?.message || 'Action rejected'); } finally { clearPending(); }
    }, [check, markPending, clearPending]);

    const guardedCall = useCallback(async (amount: number) => {
        if (actionPendingRef.current) return;
        markPending();
        try { await call(amount); } catch (err: any) { toast.error(err?.message || 'Action rejected'); } finally { clearPending(); }
    }, [call, markPending, clearPending]);

    const guardedRaise = useCallback(async (amount: number) => {
        if (actionPendingRef.current) return;
        markPending();
        try { await raise(amount); } catch (err: any) { toast.error(err?.message || 'Action rejected'); } finally { clearPending(); }
    }, [raise, markPending, clearPending]);

    const guardedAllIn = useCallback(async () => {
        if (actionPendingRef.current) return;
        markPending();
        try { await allIn(); } catch (err: any) { toast.error(err?.message || 'Action rejected'); } finally { clearPending(); }
    }, [allIn, markPending, clearPending]);

    // 🟣 Gate action buttons during deal sequence
    const [isDealing, setIsDealing] = useState(false);
    const prevPhaseRef = useRef<string | undefined>(phase);
    const dealingTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const prevPhase = prevPhaseRef.current;
        prevPhaseRef.current = phase;
        if (prevPhase !== 'preflop' && phase === 'preflop') {
            setIsDealing(true);
            const playerCount = displayState?.players?.filter(
                (p: { status: string }) => p.status === 'active' || p.status === 'all-in'
            ).length ?? 2;
            const dealDuration = 800 + 2 * playerCount * 120 + 500;
            if (dealingTimerRef.current) clearTimeout(dealingTimerRef.current);
            dealingTimerRef.current = setTimeout(() => setIsDealing(false), dealDuration);
            return () => { if (dealingTimerRef.current) clearTimeout(dealingTimerRef.current); };
        }
        if (phase && phase !== 'preflop' && phase !== 'waiting') {
            setIsDealing(false);
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    // Safety: server says it's our turn → dealing must be done after min delay
    const myTurnTimerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (isMyTurn && isDealing) {
            if (myTurnTimerRef.current) clearTimeout(myTurnTimerRef.current);
            myTurnTimerRef.current = setTimeout(() => setIsDealing(false), 2000);
            return () => { if (myTurnTimerRef.current) clearTimeout(myTurnTimerRef.current); };
        }
    }, [isMyTurn, isDealing]);

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl
                transition-all duration-300 ease-out
                border-2
                ${isMyTurn
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                    : 'border-white/10 hover:border-white/25'
                }
                bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
            `}
        >
            {/* THE REAL FELT — rendered via UniversalScaler */}
            <div className="absolute inset-0">
                {displayState ? (
                    <TableLayoutProvider>
                        <UniversalScaler baseWidth={1280} baseHeight={600} maxScale={2}>
                            <div className="relative w-[1280px] h-[600px] flex items-center justify-center">
                                <PokerTableContent
                                    players={displayState.players}
                                    heroSeatIndex={heroSeatIndex}
                                    pot={displayState.pot}
                                    pots={displayState.pots}
                                    communityCards={displayState.communityCards}
                                    isPortrait={false}
                                    radiusConfig={LANDSCAPE_RADIUS}
                                    phase={phase}
                                    isSpectator={!isJoined}
                                    bigBlind={bigBlind}
                                />
                            </div>
                        </UniversalScaler>
                    </TableLayoutProvider>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-white/30 text-sm">Loading table...</div>
                    </div>
                )}
            </div>

            {/* ⛶ MAXIMIZE BUTTON — routes to full-screen game page */}
            <button
                onClick={() => router.push(`/game/${tableId}`)}
                className="
                    absolute top-2 right-2 z-40
                    w-8 h-8 rounded-lg
                    bg-black/50 hover:bg-black/80
                    border border-white/10 hover:border-white/30
                    flex items-center justify-center
                    text-white/50 hover:text-white
                    transition-all duration-200
                    backdrop-blur-sm
                "
                title="Open full screen"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 5V1h4M13 5V1H9M1 9v4h4M13 9v4H9" />
                </svg>
            </button>

            {/* 🟣 ACTION BAR — absolute positioned inside the cell */}
            {heroPlayer && isJoined && !isDealing && phase !== 'showdown' && (
                <div className="absolute bottom-0 left-0 right-0 z-30">
                    <GameControls
                        inline={true}
                        playerBalance={heroPlayer.balance}
                        minRaise={minRaise}
                        currentCallAmount={currentCallAmount}
                        isPlayerTurn={isMyTurn}
                        onFold={guardedFold}
                        onCheck={guardedCheck}
                        onCall={guardedCall}
                        onRaise={guardedRaise}
                        onAllIn={guardedAllIn}
                        onAction={() => { }}
                        isSittingOut={heroPlayer.status === 'sitting_out'}
                        onSitOut={() => toggleSitOut(tableId).catch(console.error)}
                        bigBlind={bigBlind || undefined}
                        totalPot={tableState?.pot ?? 0}
                        isActionPending={isActionPending || isDealing}
                    />
                </div>
            )}
        </div>
    );
}

// ============================================================
// Empty Slot — "Add Table" entry point in the grid
// ============================================================

function EmptySlot({ onClick }: { onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="
                relative overflow-hidden rounded-xl cursor-pointer
                transition-all duration-300 ease-out
                border-2 border-dashed border-white/10
                hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]
                hover:scale-[1.01] active:scale-[0.99]
                bg-slate-900/50
                group
                flex items-center justify-center min-h-[240px]
            "
        >
            <div className="flex flex-col items-center gap-3 text-white/20 group-hover:text-emerald-400/70 transition-colors duration-300">
                <div className="
                    w-16 h-16 rounded-2xl
                    border-2 border-dashed border-current
                    flex items-center justify-center
                    group-hover:border-emerald-400/50
                    transition-all duration-300
                ">
                    <i className="fa-solid fa-plus text-2xl" />
                </div>
                <span className="text-sm font-semibold tracking-wide">Add Table</span>
                <span className="text-xs text-white/10 group-hover:text-white/30 transition-colors">
                    Browse the lobby
                </span>
            </div>
        </div>
    );
}
