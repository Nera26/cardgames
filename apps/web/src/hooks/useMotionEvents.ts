'use client';

/**
 * useMotionEvents - Bridge between game state changes and animation triggers
 * 
 * This hook watches game state and triggers appropriate animations.
 * Must be used inside MotionOrchestrator context.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMotion } from '@/components/game/MotionOrchestrator';
import { Player, TableState, Card as CardType } from '@/types/game';
import { HandResultData } from '@/contexts/SocketContext';

interface UseMotionEventsOptions {
    tableState: (TableState & { players: Array<Player & { seatIndex: number }> }) | null;
    heroSeatIndex: number;
    isJoined: boolean;
    handResult?: HandResultData | null;
}

// Element coordinate getter (will be passed from game page)
export type CoordGetter = (seatIndex: number) => { x: number; y: number };

export function useMotionEvents(
    options: UseMotionEventsOptions,
    getPlayerCoords?: CoordGetter,
    getPotCoords?: () => { x: number; y: number },
    getDealerCoords?: () => { x: number; y: number },
) {
    const { tableState, heroSeatIndex, isJoined, handResult } = options;
    const motion = useMotion();

    // Track previous state for change detection
    const prevStateRef = useRef<{
        phase: string | undefined;
        pot: number;
        playerBets: Map<number, number>;
        playerStatuses: Map<number, string>;
    }>({
        phase: undefined,
        pot: 0,
        playerBets: new Map(),
        playerStatuses: new Map(),
    });

    // Default coord getters if not provided
    const getCoords = useCallback((seatIndex: number) => {
        if (getPlayerCoords) return getPlayerCoords(seatIndex);
        // Fallback: approximate positions based on table layout
        const angle = (seatIndex / 9) * Math.PI * 2 - Math.PI / 2;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight * 0.4;
        const radiusX = window.innerWidth * 0.35;
        const radiusY = window.innerHeight * 0.25;
        return {
            x: centerX + Math.cos(angle) * radiusX,
            y: centerY + Math.sin(angle) * radiusY,
        };
    }, [getPlayerCoords]);

    const getPot = useCallback(() => {
        if (getPotCoords) return getPotCoords();
        return { x: window.innerWidth / 2, y: window.innerHeight * 0.35 };
    }, [getPotCoords]);

    const getDealer = useCallback(() => {
        if (getDealerCoords) return getDealerCoords();
        return { x: window.innerWidth / 2, y: window.innerHeight * 0.25 };
    }, [getDealerCoords]);

    // Watch for phase changes and trigger animations
    useEffect(() => {


        if (!tableState || !isJoined) {
            return;
        }

        const prev = prevStateRef.current;
        const currentPhase = tableState.phase;
        const currentPot = tableState.pot;



        // === SCENE 1: THE DEAL ===
        // Trigger when phase changes TO 'preflop' from any other phase
        // (displayState may skip the brief 'waiting' phase between hands)
        if (prev.phase !== 'preflop' && currentPhase === 'preflop') {
            // Double-RAF: Let React commit → browser paint → THEN read coords.
            // This ensures hero rotation has flushed to DOM before getBoundingClientRect().
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const dealerPos = getDealer();
                    // Only animate deal to active players — skip sitting_out/waiting/spectators
                    const activePlayers = tableState.players.filter(p =>
                        p.status === 'active' || p.status === 'all-in'
                    );
                    const playerCoords = activePlayers.map(p => {
                        const coords = getCoords(p.seatIndex ?? 0);
                        return coords;
                    });
                    motion.triggerDeal(dealerPos, playerCoords);
                });
            });
        }

        // === SCENE 2: THE BET ===
        // AMPUTATED: Flying chip animations caused ghost DOM elements and queue deadlocks.
        // Player bets are now rendered statically by ChipStack in page.tsx.
        // The bet amount appears instantly when the Red Cable state updates.

        // === SCENE 5: THE FOLD ===
        // Detect when any player's status transitions to 'folded'
        tableState.players.forEach(player => {
            const seatIdx = player.seatIndex ?? 0;
            const prevStatus = prev.playerStatuses.get(seatIdx);
            const currentStatus = player.status;

            if (prevStatus && prevStatus !== 'folded' && currentStatus === 'folded') {
                motion.triggerFold(getCoords(seatIdx));
            }
        });

        // Community cards are now rendered directly by CommunityCards.tsx
        // with AnimatedCard's built-in 3D flip — no flight animation needed.

        // === SCENE 3: THE SHOWDOWN ===
        // Trigger when phase changes to 'showdown'
        if (prev.phase !== 'showdown' && currentPhase === 'showdown') {
            // For now, highlight all remaining players
            const activeSeats = tableState.players
                .filter(p => p.status === 'active' || p.status === 'all-in')
                .map(p => p.seatIndex ?? 0);
            motion.triggerShowdown(activeSeats);
        }

        // === SCENE 4: THE WIN ===
        // Trigger when transitioning out of showdown (payout happened)
        if (currentPhase === 'waiting' && prev.phase === 'showdown' && currentPot < prev.pot) {
            // Get actual winners from hand_result server event
            const realWinners = handResult?.winners?.filter(w => w.type === 'win') ?? [];

            if (realWinners.length > 1) {
                // Split pot: fly portions to each winner
                const splitPots = realWinners.map(w => ({
                    amount: w.amount,
                    coords: getCoords(w.seat),
                }));
                const totalWon = realWinners.reduce((sum, w) => sum + w.amount, 0);
                motion.triggerWin(totalWon, getCoords(realWinners[0].seat), splitPots);
            } else if (realWinners.length === 1) {
                // Single winner
                motion.triggerWin(realWinners[0].amount, getCoords(realWinners[0].seat));
            } else {
                // Fallback: no hand_result yet (race condition guard)
                // Use winningSeat if available, otherwise first active player
                const fallbackSeat = handResult?.winningSeat
                    ?? tableState.players.find(p => p.status === 'active' || p.status === 'all-in')?.seatIndex
                    ?? 0;
                motion.triggerWin(prev.pot, getCoords(fallbackSeat));
            }
        }

        // Update previous state
        prevStateRef.current = {
            phase: currentPhase,
            pot: currentPot,
            playerBets: new Map(tableState.players.map(p => [p.seatIndex ?? 0, p.currentBet ?? 0])),
            playerStatuses: new Map(tableState.players.map(p => [p.seatIndex ?? 0, p.status ?? ''])),
        };
    }, [tableState, isJoined, motion, getCoords, getPot, getDealer]);

    // Provide a manual trigger for phantom chips (optimistic UI)
    const triggerPhantomBet = useCallback((amount: number) => {
        const id = `phantom-${Date.now()}`;
        motion.spawnPhantom(
            id,
            amount,
            getCoords(heroSeatIndex),
            getPot()
        );
        return id;
    }, [motion, getCoords, getPot, heroSeatIndex]);

    const confirmPhantomBet = useCallback((id: string) => {
        motion.confirmPhantom(id);
    }, [motion]);

    const rejectPhantomBet = useCallback((id: string) => {
        motion.rejectPhantom(id);
    }, [motion]);

    return {
        triggerPhantomBet,
        confirmPhantomBet,
        rejectPhantomBet,
    };
}
