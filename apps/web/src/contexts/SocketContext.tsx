'use client';

/**
 * Socket Context - Red Cable Frontend Integration (Multi-Table Multiplexer)
 * 
 * Manages a SINGLE Socket.io connection to GameGateway.
 * Routes all incoming events by tableId to the correct table slice.
 * State shape: tables: Record<tableId, TableSlice>
 * 
 * @see ARCHITECTURE.md Section 2.1 - The Gateway
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    ReactNode,
    useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useSound } from './SoundContext';
import {
    TableSnapshot,
    TableSnapshotSchema,
    BetAction,
    JoinTableEvent,
    LeaveTableEvent,
    PlayerConnectionStatusEvent,
    PlayerJoinedEvent,
    UncalledBetReturnedEvent,
} from '@poker/shared';
import { toast } from 'sonner';

// ============================================================
// Types
// ============================================================

/** Winner info from showdown.lua */
export interface WinnerInfo {
    seat: number;
    amount: number;
    displayAmount?: number;
    handDescription: string;
    type?: string;
    winningCards?: string[];
}

/** Data from the hand_result socket event */
export interface HandResultData {
    tableId?: string;
    winners?: WinnerInfo[];
    winningSeat?: number;
    message: string;
    nextHandDelay: number;
    nextHandTimestamp: number;
    handName?: string;
    revealedHands?: { seat: number; cards: string[]; handDescription?: string }[];
}

/** Turn timer info captured from 'your_turn' socket event */
export interface TurnTimerData {
    /** Which seat the turn belongs to */
    seat: number;
    /** Total duration of the turn in ms (from table config, e.g. 30000) */
    durationMs: number;
    /** Timestamp when the turn started (Date.now() at receipt) */
    startedAt: number;
    /** Whether the player is currently using their time bank */
    isTimeBank?: boolean;
}

/** Per-table ephemeral state bucket */
export interface TableSlice {
    tableState: TableSnapshot | null;
    countdown: number | null;
    isMyTurn: boolean;
    handResult: HandResultData | null;
    turnTimer: TurnTimerData | null;
    offlineSeats: Record<number, boolean>;
    uncalledBetRefund: UncalledBetReturnedEvent | null;
}

/** Default empty slice for new tables */
const EMPTY_SLICE: TableSlice = {
    tableState: null,
    countdown: null,
    isMyTurn: false,
    handResult: null,
    turnTimer: null,
    offlineSeats: {},
    uncalledBetRefund: null,
};

interface SocketContextType {
    /** Socket.io connection instance */
    socket: Socket | null;
    /** Whether socket is currently connected */
    isConnected: boolean;
    /** All active table states keyed by tableId */
    tables: Record<string, TableSlice>;
    /** Currently focused table (for mobile tab switching) */
    activeTableId: string | null;
    /** Set the active table for mobile tab switching */
    setActiveTableId: (id: string | null) => void;
    /** Error message from socket operations */
    error: string | null;
    /** Subscribe to a table as spectator (without taking a seat) */
    subscribeTable: (tableId: string) => Promise<void>;
    /** Join a table */
    joinTable: (event: JoinTableEvent) => Promise<void>;
    /** Leave current table */
    leaveTable: (tableId: string) => Promise<void>;
    /** Perform a game action (fold, check, call, raise) */
    sendAction: (action: BetAction) => Promise<void>;
    /** Toggle sit-out status (coffee cup) */
    toggleSitOut: (tableId: string) => Promise<void>;
    /** Toggle Leave Next Big Blind flag */
    toggleLNBB: (tableId: string, value: boolean) => Promise<void>;
    /** Toggle Auto Rebuy preference */
    toggleAutoRebuy: (tableId: string, value: boolean) => Promise<void>;
    /** Set Auto-Muck preference (Red Cable) */
    setAutoMuck: (tableId: string, value: boolean) => Promise<void>;
    /** Extend seat for deposit — hold seat for 180s while player deposits */
    extendSeatForDeposit: (tableId: string) => Promise<{ success: boolean; sitOutBank?: number }>;
    /** Join the waitlist for a full table */
    joinWaitlist: (tableId: string) => void;
    /** Leave the waitlist */
    leaveWaitlist: (tableId: string) => void;
    /** Remove a table from state (when leaving) */
    removeTable: (tableId: string) => void;

