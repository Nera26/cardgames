'use client';

/**
 * useGameTable - Live Poker Table Hook
 * 
 * Bridges the SocketContext (backend data) with frontend UI types.
 * Handles joining/leaving tables and mapping TableSnapshot to UI format.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useGame } from '@/contexts/GameContext';
import { Player, TableState, Card, SidePot } from '@/types/game';

// Default avatars for players
const AVATARS = [
    '/avatars/player1.png',
    '/avatars/player2.png',
    '/avatars/player3.png',
    '/avatars/player4.png',
    '/avatars/player5.png',
    '/avatars/player6.png',
    '/avatars/player7.png',
    '/avatars/player8.png',
    '/avatars/player9.png',
];

/**
 * Parse card string (e.g., "As", "Th") to Card object
 */
function parseCard(cardStr: string): Card {
    if (cardStr === '??' || !cardStr) {
        return { rank: '?', suit: 'spades', isFaceUp: false };
    }

    const rank = cardStr.slice(0, -1);
    const suitChar = cardStr.slice(-1);
    const suitMap: Record<string, Card['suit']> = {
        's': 'spades',
        'h': 'hearts',
        'd': 'diamonds',
        'c': 'clubs',
    };

    return {
        rank: rank === 'T' ? '10' : rank,
        suit: suitMap[suitChar] || 'spades',
        isFaceUp: true,
    };
}

// ============================================================
// computeSidePots — Client-Side Side Pot Derivation
//
// Mirrors showdown.lua's iterative pot splitting algorithm.
// Uses raw backend player data (preserves 'all-in' status).
//
// Dead Money Rule: Folded players' contributions are in the pot
// but not attached to any active player. The algorithm sums
// active slices, then adds the remainder to the Main Pot.
//
// Invariant: sum(pots[].amount) === totalPot (always)
// ============================================================

interface RawPlayer {
    id: string;
    status: string;
    totalContribution?: number;
}

function computeSidePots(players: RawPlayer[], totalPot: number): SidePot[] {
    if (totalPot <= 0) return [];

    // Only consider players still in the hand (active or all-in)
    const inHand = players.filter(
        p => p.status === 'active' || p.status === 'all-in'
    );

    // If 0-1 players in hand, single pot (e.g., everyone folded to one player)
    if (inHand.length <= 1) {
        return [{ amount: totalPot, eligiblePlayerIds: inHand.map(p => p.id) }];
    }

    // Collect unique contribution levels, sorted ascending
    const levelSet = new Set<number>();
    for (const p of inHand) {
        const contrib = p.totalContribution ?? 0;
        if (contrib > 0) levelSet.add(contrib);
    }
    const levels = Array.from(levelSet).sort((a, b) => a - b);

    // Edge case: no contributions yet (preflop before blinds?) — single pot
    if (levels.length === 0) {
        return [{ amount: totalPot, eligiblePlayerIds: inHand.map(p => p.id) }];
    }

    // Edge case: all same contribution — single pot
    if (levels.length === 1) {
        return [{ amount: totalPot, eligiblePlayerIds: inHand.map(p => p.id) }];
    }

    // Iterative splitting (same as showdown.lua)
    const pots: SidePot[] = [];
    let lastLevel = 0;
    let sliceSum = 0;

    for (const level of levels) {
        const slicePerPlayer = level - lastLevel;

        // Count ALL players (including folded) who contributed at least this level
        const contributorsCount = players.filter(
            p => (p.totalContribution ?? 0) >= level
        ).length;

        // Eligible = in-hand players whose contribution reaches this level
        const eligible = inHand.filter(
            p => (p.totalContribution ?? 0) >= level
        );

        const sliceAmount = slicePerPlayer * contributorsCount;
        sliceSum += sliceAmount;

        // Only create a pot if 2+ players are eligible — a single-player
        // slice is an uncalled bet (refund), not a contestable pot.
        if (sliceAmount > 0 && eligible.length > 1) {
            pots.push({
                amount: sliceAmount,
                eligiblePlayerIds: eligible.map(p => p.id),
            });
        }

        lastLevel = level;
    }

    // Dead Money: folded players' extra contributions not covered by slices
    const deadMoney = totalPot - sliceSum;
    if (deadMoney > 0 && pots.length > 0) {
        pots[0].amount += deadMoney;
    } else if (deadMoney > 0 && pots.length === 0) {
        // Shouldn't happen, but safety net
        pots.push({ amount: totalPot, eligiblePlayerIds: inHand.map(p => p.id) });
    }

    return pots;
}

