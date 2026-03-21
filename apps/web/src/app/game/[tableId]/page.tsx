'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TableMenuDrawer } from '@/components/game/TableMenuDrawer';
import { FloatingChat } from '@/components/game/FloatingChat';
import { RealTimeResultDrawer } from '@/components/game/RealTimeResultDrawer';
import { HandHistoryDrawer } from '@/components/game/HandHistoryDrawer';
import { CommunityCards } from '@/components/game/CommunityCards';
import { BetChip } from '@/components/game/BetChip';
import { GameControls } from '@/components/game/GameControls';
import { UniversalScaler } from '@/components/game/UniversalScaler';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { EmptySeat } from '@/components/game/EmptySeat';
import { RebuyModal } from '@/components/game/RebuyModal';
import { TopUpModal } from '@/components/game/TopUpModal';
import { WinnerRing } from '@/components/game/WinnerRing';
import { NextHandTimer } from '@/components/game/NextHandTimer';
import { ShowdownOverlay } from '@/components/game/ShowdownOverlay';
import { PotToWinnerAnimation } from '@/components/game/PotToWinnerAnimation';
import { MotionOrchestrator } from '@/components/game/MotionOrchestrator';
import { MotionEventBridge } from '@/components/game/MotionEventBridge';
import { GameTableTabBar } from '@/components/game/GameTableTabBar';
import { useTablePositions, RadiusConfig } from '@/hooks/useTablePositions';
import { useGameTable } from '@/hooks/useGameTable';
import { useGameOrchestrator, DisplayTableState } from '@/hooks/useGameOrchestrator';
import { useAnimationBridge } from '@/hooks/useAnimationBridge';
import { useSound } from '@/contexts/SoundContext';
import { useUI } from '@/contexts/UIContext';
import { TableLayoutProvider, useTableLayoutOptional } from '@/contexts/TableLayoutContext';
import { useGame } from '@/contexts/GameContext';
import { useSocket, HandResultData, TurnTimerData } from '@/contexts/SocketContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { LobbyTableDto } from '@poker/shared';
import { cn } from '@/lib/utils';
import { Player, Card as CardType, SidePot } from '@/types/game';
import { useHandStrength } from '@/hooks/useHandStrength';
import { GameVariant } from '@poker/shared';
import { toast } from 'sonner';

// ============================================
// CONSTANTS
// ============================================
import { PokerTableContent, TOTAL_SEATS, PORTRAIT_RADIUS, LANDSCAPE_RADIUS } from '@/components/game/PokerTableContent';

const ACTION_BAR_HEIGHT = 160;

type LayoutMode = 'portrait' | 'landscape';

const getLayoutMode = (width: number, height: number): LayoutMode => {
    const aspectRatio = width / height;
    return aspectRatio < 1.2 ? 'portrait' : 'landscape';
};