    // ── LEGACY SHIMS ──
    // These provide backward-compatible access to the "active" table's state.
    // Components that haven't migrated to multi-table can still use these.
    /** @deprecated Use tables[tableId].tableState instead */
    tableState: TableSnapshot | null;
    /** @deprecated Use tables[tableId].countdown instead */
    countdown: number | null;
    /** @deprecated Use tables[tableId].isMyTurn instead */
    isMyTurn: boolean;
    /** @deprecated Use tables[tableId].handResult instead */
    handResult: HandResultData | null;
    /** @deprecated Use tables[tableId].turnTimer instead */
    turnTimer: TurnTimerData | null;
    /** @deprecated Use tables[tableId].offlineSeats instead */
    offlineSeats: Record<number, boolean>;
    /** @deprecated Use tables[tableId].uncalledBetRefund instead */
    uncalledBetRefund: UncalledBetReturnedEvent | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// ============================================================
// Helper: update a single table's slice immutably
// ============================================================

function updateSlice(
    prev: Record<string, TableSlice>,
    tableId: string,
    patch: Partial<TableSlice>,
): Record<string, TableSlice> {
    const existing = prev[tableId] ?? { ...EMPTY_SLICE };
    return { ...prev, [tableId]: { ...existing, ...patch } };
}

// ============================================================
// Provider
// ============================================================

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [tables, setTables] = useState<Record<string, TableSlice>>({});
    const [activeTableId, setActiveTableId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { playSound } = useSound();
    const prevTableStatesRef = useRef<Record<string, TableSnapshot>>({});
    // Persist the last known turn duration per-table
    const lastTurnDurationRef = useRef<Record<string, number>>({});
    const getLastTurnDuration = (tableId: string) => lastTurnDurationRef.current[tableId] ?? 30000;

    // ── SOUND TRIGGERS (per-table) ──
    // Monitor tables for sound triggers — only play sounds for the active table
    useEffect(() => {
        // Only trigger sounds for the active table (or the first table if none set)
        const currentTableId = activeTableId ?? Object.keys(tables)[0];
        if (!currentTableId) return;

        const slice = tables[currentTableId];
        const currentState = slice?.tableState;
        const prevState = prevTableStatesRef.current[currentTableId];

        if (!currentState || !prevState) {
            if (currentState) {
                prevTableStatesRef.current[currentTableId] = currentState;
            }
            return;
        }

        // 🟣 Showdown Guard
        const currentPhase = (currentState.table as any).phase;
        const prevPhase = (prevState.table as any).phase;
        if (currentPhase === 'showdown' || (currentPhase === 'waiting' && prevPhase === 'showdown')) {
            prevTableStatesRef.current[currentTableId] = currentState;
            return;
        }

        // 1. Street Change (Deal)
        if (prevState.table.phase !== currentState.table.phase) {
            if (['preflop', 'flop', 'turn', 'river'].includes(currentState.table.phase)) {
                playSound('deal');
            }
        }

        // 2. Player Action Detection (Bet/Check)
        const prevPlayers = Array.isArray(prevState.players) ? prevState.players : [];
        const currentPlayers = Array.isArray(currentState.players) ? currentState.players : [];
        const prevTotalBet = prevPlayers.reduce((sum, p) => sum + (p?.currentBet || 0), 0);
        const currentTotalBet = currentPlayers.reduce((sum, p) => sum + (p?.currentBet || 0), 0);

        if (currentTotalBet > prevTotalBet) {
            playSound('bet');
        } else if (prevState.table.turnSeat !== currentState.table.turnSeat &&
            currentState.table.phase === prevState.table.phase &&
            currentState.table.phase !== 'showdown') {
            playSound('check');
        }

        prevTableStatesRef.current[currentTableId] = currentState;
    }, [tables, activeTableId, playSound]);

    // === REACTIVE AUTH ===
    // We use useEffect to read the token on mount (client-side only).
    // useState initializers are reused from SSR during hydration (always null),
    // so we MUST use useEffect to read localStorage on the client.
    const [authToken, setAuthToken] = useState<string | null>(null);

    // Read token on mount + listen for auth changes (login/logout/cross-tab)
    useEffect(() => {
        // Initial read on client mount
        setAuthToken(localStorage.getItem('accessToken'));

        const handleAuthChange = () => {
            setAuthToken(localStorage.getItem('accessToken'));
        };
        window.addEventListener('storage', handleAuthChange);
        window.addEventListener('auth:changed', handleAuthChange);
        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('auth:changed', handleAuthChange);
        };
    }, []);