/**
 * Map backend PlayerState to frontend Player type
 */
function mapPlayer(
    backendPlayer: {
        id: string;
        username: string;
        chips: number;
        status: string;
        cards: string[];
        currentBet: number;
        seatNumber: number;
        totalContribution?: number;
        totalBuyIn?: number;
        sit_out_start?: number;
        sitOutBank?: number;
        sitOutStartedAt?: number;
        depositExpiresAt?: number;
        avatarId?: string;
        avatarUrl?: string | null;
    },
    turnSeat: number,
    dealerSeat: number
): Player & { seatIndex: number } {
    // CRASH VEST: Return a safe stub for malformed player data
    if (!backendPlayer || !backendPlayer.id) {
        return {
            id: 'ghost-' + Math.random().toString(36).slice(2),
            seatIndex: backendPlayer?.seatNumber ?? 0,
            name: 'Unknown',
            balance: 0,
            avatar: AVATARS[0],
            cards: [],
            isActive: false,
            isDealer: false,
            status: 'sitting_out' as Player['status'],
            currentBet: 0,
        };
    }

    return {
        id: backendPlayer.id,
        seatIndex: backendPlayer.seatNumber,
        name: backendPlayer.username,
        balance: backendPlayer.chips,
        avatar: AVATARS[backendPlayer.seatNumber % AVATARS.length],
        cards: backendPlayer.cards.map(parseCard),
        isActive: Number(backendPlayer.seatNumber) === Number(turnSeat),
        isDealer: Number(backendPlayer.seatNumber) === Number(dealerSeat),
        status: backendPlayer.status === 'all-in'
            ? 'active'
            : (backendPlayer.status as Player['status']),
        currentBet: backendPlayer.currentBet,
        totalContribution: backendPlayer.totalContribution ?? 0,
        totalBuyIn: backendPlayer.totalBuyIn ?? backendPlayer.chips,
        sitOutStart: backendPlayer.sit_out_start,
        sitOutBank: backendPlayer.sitOutBank,
        sitOutStartedAt: backendPlayer.sitOutStartedAt,
        depositExpiresAt: backendPlayer.depositExpiresAt,
        avatarId: backendPlayer.avatarId,
        avatarUrl: backendPlayer.avatarUrl,
    };
}

interface UseGameTableOptions {
    tableId: string;
    autoJoin?: boolean;
    defaultBuyIn?: number;
    preferredSeat?: number;
}