// ============================================
// JOIN MODAL (Focused - Spectator First)
// ============================================
const JoinTableModal: React.FC<{
    selectedSeat: number;
    onJoin: (seat: number, buyIn: number) => void;
    onCancel: () => void;
    isJoining: boolean;
    isLoading: boolean;
    userBalance: number;
    minBuyIn: number;
    maxBuyIn: number;
}> = ({ selectedSeat, onJoin, onCancel, isJoining, isLoading, userBalance, minBuyIn, maxBuyIn }) => {
    const effectiveMax = Math.min(maxBuyIn, userBalance);
    const [buyIn, setBuyIn] = useState(Math.min(userBalance, Math.round(maxBuyIn * 0.5)));

    // Ensure buyIn stays within valid range
    const clampedBuyIn = Math.max(minBuyIn, Math.min(effectiveMax, buyIn));

    // Quick-pick presets
    const presets = [
        { label: 'Min', value: minBuyIn },
        { label: '25%', value: Math.round(minBuyIn + (effectiveMax - minBuyIn) * 0.25) },
        { label: '50%', value: Math.round(minBuyIn + (effectiveMax - minBuyIn) * 0.5) },
        { label: '75%', value: Math.round(minBuyIn + (effectiveMax - minBuyIn) * 0.75) },
        { label: 'Max', value: effectiveMax },
    ].filter(p => p.value >= minBuyIn && p.value <= effectiveMax);

    // Slider step: smaller steps for better granularity
    const sliderStep = Math.max(1, Math.floor((effectiveMax - minBuyIn) / 100));

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div
                className="relative bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 w-[92%] max-w-md shadow-2xl"
                style={{
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.08)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                    ✕
                </button>

                {/* Header with Icon */}
                <div className="text-center mb-5">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                        <span className="text-2xl">🪑</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Take Seat {selectedSeat + 1}</h2>
                    <p className="text-slate-400 text-sm mt-1">Choose your buy-in amount</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm">Loading wallet...</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Wallet Balance Card */}
                        <div className="bg-slate-800/60 rounded-xl p-3.5 flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                                    <span className="text-sm">💰</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Wallet Balance</span>
                                    <span className="text-white font-bold text-base">${userBalance.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Table Range</span>
                                <span className="text-slate-300 font-medium text-sm">
                                    ${minBuyIn.toLocaleString()} – ${maxBuyIn.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Buy-In Amount Display */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-slate-400">Buy-In Amount</label>
                                <span className="text-emerald-400 font-mono font-bold text-lg tabular-nums">
                                    ${clampedBuyIn.toLocaleString()}
                                </span>
                            </div>

                            {/* Styled Slider */}
                            <input
                                type="range"
                                min={minBuyIn}
                                max={effectiveMax}
                                step={sliderStep}
                                value={clampedBuyIn}
                                onChange={(e) => setBuyIn(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                style={{
                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((clampedBuyIn - minBuyIn) / (effectiveMax - minBuyIn || 1)) * 100}%, #334155 ${((clampedBuyIn - minBuyIn) / (effectiveMax - minBuyIn || 1)) * 100}%, #334155 100%)`,
                                }}
                                disabled={effectiveMax <= 0}
                            />
                            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                                <span>${minBuyIn.toLocaleString()}</span>
                                <span>${effectiveMax.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Quick-Pick Presets */}
                        <div className="flex gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => setBuyIn(preset.value)}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-semibold rounded-lg transition-all border",
                                        clampedBuyIn === preset.value
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                                            : "bg-slate-800/80 text-slate-400 border-transparent hover:bg-slate-700 hover:text-slate-300"
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Insufficient Balance Warning */}
                        {userBalance < minBuyIn && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                                <p className="text-red-400 text-sm font-medium">
                                    Insufficient balance. Minimum: ${minBuyIn.toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Sit Down Button */}
                        <button
                            onClick={() => onJoin(selectedSeat, clampedBuyIn)}
                            disabled={isJoining || clampedBuyIn > userBalance || clampedBuyIn <= 0 || userBalance < minBuyIn}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-white text-base transition-all",
                                isJoining
                                    ? "bg-slate-700 cursor-wait"
                                    : (clampedBuyIn <= 0 || userBalance < minBuyIn)
                                        ? "bg-slate-800 cursor-not-allowed opacity-40"
                                        : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/40 active:scale-[0.98]"
                            )}
                        >
                            {isJoining ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Joining...
                                </span>
                            ) : (
                                `Sit Down · $${clampedBuyIn.toLocaleString()}`
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// MAIN PAGE
// ============================================
export default function GamePage({ params }: { params: Promise<{ tableId: string }> }) {
    const resolvedParams = React.use(params);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('portrait');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const sessionStartRef = useRef(Math.floor(Date.now() / 1000));
    const { isMuted, toggleMute } = useSound();
    // Spectator First: Modal is hidden until user clicks a ghost seat
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
    const [showRebuyModal, setShowRebuyModal] = useState(false);
    const [isDepositMinimized, setIsDepositMinimized] = useState(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const { user, isLoading: isUserLoading } = useGame();
    const { tables, toggleSitOut, toggleLNBB, toggleAutoRebuy, removeTable } = useSocket();
    const router = useRouter();
    // Read per-table ephemeral state from the multiplexed dictionary
    const tableSlice = tables[resolvedParams.tableId];
    const handResult = tableSlice?.handResult ?? null;
    const offlineSeats = tableSlice?.offlineSeats ?? {};
    const turnTimer = tableSlice?.turnTimer ?? null;
    const uncalledBetRefund = tableSlice?.uncalledBetRefund ?? null;
    const rawSocketState = tableSlice?.tableState ?? null;

    // Fetch table config for buy-in limits (Blue Cable)
    const { data: tableInfo } = useQuery<LobbyTableDto>({
        queryKey: ['table-info', resolvedParams.tableId],
        queryFn: () => api.get(`/game/tables/${resolvedParams.tableId}`).then(r => r.data),
        staleTime: 60000, // Cache for 1 minute
    });

    // Live game state
    const {
        tableState,
        isConnected,
        isJoined,
        isJoining,
        isMyTurn,
        heroPlayer,
        heroSeatIndex,
        currentCallAmount,
        minRaise,
        bigBlind: tableBigBlind,
        error,
        join,
        leave,
        fold,
        check,
        call,
        raise,
        allIn,
        joinWaitlist,
        leaveWaitlist,
    } = useGameTable({
        tableId: resolvedParams.tableId,
        autoJoin: false,
    });

    // Layout detection
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setLayoutMode(getLayoutMode(width, height));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🔒 DOUBLE LOCK: Direct URL Guard for private tables
    // If someone pastes the table URL without having validated the password,
    // redirect them to the lobby with an authority toast.
    useEffect(() => {
        if (!tableInfo) return; // Wait for table config to load
        if (tableInfo.isPrivate) {
            const storedPassword = sessionStorage.getItem(`table_password_${resolvedParams.tableId}`);
            if (!storedPassword) {
                toast.error('This is a private table. Please join from the Lobby to enter the password.', {
                    duration: 5000,
                });
                router.replace('/lobby');
            }
        }
    }, [tableInfo, resolvedParams.tableId, router]);

    // Hide join modal when joined
    useEffect(() => {
        if (isJoined) {
            setShowJoinModal(false);
        }
    }, [isJoined]);

    // Ghost Protocol: Detect when hero player is truly busted
    // AGGRESSIVE GUARD: Only show if player is genuinely broke and NOT in an active hand
    // AUTO-REBUY SUPPRESSOR: If autoRebuy is on, suppress the modal — the server will refill chips.
    // If the server disables autoRebuy (insufficient funds), this re-fires and shows the modal as fallback.
    useEffect(() => {
        if (!heroPlayer || heroPlayer.balance !== 0) return;

        // Check autoRebuy flag from raw socket state (not mapped into heroPlayer)
        const rawPlayers = Array.isArray(rawSocketState?.players) ? rawSocketState.players : [];
        const heroRaw = rawPlayers.find((p: any) => p.id === user?.id) as any;
        const isAutoRebuy = !!heroRaw?.autoRebuy;

        // If Auto Rebuy is active, stay calm — the server will handle it
        if (isAutoRebuy) return;

        const status = heroPlayer.status?.toLowerCase() || '';
        const isAllIn = status === 'all-in';
        const isActive = status === 'active';
        const isSittingOut = status === 'sitting_out';
        const isShowdown = tableState?.phase === 'showdown';

        // Only show rebuy if player is truly done (not all-in, not active, not in showdown)
        if (!isAllIn && !isActive && !isSittingOut && !isShowdown) {
            setShowRebuyModal(true);
            setIsDepositMinimized(false); // Always open fresh
        }
    }, [heroPlayer, tableState?.phase, rawSocketState, user]);

    const handleJoin = useCallback((seat: number, buyIn: number) => {
        join(seat, buyIn);
    }, [join]);

    const handleLeave = useCallback(async () => {
        try {
            // Await leave_table so Redis seat key is cleaned up BEFORE navigation.
            // Without this, session_recovered fires on the lobby and pulls us back.
            await Promise.race([
                leave(),
                new Promise(resolve => setTimeout(resolve, 2000)), // Safety: don't hang forever
            ]);
        } catch { /* socket may not be connected */ }

        // 🟣 Surgical Teardown: clean up this table's state slice
        removeTable(resolvedParams.tableId);

        // Smart routing: if other tables are still open, go to grid; else lobby
        const remaining = Object.keys(tables).filter(id => id !== resolvedParams.tableId);
        if (remaining.length > 0) {
            router.push('/play');
        } else {
            router.push('/lobby');
        }
    }, [leave, removeTable, tables, resolvedParams.tableId, router]);

    /** Stand Up: give up seat, become spectator (no redirect) */
    const handleStandUp = useCallback(async () => {
        try {
            await Promise.race([
                leave(),
                new Promise(resolve => setTimeout(resolve, 2000)),
            ]);
        } catch { /* socket may not be connected */ }
        // Player stays on the page as spectator — no redirect
    }, [leave]);

    const handleToggleSitOut = useCallback(() => {
        toggleSitOut(resolvedParams.tableId).catch(console.error);
    }, [toggleSitOut, resolvedParams.tableId]);

    // Spectator First: Opens modal when a ghost seat is clicked
    const handleSeatClick = useCallback((seatIndex: number) => {
        setSelectedSeat(seatIndex);
        setShowJoinModal(true);
    }, []);

    const radiusConfig = layoutMode === 'portrait' ? PORTRAIT_RADIUS : LANDSCAPE_RADIUS;

    // ============================================================

    /**
     * Convert CSS percentage position to pixel coords within the scaled container.
     * The table renders inside a fixed-size div (360×640 portrait, 1280×600 landscape).
     */
    const getPhantomCoords = useCallback((percentLeft: string, percentTop: string) => {
        const containerW = layoutMode === 'portrait' ? 360 : 1280;
        const containerH = layoutMode === 'portrait' ? 640 : 600;
        const left = parseFloat(percentLeft) / 100 * containerW;
        const top = parseFloat(percentTop) / 100 * containerH;
        return { x: left, y: top };
    }, [layoutMode]);

    // Pot center = exact center of the table container
    const potCenter = useMemo(() => {
        const containerW = layoutMode === 'portrait' ? 360 : 1280;
        const containerH = layoutMode === 'portrait' ? 640 : 600;
        return { x: containerW / 2, y: containerH / 2 };
    }, [layoutMode]);

    // 🟣 Pre-compute hero chip position for phantom spawning
    // Now uses avatar position (chips are radially anchored to seat)
    const heroChipPositions = useMemo(() => {
        const positions = (function computePositions() {
            const { outerX, outerY } = radiusConfig;
            const totalSeats = TOTAL_SEATS;
            const predefinedAngles = [90, 130, 170, 215, 255, 290, 325, 10, 50]; // 9-Max angles
            const rotationSteps = (totalSeats - heroSeatIndex) % totalSeats;
            const visualIndex = (heroSeatIndex + rotationSteps) % totalSeats;
            const angle = predefinedAngles[visualIndex];
            // Use avatar position (not chipFactor) — chips are now anchored to seat
            const rad = (angle * Math.PI) / 180;
            return {
                left: `${(50 + outerX * Math.cos(rad)).toFixed(2)}%`,
                top: `${(50 + outerY * Math.sin(rad)).toFixed(2)}%`,
            };
        })();
        return getPhantomCoords(positions.left, positions.top);
    }, [radiusConfig, heroSeatIndex, getPhantomCoords]);

    // ============================================================
    // 🟣 DEFENSIVE UX — Action Pending State + Error Toasts
    // ============================================================
    const actionPendingRef = useRef(false);
    const [isActionPending, setIsActionPending] = useState(false);
    const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Mark action as pending with a 5s safety timeout auto-reset */
    const markPending = useCallback(() => {
        actionPendingRef.current = true;
        setIsActionPending(true);
        // Safety timeout: if socket ack never fires, unlock after 5s
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = setTimeout(() => {
            actionPendingRef.current = false;
            setIsActionPending(false);
            pendingTimerRef.current = null;
        }, 5000);
    }, []);

    /** Clear pending state (call in finally blocks) */
    const clearPending = useCallback(() => {
        actionPendingRef.current = false;
        setIsActionPending(false);
        if (pendingTimerRef.current) {
            clearTimeout(pendingTimerRef.current);
            pendingTimerRef.current = null;
        }
    }, []);

    // Auto-reset pending when turn changes (hand moves on, server pushed new state)
    useEffect(() => {
        clearPending();
    }, [isMyTurn]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Phantom-aware action wrapper: spawn chips → sendAction → confirm or reject.
     * Fold has NO phantom (no chips move). Check has NO phantom (no chips move).
     * Call/Raise/All-In spawn phantom chips flying to the pot.
     * ALL actions use actionPendingRef guard to prevent double-tap socket flooding.
     */
    const guardedFold = useCallback(async () => {
        if (actionPendingRef.current) return;
        markPending();
        try {
            await fold();
        } catch (err: any) {
            toast.error(err?.message || 'Action rejected by server');
        } finally {
            clearPending();
        }
    }, [fold, markPending, clearPending]);

    const guardedCheck = useCallback(async () => {
        if (actionPendingRef.current) return;
        markPending();
        try {
            await check();
        } catch (err: any) {
            toast.error(err?.message || 'Action rejected by server');
        } finally {
            clearPending();
        }
    }, [check, markPending, clearPending]);

    const phantomCall = useCallback(async (amount: number) => {
        if (actionPendingRef.current) return;
        markPending();
        try {
            await call(amount);
        } catch (err: any) {
            toast.error(err?.message || 'Action rejected by server');
        } finally {
            clearPending();
        }
    }, [call, markPending, clearPending]);

    const phantomRaise = useCallback(async (amount: number) => {
        if (actionPendingRef.current) return;
        markPending();
        try {
            await raise(amount);
        } catch (err: any) {
            toast.error(err?.message || 'Action rejected by server');
        } finally {
            clearPending();
        }
    }, [raise, markPending, clearPending]);

    const phantomAllIn = useCallback(async () => {
        if (actionPendingRef.current) return;
        markPending();
        try {
            await allIn();
        } catch (err: any) {
            toast.error(err?.message || 'Action rejected by server');
        } finally {
            clearPending();
        }
    }, [allIn, markPending, clearPending]);

    // REST FALLBACK: Build a skeleton table state from REST API data
    // This ensures the felt + ghost seats render immediately, even before socket connects.
    // When the socket eventually sends real state, it seamlessly replaces this skeleton.
    const effectiveTableState = useMemo(() => {
        // Prefer live socket state
        if (tableState) return tableState;

        // Fallback: Build skeleton from REST data
        if (tableInfo) {
            return {
                id: tableInfo.id,
                name: tableInfo.name,
                stakes: tableInfo.stakes || '$0/$0',
                pot: 0,
                phase: 'waiting' as const,
                communityCards: [] as CardType[],
                players: [] as Array<Player & { seatIndex: number }>,
            };
        }

        return null;
    }, [tableState, tableInfo]);

    // 🔗 Animation Bridge: connects MotionOrchestrator (inside context) to useGameOrchestrator (outside)
    const animBridge = useAnimationBridge();

    // === THE VIBE LAYER ===
    // Wrap network state with orchestrator: animations play BEFORE state updates
    const { displayState } = useGameOrchestrator(
        effectiveTableState as DisplayTableState | null,
        animBridge.onAnimationSettled
    );

    // Get phase from display state (lagged behind network for animation flow)
    const phase = displayState?.phase;

    // 🟣 Purple Cable: Gate action buttons during deal sequence
    const [isDealing, setIsDealing] = useState(false);
    const prevPhaseMainRef = useRef<string | undefined>(phase);
    const dealingTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const prevPhase = prevPhaseMainRef.current;
        prevPhaseMainRef.current = phase;

        if (prevPhase !== 'preflop' && phase === 'preflop') {
            setIsDealing(true);
            const playerCount = displayState?.players?.filter(
                (p: { status: string }) => p.status === 'active' || p.status === 'all-in'
            ).length ?? 2;
            const dealDuration = 800 + 2 * playerCount * 120 + 500;
            if (dealingTimerRef.current) clearTimeout(dealingTimerRef.current);
            dealingTimerRef.current = setTimeout(() => setIsDealing(false), dealDuration);
            return () => {
                if (dealingTimerRef.current) clearTimeout(dealingTimerRef.current);
            };
        }

        // Safety override: if phase moved past preflop, dealing is done
        if (phase && phase !== 'preflop' && phase !== 'waiting') {
            setIsDealing(false);
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    // Safety override: server says it's our turn → dealing must be done
    // BUT only after a minimum delay to let the deal animation play.
    // The server sends 'your_turn' at the same time as the deal, so we
    // can't blindly clear isDealing immediately.
    const myTurnTimerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (isMyTurn && isDealing) {
            // Allow at least 2s for deal animation before showing action bar
            if (myTurnTimerRef.current) clearTimeout(myTurnTimerRef.current);
            myTurnTimerRef.current = setTimeout(() => setIsDealing(false), 2000);
            return () => {
                if (myTurnTimerRef.current) clearTimeout(myTurnTimerRef.current);
            };
        }
    }, [isMyTurn, isDealing]);

    return (
        <TableLayoutProvider>
            <MotionOrchestrator registerSettler={animBridge.register}>
                <MotionEventBridge
                    tableState={tableState}
                    heroSeatIndex={heroSeatIndex}
                    isJoined={isJoined}
                    handResult={handResult}
                >
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: '100dvh',
                            width: '100vw',
                            display: 'flex',
                            background: 'var(--color-background)',
                        }}
                    >
                        {/* Connection Status */}
                        {!isConnected && (
                            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-bold">
                                Connecting to server...
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white px-4 py-2 rounded-full text-sm">
                                {error}
                            </div>
                        )}

                        {/* 🟣 Purple Cable: Inline Multi-Table Tab Bar */}
                        <GameTableTabBar
                            tables={tables}
                            currentTableId={resolvedParams.tableId}
                            heroUserId={user?.id}
                        />

                        {/* Join Modal - Opens when ghost seat is clicked */}
                        {showJoinModal && isConnected && !isJoined && selectedSeat !== null && (
                            <JoinTableModal
                                selectedSeat={selectedSeat}
                                onJoin={handleJoin}
                                onCancel={() => {
                                    setShowJoinModal(false);
                                    setSelectedSeat(null);
                                }}
                                isJoining={isJoining}
                                isLoading={isUserLoading}
                                userBalance={user?.balance ?? 0}
                                minBuyIn={tableInfo?.minBuyIn ?? 100}
                                maxBuyIn={tableInfo?.maxBuyIn ?? 10000}
                            />
                        )}

                        {/* Ghost Protocol: Rebuy Modal — ALWAYS MOUNTED (Purple Cable) */}
                        <RebuyModal
                            tableId={resolvedParams.tableId}
                            isOpen={showRebuyModal}
                            onClose={() => setShowRebuyModal(false)}
                            minBuyIn={tableInfo?.minBuyIn ?? 500}
                            maxBuyIn={tableInfo?.maxBuyIn ?? 2000}
                            onStandUp={() => {
                                // Leave the seat but stay on the page as spectator
                                leave().catch(() => { });
                                setShowRebuyModal(false);
                                setIsDepositMinimized(false);
                            }}
                            isMinimized={isDepositMinimized}
                            onMinimize={() => setIsDepositMinimized(true)}
                            onRestore={() => setIsDepositMinimized(false)}
                        />

                        {/* 🟣 Purple Cable: Floating "Resume Deposit" FAB when minimized */}
                        {showRebuyModal && isDepositMinimized && (
                            <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[55]">
                                <button
                                    onClick={() => setIsDepositMinimized(false)}
                                    className="bg-amber-500/90 hover:bg-amber-400 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-400/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 animate-pulse"
                                >
                                    <span>🏦</span>
                                    Resume Deposit
                                </button>
                            </div>
                        )}

                        {/* Voluntary Top Up Modal */}
                        <TopUpModal
                            tableId={resolvedParams.tableId}
                            isOpen={showTopUpModal}
                            onClose={() => setShowTopUpModal(false)}
                            minBuyIn={tableInfo?.minBuyIn ?? 500}
                            maxBuyIn={tableInfo?.maxBuyIn ?? 2000}
                            currentStack={(heroPlayer as any)?.chips ?? 0}
                            walletBalance={user?.balance ?? 0}
                        />


                        {/* LAYER 1: THE POKER TABLE */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: ACTION_BAR_HEIGHT,
                                zIndex: 0,
                                padding: 0
                            }}
                        >
                            {displayState ? (
                                layoutMode === 'portrait' ? (
                                    <UniversalScaler baseWidth={380} baseHeight={700} maxScale={1.15}>
                                        <div className="relative w-[380px] h-[700px]">
                                            <PokerTableContent
                                                players={displayState.players}
                                                heroSeatIndex={heroSeatIndex}
                                                pot={displayState.pot}
                                                pots={displayState.pots}
                                                communityCards={displayState.communityCards}
                                                isPortrait={true}
                                                radiusConfig={radiusConfig}
                                                phase={phase}
                                                onRebuy={() => { setShowRebuyModal(true); setIsDepositMinimized(false); }}
                                                onResumePlay={handleToggleSitOut}
                                                onSeatClick={handleSeatClick}
                                                isSpectator={!isJoined}
                                                handResult={handResult}
                                                offlineSeats={offlineSeats}
                                                turnTimer={turnTimer}
                                                variant={tableInfo?.variant}
                                                uncalledBetRefund={uncalledBetRefund}
                                                onResumeDeposit={showRebuyModal && isDepositMinimized ? () => setIsDepositMinimized(false) : undefined}
                                                bigBlind={tableBigBlind}
                                            />
                                        </div>
                                    </UniversalScaler>
                                ) : (
                                    <UniversalScaler baseWidth={1280} baseHeight={600} maxScale={1.4}>
                                        <div className="relative w-[1280px] h-[600px] flex items-center justify-center">
                                            <PokerTableContent
                                                players={displayState.players}
                                                heroSeatIndex={heroSeatIndex}
                                                pot={displayState.pot}
                                                pots={displayState.pots}
                                                communityCards={displayState.communityCards}
                                                isPortrait={false}
                                                radiusConfig={radiusConfig}
                                                phase={phase}
                                                onRebuy={() => { setShowRebuyModal(true); setIsDepositMinimized(false); }}
                                                onResumePlay={handleToggleSitOut}
                                                onSeatClick={handleSeatClick}
                                                isSpectator={!isJoined}
                                                handResult={handResult}
                                                offlineSeats={offlineSeats}
                                                turnTimer={turnTimer}
                                                variant={tableInfo?.variant}
                                                uncalledBetRefund={uncalledBetRefund}
                                                onResumeDeposit={showRebuyModal && isDepositMinimized ? () => setIsDepositMinimized(false) : undefined}
                                                bigBlind={tableBigBlind}
                                            />
                                        </div>
                                    </UniversalScaler>
                                )
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-white/50 text-lg">Loading table...</div>
                                </div>
                            )}
                        </div>

                        {/* LAYER 2: SIDE DRAWER MENU (replaces old floating pill) */}
                        <TableMenuDrawer
                            isSoundOn={!isMuted}
                            onToggleSound={toggleMute}
                            isChatOpen={isChatOpen}
                            onToggleChat={() => setIsChatOpen(!isChatOpen)}
                            onLeave={handleLeave}
                            onToggleStats={() => setIsStatsOpen(!isStatsOpen)}
                            isStatsOpen={isStatsOpen}
                            onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                            isHistoryOpen={isHistoryOpen}
                            unreadChatCount={isChatOpen ? 0 : unreadChatCount}
                            onStandUp={handleStandUp}
                            onSitOut={handleToggleSitOut}
                            onRebuy={() => setShowRebuyModal(true)}
                            onTopUp={() => setShowTopUpModal(true)}
                            isLeaveNextBB={(() => {
                                // Read raw leaveNextBB from socket state for the hero player
                                if (!rawSocketState?.players || !user) return false;
                                const rawPlayers = Array.isArray(rawSocketState.players) ? rawSocketState.players : [];
                                const heroRaw = rawPlayers.find((p: any) => p.id === user.id) as any;
                                return !!heroRaw?.leaveNextBB;
                            })()}
                            onToggleLNBB={(value: boolean) => {
                                toggleLNBB(resolvedParams.tableId, value).catch(console.error);
                            }}
                            isAutoRebuy={(() => {
                                if (!rawSocketState?.players || !user) return false;
                                const rawPlayers = Array.isArray(rawSocketState.players) ? rawSocketState.players : [];
                                const heroRaw = rawPlayers.find((p: any) => p.id === user.id) as any;
                                return !!heroRaw?.autoRebuy;
                            })()}
                            onToggleAutoRebuy={(value: boolean) => {
                                toggleAutoRebuy(resolvedParams.tableId, value).catch(console.error);
                            }}
                        />

                        {/* LAYER 3: FLOATING ACTION BAR */}
                        {heroPlayer && isJoined && !isDealing && phase !== 'showdown' && (
                            <GameControls
                                playerBalance={heroPlayer.balance}
                                minRaise={minRaise}
                                currentCallAmount={currentCallAmount}
                                isPlayerTurn={isMyTurn}
                                onFold={guardedFold}
                                onCheck={guardedCheck}
                                onCall={phantomCall}
                                onRaise={phantomRaise}
                                onAllIn={phantomAllIn}
                                onAction={() => { }}
                                onSitOut={handleToggleSitOut}
                                isSittingOut={heroPlayer.status === 'sitting_out'}
                                sitOutStart={heroPlayer.sitOutStart}
                                bigBlind={tableBigBlind || undefined}
                                totalPot={tableState?.pot ?? 0}
                                variant={tableInfo?.variant as any}
                                isActionPending={isActionPending || isDealing}
                            />
                        )}

                        {/* LAYER 4: CHAT WIDGET */}
                        <FloatingChat
                            isOpen={isChatOpen}
                            onToggle={() => setIsChatOpen(!isChatOpen)}
                            tableId={resolvedParams.tableId}
                            onUnreadCountChange={setUnreadChatCount}
                        />

                        {/* LAYER 5: REAL TIME RESULT DRAWER */}
                        {(() => {
                            // Parse blinds from stakes string (e.g. "$250/$500")
                            const stakeParts = (tableState?.stakes || '').replace(/\$/g, '').split('/');
                            const sb = parseInt(stakeParts[0]) || 10;
                            const bb = parseInt(stakeParts[1]) || 20;
                            return (
                                <RealTimeResultDrawer
                                    isOpen={isStatsOpen}
                                    onClose={() => setIsStatsOpen(false)}
                                    tableName={tableState?.name || tableInfo?.name || 'Table'}
                                    variant={tableInfo?.variant === 'OMAHA' ? 'PLO' : 'NLH'}
                                    smallBlind={sb}
                                    bigBlind={bb}
                                    players={(tableState?.players || []).map(p => ({
                                        username: p.name,
                                        avatarId: p.avatarId,
                                        chips: p.balance,
                                        totalBuyIn: p.totalBuyIn || p.balance,
                                        seatNumber: p.seatIndex ?? 0,
                                        status: p.status,
                                    }))}
                                    waitlist={tableState?.waitlist || []}
                                    observers={tableState?.observers || []}
                                    sessionStart={sessionStartRef.current}
                                />
                            );
                        })()}

                        {/* LAYER 6: HAND HISTORY DRAWER */}
                        <HandHistoryDrawer
                            isOpen={isHistoryOpen}
                            onClose={() => setIsHistoryOpen(false)}
                            tableId={resolvedParams.tableId}
                        />
                    </div>
                </MotionEventBridge>
            </MotionOrchestrator>
        </TableLayoutProvider >
    );
}