    // Initialize socket connection — RE-FIRES when token changes
    useEffect(() => {
        const token = authToken || localStorage.getItem('accessToken');

        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const socketInstance = io(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/game`,
            {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 30000,
                randomizationFactor: 0.3,
            }
        );

        // Connection events
        socketInstance.on('connect', () => {
            console.log('[Socket] ✅ Connected:', socketInstance.id);
            setIsConnected(true);
            setError(null);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            const msg = err.message || '';
            const isAuthError = msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('jwt');

            if (isAuthError) {
                console.warn('[Socket] 🔑 Auth error on connect — attempting token refresh...');
                (async () => {
                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (!refreshToken) throw new Error('No refresh token');
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:3001/api';
                        const res = await fetch(`${apiUrl}/auth/refresh`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken }),
                        });
                        if (!res.ok) throw new Error('Refresh failed');
                        const data = await res.json();
                        localStorage.setItem('accessToken', data.accessToken);
                        localStorage.setItem('refreshToken', data.refreshToken);
                        socketInstance.auth = { token: data.accessToken };
                        socketInstance.connect();
                        console.log('[Socket] 🔑 Token refreshed, reconnecting...');
                    } catch {
                        console.error('[Socket] 🔑 Token refresh failed — hard logout');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                            window.location.href = '/login';
                        }
                    }
                })();
                return;
            }

            console.error('[Socket] Connection error:', err.message);
            setError(`Connection failed: ${err.message}`);
            setIsConnected(false);
        });

        // ============================================================
        // GAME EVENTS — Multiplexed by tableId
        // ============================================================

        socketInstance.on('table_state', (data: unknown) => {
            if (data && typeof data === 'object' && 'table' in data) {
                const snapshot = data as TableSnapshot;
                const tableId = (snapshot.table as any)?.id;
                if (!tableId) {
                    console.warn('[Socket] table_state missing table.id — cannot route');
                    return;
                }

                // ── TURN TIMER FALLBACK ──
                const newTurnSeat = Number((snapshot.table as any)?.turnSeat ?? (snapshot.table as any)?.turn_seat ?? -1);
                const phase = (snapshot.table as any)?.phase;
                const isPlaying = phase && !['waiting', 'showdown'].includes(phase);

                setTables(prev => {
                    const existing = prev[tableId] ?? { ...EMPTY_SLICE };
                    let newTurnTimer = existing.turnTimer;

                    if (isPlaying && newTurnSeat >= 0) {
                        if (!newTurnTimer || newTurnTimer.seat !== newTurnSeat) {
                            newTurnTimer = {
                                seat: newTurnSeat,
                                durationMs: getLastTurnDuration(tableId),
                                startedAt: Date.now(),
                            };
                        }
                    } else {
                        newTurnTimer = null;
                    }

                    return {
                        ...prev,
                        [tableId]: {
                            ...existing,
                            tableState: snapshot,
                            turnTimer: newTurnTimer,
                        },
                    };
                });

                // Track previous state for sound triggers
                prevTableStatesRef.current[tableId] = snapshot;

                setError(null);

                // Auto-set active table if none
                setActiveTableId(prev => prev ?? tableId);
            } else {
                console.warn('[Socket] Unexpected table_state format:', data);
            }
        });

        // ── PLAYER JOINED (Mid-Hand Scalpel) ──
        socketInstance.on('player_joined', (data: PlayerJoinedEvent & { tableId?: string }) => {
            const tableId = data.tableId;
            if (!tableId) {
                console.warn('[Socket] player_joined missing tableId');
                return;
            }
            console.log('[Socket] 🟢 player_joined:', data.player.username, 'seat', data.player.seatNumber, 'table', tableId);
            setTables(prev => {
                const existing = prev[tableId];
                if (!existing?.tableState) return prev;
                const existingPlayers = Array.isArray(existing.tableState.players) ? [...existing.tableState.players] : [];
                const filtered = existingPlayers.filter(
                    (p: any) => Number(p.seatNumber) !== Number(data.player.seatNumber)
                );
                filtered.push(data.player as any);
                return updateSlice(prev, tableId, {
                    tableState: { ...existing.tableState, players: filtered },
                });
            });
        });

        socketInstance.on('countdown', (data: { tableId?: string; seconds: number }) => {
            // Countdown doesn't carry tableId from backend yet — use activeTableId as fallback
            const tableId = data.tableId;
            if (!tableId) {
                // Legacy: apply to first table
                setTables(prev => {
                    const firstId = Object.keys(prev)[0];
                    if (!firstId) return prev;
                    const seconds = data.seconds === 0 ? null : data.seconds;
                    return updateSlice(prev, firstId, { countdown: seconds });
                });
                return;
            }
            const seconds = data.seconds === 0 ? null : data.seconds;
            setTables(prev => updateSlice(prev, tableId, { countdown: seconds }));
        });

        socketInstance.on('your_turn', (data: { tableId?: string; seat: number; timeoutMs: number; isTimeBank?: boolean; serverTime?: number }) => {
            const tableId = data.tableId;
            if (!tableId) {
                console.warn('[Socket] your_turn missing tableId');
                return;
            }

            if (!data.isTimeBank) playSound('alert');

            // Persist duration for table_state fallback
            lastTurnDurationRef.current[tableId] = data.timeoutMs;

            // Server timestamp correction
            const serverNow = data.serverTime ?? Date.now();
            const networkDelay = Date.now() - serverNow;
            const adjustedStart = Date.now() - networkDelay;

            setTables(prev => updateSlice(prev, tableId, {
                isMyTurn: true,
                turnTimer: {
                    seat: Number(data.seat),
                    durationMs: data.timeoutMs,
                    startedAt: adjustedStart,
                    isTimeBank: data.isTimeBank || false,
                },
            }));

            // Auto-reset after timeout
            const adjustedTimeout = Math.max(0, data.timeoutMs - (Date.now() - serverNow));
            setTimeout(() => {
                setTables(prev => {
                    const existing = prev[tableId];
                    if (!existing?.isMyTurn) return prev;
                    return updateSlice(prev, tableId, { isMyTurn: false });
                });
            }, adjustedTimeout);
        });

        // TIME BANK ACTIVATION
        socketInstance.on('time_bank_activated', (data: { tableId?: string; seat: number; durationMs: number; timeBankBalance: number }) => {
            const tableId = data.tableId;
            if (!tableId) return;
            console.log(`[Socket] ⏱️ Time bank activated for seat ${data.seat}: ${data.durationMs}ms, balance: ${data.timeBankBalance}s`);
            setTables(prev => updateSlice(prev, tableId, {
                turnTimer: {
                    seat: Number(data.seat),
                    durationMs: data.durationMs,
                    startedAt: Date.now(),
                    isTimeBank: true,
                },
            }));
        });

        socketInstance.on('hand_result', (data: HandResultData) => {
            const tableId = data.tableId;
            if (!tableId) {
                console.warn('[Socket] hand_result missing tableId');
                return;
            }
            console.log('[Socket] Hand result:', tableId, data);
            setTables(prev => updateSlice(prev, tableId, {
                isMyTurn: false,
                turnTimer: null,
                handResult: data,
            }));

            // Auto-clear after celebration delay
            const delay = data.nextHandDelay || 5000;
            setTimeout(() => {
                setTables(prev => updateSlice(prev, tableId, { handResult: null }));
            }, delay);
        });

        socketInstance.on('error', (message: string) => {
            const isAuthError = typeof message === 'string' &&
                (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('jwt'));
            if (isAuthError) {
                console.warn('[Socket] 🔑 Auth error suppressed from UI:', message);
                return;
            }
            console.error('[Socket] Server error:', message);
            setError(message);
        });

        socketInstance.on('action_error', (data: { message?: string; code?: string; data?: { message?: string } } | string) => {
            const msg = typeof data === 'string'
                ? data
                : data?.message || data?.data?.message || (Object.keys(data || {}).length > 0 ? JSON.stringify(data) : 'Action failed');
            console.warn('[Socket] Action error:', typeof data === 'string' ? data : JSON.stringify(data));
            toast.error(msg);
        });

        socketInstance.on('exception', (data: any) => {
            console.error('[Socket] Exception received:', JSON.stringify(data));
            const msg = data?.message || data?.data?.message || 'Server error';
            const isAuthError = typeof msg === 'string' &&
                (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('jwt'));

            if (isAuthError) {
                console.warn('[Socket] 🔑 Auth exception — attempting token refresh...');
                (async () => {
                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (!refreshToken) throw new Error('No refresh token');
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:3001/api';
                        const res = await fetch(`${apiUrl}/auth/refresh`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken }),
                        });
                        if (!res.ok) throw new Error('Refresh failed');
                        const data = await res.json();
                        localStorage.setItem('accessToken', data.accessToken);
                        localStorage.setItem('refreshToken', data.refreshToken);
                        socketInstance.auth = { token: data.accessToken };
                        socketInstance.disconnect();
                        socketInstance.connect();
                        console.log('[Socket] 🔑 Token refreshed, reconnected.');
                    } catch {
                        console.error('[Socket] 🔑 Token refresh failed — hard logout');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                            window.location.href = '/login';
                        }
                    }
                })();
                return;
            }

            console.warn('[Socket] Exception event:', JSON.stringify(data));
            toast.error(msg);
        });

        // Connection status events — track which seats are offline
        socketInstance.on('player_connection_status', (data: PlayerConnectionStatusEvent) => {
            const tableId = (data as any).tableId;
            if (!tableId) return;
            console.log(`[Socket] 📡 Table ${tableId} Seat ${data.seat} → ${data.status}`);
            setTables(prev => {
                const existing = prev[tableId] ?? { ...EMPTY_SLICE };
                return updateSlice(prev, tableId, {
                    offlineSeats: {
                        ...existing.offlineSeats,
                        [data.seat]: data.status === 'offline',
                    },
                });
            });
        });

        // SESSION RECOVERY
        socketInstance.on('session_recovered', (data: { tableId: string; seat: number; username: string }) => {
            console.log(`[Socket] ♻️ Session recovered: seat ${data.seat} on table ${data.tableId}`);
            if (typeof window !== 'undefined' && !window.location.pathname.includes(data.tableId)) {
                console.log(`[Socket] ♻️ Navigating to recovered table...`);
                window.location.href = `/game/${data.tableId}`;
            }
        });

        // UNCALLED BET REFUND
        socketInstance.on('uncalled_bet_returned', (data: UncalledBetReturnedEvent) => {
            const tableId = (data as any).tableId;
            if (!tableId) return;
            console.log(`[Socket] 💰 Uncalled bet returned: table ${tableId} seat ${data.seat}, amount ${data.amount}`);
            setTables(prev => updateSlice(prev, tableId, { uncalledBetRefund: data }));
            setTimeout(() => {
                setTables(prev => updateSlice(prev, tableId, { uncalledBetRefund: null }));
            }, 2000);
        });

        // ADMIN KICK — Player was force-removed by admin
        socketInstance.on('FORCE_KICKED', (data: { tableId: string; reason: string; timestamp: string }) => {
            console.log(`[Socket] ⛔ FORCE_KICKED from table ${data.tableId}: ${data.reason}`);
            // Remove this table's state
            setTables(prev => {
                const next = { ...prev };
                delete next[data.tableId];
                return next;
            });
            setActiveTableId(prev => prev === data.tableId ? null : prev);

            // Show persistent authority toast
            toast.error(
                `You have been removed by an Administrator.\n\nReason: ${data.reason}`,
                {
                    duration: 15000,
                    style: {
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(220,38,38,0.15))',
                        border: '1px solid rgba(245,158,11,0.4)',
                        color: '#fff',
                        fontWeight: 'bold',
                    },
                }
            );

            // Redirect to lobby
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                    window.location.href = '/lobby';
                }, 1000);
            }
        });

        setSocket(socketInstance);

        // Cleanup on unmount or token change
        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [authToken]); // 🔑 Re-fires when token changes

    // ============================================================
    // Actions
    // ============================================================

    const subscribeTable = useCallback(async (tableId: string): Promise<void> => {

        if (!socket?.connected) {
            console.warn('[Socket] ⚠️ subscribeTable skipped - socket not connected');
            return;
        }

        return new Promise((resolve, reject) => {
            socket.emit('subscribe_table', { tableId }, (response: { success: boolean; message: string }) => {
                if (response.success) {
                    setError(null);
                    // Initialize empty slice for this table
                    setTables(prev => {
                        if (prev[tableId]) return prev; // Already exists
                        return { ...prev, [tableId]: { ...EMPTY_SLICE } };
                    });
                    resolve();
                } else {
                    console.warn('[Socket] Failed to subscribe:', response.message);
                    resolve();
                }
            });
        });
    }, [socket]);

    const joinTable = useCallback(async (event: JoinTableEvent): Promise<void> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        // 🔒 Auto-inject stored password for private tables
        const storedPassword = typeof window !== 'undefined'
            ? sessionStorage.getItem(`table_password_${event.tableId}`)
            : null;
        const payload = storedPassword
            ? { ...event, password: storedPassword }
            : event;

        return new Promise((resolve, reject) => {
            socket.emit('join_table', payload, (response: {
                success: boolean;
                message: string;
                errorCode?: string;
                minBuyIn?: number;
                maxBuyIn?: number;
            }) => {
                if (response.success) {
                    setError(null);
                    resolve();
                } else {
                    switch (response.errorCode) {
                        case 'ERR_MIN_BUYIN':
                            toast.error(`Buy-in too low! Minimum: $${response.minBuyIn}`);
                            break;
                        case 'ERR_MAX_BUYIN':
                            toast.error(`Buy-in too high! Maximum: $${response.maxBuyIn}`);
                            break;
                        case 'ERR_INVALID_PASSWORD':
                            toast.error('Invalid password for this private table.');
                            // Clear wrong password
                            if (typeof window !== 'undefined') {
                                sessionStorage.removeItem(`table_password_${event.tableId}`);
                            }
                            break;
                        default:
                            toast.error(response.message);
                    }
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const leaveTable = useCallback(async (tableId: string): Promise<void> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        const event: LeaveTableEvent = { tableId };

        return new Promise((resolve, reject) => {
            socket.emit('leave_table', event, (response: { success: boolean; message: string }) => {
                if (response.success || response.message === 'Not seated at this table') {
                    // Remove this table's state
                    setTables(prev => {
                        const next = { ...prev };
                        delete next[tableId];
                        return next;
                    });
                    // If this was the active table, switch to another
                    setActiveTableId(prev => {
                        if (prev === tableId) {
                            const remaining = Object.keys(tables).filter(id => id !== tableId);
                            return remaining[0] ?? null;
                        }
                        return prev;
                    });
                    setError(null);
                    resolve();
                } else {
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket, tables]);

    const joinWaitlist = useCallback((tableId: string): void => {
        if (!socket?.connected) return;
        socket.emit('join_waitlist', { tableId });
    }, [socket]);

    const leaveWaitlist = useCallback((tableId: string): void => {
        if (!socket?.connected) return;
        socket.emit('leave_waitlist', { tableId });
    }, [socket]);

    const sendAction = useCallback(async (action: BetAction): Promise<void> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('action', action, (response: { success: boolean; message: string }) => {
                if (response.success) {
                    // Clear isMyTurn for this specific table
                    setTables(prev => updateSlice(prev, action.tableId, { isMyTurn: false }));
                    setError(null);
                    resolve();
                } else {
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const toggleSitOut = useCallback(async (tableId: string): Promise<void> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('toggle_sit_out', { tableId }, (response: { success: boolean; message: string }) => {
                if (response.success) {
                    setError(null);
                    resolve();
                } else {
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const toggleLNBB = useCallback(async (tableId: string, value: boolean): Promise<void> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('toggle_lnbb', { tableId, value }, (response: { success: boolean; message: string }) => {
                if (response.success) {
                    setError(null);
                    resolve();
                } else {
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const toggleAutoRebuy = useCallback(async (tableId: string, value: boolean): Promise<void> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('toggle_auto_rebuy', { tableId, value }, (response: { success: boolean; message: string }) => {
                if (response.success) {
                    setError(null);
                    resolve();
                } else {
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const setAutoMuck = useCallback(async (tableId: string, value: boolean): Promise<void> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('set_auto_muck', { tableId, value }, (response: { success: boolean; message: string }) => {
                if (response.success) {
                    setError(null);
                    resolve();
                } else {
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const extendSeatForDeposit = useCallback(async (tableId: string): Promise<{ success: boolean; sitOutBank?: number }> => {
        if (!socket?.connected) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            socket.emit('extend_seat_for_deposit', { tableId }, (response: { success: boolean; message: string; sitOutBank?: number }) => {
                if (response.success) {
                    setError(null);
                    resolve({ success: true, sitOutBank: response.sitOutBank });
                } else {
                    setError(response.message);
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const removeTable = useCallback((tableId: string) => {
        setTables(prev => {
            const next = { ...prev };
            delete next[tableId];
            return next;
        });
        setActiveTableId(prev => prev === tableId ? null : prev);
    }, []);

    // ============================================================
    // HEARTBEAT PULSE — "I am alive" for ALL subscribed tables
    // ============================================================

    useEffect(() => {
        if (!socket?.connected) return;
        const tableIds = Object.keys(tables);
        if (tableIds.length === 0) return;

        const interval = setInterval(() => {
            if (socket.connected) {
                socket.emit('heartbeat');
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [socket, socket?.connected, tables]);

    // ============================================================
    // LEGACY SHIMS — derive single-table values from active table
    // ============================================================

    const activeSlice = useMemo(() => {
        // Find the active table slice, or fall back to the first (or only) table
        if (activeTableId && tables[activeTableId]) return tables[activeTableId];
        const firstId = Object.keys(tables)[0];
        return firstId ? tables[firstId] : EMPTY_SLICE;
    }, [tables, activeTableId]);

    // ============================================================
    // Render
    // ============================================================

    const contextValue = useMemo(() => ({
        socket,
        isConnected,
        tables,
        activeTableId,
        setActiveTableId,
        error,
        subscribeTable,
        joinTable,
        leaveTable,
        sendAction,
        toggleSitOut,
        toggleLNBB,
        toggleAutoRebuy,
        setAutoMuck,
        extendSeatForDeposit,
        joinWaitlist,
        leaveWaitlist,
        removeTable,
        // Legacy shims
        tableState: activeSlice.tableState,
        countdown: activeSlice.countdown,
        isMyTurn: activeSlice.isMyTurn,
        handResult: activeSlice.handResult,
        turnTimer: activeSlice.turnTimer,
        offlineSeats: activeSlice.offlineSeats,
        uncalledBetRefund: activeSlice.uncalledBetRefund,
    }), [socket, isConnected, tables, activeTableId, error, subscribeTable, joinTable, leaveTable, sendAction, toggleSitOut, toggleLNBB, toggleAutoRebuy, setAutoMuck, extendSeatForDeposit, joinWaitlist, leaveWaitlist, removeTable, activeSlice]);

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
}

// ============================================================
// Hook
// ============================================================

export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