export function useGameTable(options: UseGameTableOptions) {
    const { tableId, autoJoin = false, defaultBuyIn = 1000, preferredSeat } = options;
    const { tables, isConnected, joinTable, leaveTable, subscribeTable, sendAction, error, joinWaitlist, leaveWaitlist } = useSocket();
    const { user } = useGame();

    // Read from the multiplexed state dictionary
    const tableSlice = tables[tableId];
    const socketTableState = tableSlice?.tableState ?? null;
    const countdown = tableSlice?.countdown ?? null;

    const [isJoining, setIsJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [mySeat, setMySeat] = useState<number | null>(null);

    // Map backend state to frontend format
    const tableState = useMemo<(TableState & { players: Array<Player & { seatIndex: number }> }) | null>(() => {
        if (!socketTableState) return null;

        try {
            const table = socketTableState.table as {
                id: string;
                name: string;
                phase: string;
                pot: number;
                currentBet: number;
                turnSeat: number;
                dealerSeat: number;
                communityCards: string[] | Record<string, never>;
                smallBlind: number;
                bigBlind: number;
            };

            // CRASH GUARD: players may arrive as an array OR a Redis hash object
            const playersRaw = socketTableState.players;
            const playersArray = Array.isArray(playersRaw)
                ? playersRaw
                : (playersRaw && typeof playersRaw === 'object' ? Object.values(playersRaw) : []);

            const rawPlayers = (playersArray as Array<{
                id: string;
                username: string;
                chips: number;
                status: string;
                cards: string[] | Record<string, never> | null;
                currentBet: number;
                seatNumber: number;
                totalContribution?: number;
                avatarUrl?: string | null;
            }>).filter(p => p != null && p.id != null);

            const players = rawPlayers.map(p => ({
                ...p,
                // Lua might send {} or null for empty arrays
                cards: Array.isArray(p.cards) ? p.cards : [],
                chips: p.chips ?? 0,
                username: p.username ?? 'Player',
                currentBet: p.currentBet ?? 0,
                seatNumber: p.seatNumber ?? 0,
            })).map(p => mapPlayer(p, table.turnSeat ?? -1, table.dealerSeat ?? -1));

            // Lua might send {} for empty arrays
            const communityCardsRaw = Array.isArray(table.communityCards) ? table.communityCards : [];

            // Compute side pots from raw backend data (before status remap)
            const totalPot = table.pot ?? 0;
            const pots = computeSidePots(rawPlayers, totalPot);

            // Extract waitlist from socket payload (injected by broadcastTableState)
            const waitlistRaw = (socketTableState as Record<string, unknown>).waitlist;
            const waitlist = Array.isArray(waitlistRaw)
                ? (waitlistRaw as Array<{ userId?: string; username?: string; avatarId?: string; avatarUrl?: string | null }>).map(w => ({
                    username: w.username || 'Unknown',
                    avatarId: w.avatarId,
                    avatarUrl: w.avatarUrl,
                }))
                : [];

            // Extract observers from socket payload (injected by broadcastTableState)
            const observersRaw = (socketTableState as Record<string, unknown>).observers;
            const observers = Array.isArray(observersRaw)
                ? (observersRaw as Array<{ userId?: string; username?: string; avatarId?: string; avatarUrl?: string | null }>).map(o => ({
                    userId: o.userId || '',
                    username: o.username || 'Observer',
                    avatarId: o.avatarId,
                    avatarUrl: o.avatarUrl,
                }))
                : [];

            return {
                id: table.id || tableId,
                name: table.name || 'Texas Hold\'em',
                stakes: `$${table.smallBlind ?? 0}/$${table.bigBlind ?? 0}`,
                pot: totalPot,
                pots,
                phase: table.phase ?? 'waiting',
                communityCards: communityCardsRaw.map(parseCard),
                players,
                waitlist,
                observers,
                activePlayerId: players.find(p => p.isActive)?.id,
            };
        } catch (err) {
            console.error('[useGameTable] Failed to map table state:', err);
            return null;
        }
    }, [socketTableState, tableId]);

    // Find the hero (current user)
    const heroPlayer = useMemo(() => {
        if (!tableState || !user) return null;
        return tableState.players.find(p => p.id === user.id);
    }, [tableState, user]);

    const heroSeatIndex = heroPlayer?.seatIndex ?? 5;

    // Determine if it's the hero's turn based on turnSeat from backend
    const isMyTurn = useMemo(() => {
        if (!socketTableState || !heroPlayer) return false;
        const table = socketTableState.table as { turnSeat: number; phase: string };
        // Only allow actions during active game phases
        if (table.phase === 'waiting' || table.phase === 'showdown') return false;
        return Number(table.turnSeat) === Number(heroPlayer.seatIndex);
    }, [socketTableState, heroPlayer]);

    // Current bet to call
    const currentCallAmount = useMemo(() => {
        if (!socketTableState) return 0;
        const table = socketTableState.table as { currentBet: number | string };
        const myCurrentBet = Number(heroPlayer?.currentBet) || 0;
        return Math.max(0, Number(table.currentBet) - myCurrentBet);
    }, [socketTableState, heroPlayer]);

    // Big blind value — clean numeric extraction for UI components (slider step, etc.)
    const bigBlind = useMemo(() => {
        if (!socketTableState) return 0;
        const table = socketTableState.table as { bigBlind: number | string };
        return Number(table.bigBlind) || 0;
    }, [socketTableState]);

    // Min raise amount — proper NLH: currentBet + lastRaiseSize
    const minRaise = useMemo(() => {
        if (!socketTableState) return 0;
        const table = socketTableState.table as {
            bigBlind: number | string;
            currentBet: number | string;
            lastRaiseSize?: number | string;
        };
        // Defensive Number() casts: raw Redis hgetall returns strings,
        // which would cause "10000" + "10000" = "1000010000" (string concat)
        const bb = Number(table.bigBlind) || 0;
        const currentBet = Number(table.currentBet) || 0;
        const lastRaiseSize = Number(table.lastRaiseSize) || bb;

        if (currentBet > 0) {
            // Someone has bet: min re-raise = currentBet + lastRaiseSize
            return currentBet + lastRaiseSize;
        }
        // No bet yet (post-flop): minimum opening bet is the big blind
        return bb;
    }, [socketTableState]);

    // Join table
    const handleJoin = useCallback(async (seat?: number, buyIn?: number) => {
        if (!isConnected || isJoined) return;

        setIsJoining(true);
        try {
            await joinTable({
                tableId,
                seatNumber: seat ?? preferredSeat ?? 0,
                buyIn: buyIn ?? defaultBuyIn,
            });
            setIsJoined(true);
            setMySeat(seat ?? preferredSeat ?? 0);
        } catch (err) {
            console.error('Failed to join table:', err);
        } finally {
            setIsJoining(false);
        }
    }, [isConnected, isJoined, joinTable, tableId, preferredSeat, defaultBuyIn]);

    // Leave table
    const handleLeave = useCallback(async () => {
        if (!isJoined) return;

        try {
            await leaveTable(tableId);
            setIsJoined(false);
            setMySeat(null);
        } catch (err) {
            console.error('Failed to leave table:', err);
        }
    }, [isJoined, leaveTable, tableId]);

    // Game actions
    const handleFold = useCallback(async () => {
        await sendAction({ tableId, action: 'fold' });
    }, [sendAction, tableId]);

    const handleCheck = useCallback(async () => {
        await sendAction({ tableId, action: 'check' });
    }, [sendAction, tableId]);

    const handleCall = useCallback(async (amount: number) => {
        await sendAction({ tableId, action: 'call', amount });
    }, [sendAction, tableId]);

    const handleRaise = useCallback(async (amount: number) => {
        await sendAction({ tableId, action: 'raise', amount });
    }, [sendAction, tableId]);

    const handleAllIn = useCallback(async () => {
        await sendAction({ tableId, action: 'all-in' });
    }, [sendAction, tableId]);

    // Auto-join if enabled
    useEffect(() => {
        if (autoJoin && isConnected && !isJoined && !isJoining) {
            handleJoin();
        }
    }, [autoJoin, isConnected, isJoined, isJoining, handleJoin]);

    // SESSION RECOVERY: Auto-detect if we're already seated (e.g. after page refresh).
    // The backend sends table_state via session_recovered, which includes our player.
    // If heroPlayer exists in the data but isJoined is still false, we're a ghost — fix it.
    useEffect(() => {
        if (heroPlayer && !isJoined) {
            setIsJoined(true);
            setMySeat(heroPlayer.seatIndex ?? 0);
        }
    }, [heroPlayer, isJoined]);

    // Spectator Subscription: Ensure we receive table updates even if not seated
    useEffect(() => {
        if (isConnected && tableId && !isJoined) {
            subscribeTable(tableId).catch(err => console.error('Subscription failed:', err));
        }
    }, [isConnected, tableId, isJoined, subscribeTable]);

    return {
        // State
        tableState,
        isConnected,
        isJoined,
        isJoining,
        isMyTurn,
        countdown,
        error,
        mySeat,
        heroPlayer,
        heroSeatIndex,
        currentCallAmount,
        minRaise,
        bigBlind,

        // Actions
        join: handleJoin,
        leave: handleLeave,
        fold: handleFold,
        check: handleCheck,
        call: handleCall,
        raise: handleRaise,
        allIn: handleAllIn,
        joinWaitlist: () => joinWaitlist(tableId),
        leaveWaitlist: () => leaveWaitlist(tableId),
    };
}
