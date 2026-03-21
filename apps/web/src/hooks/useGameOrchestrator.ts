'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { TableState, Player } from '@/types/game';
import { AnimationEvent } from '@/hooks/useAnimationQueue';

/**
 * Display-ready table state (what the user sees on screen).
 * Identical shape to the network state but lags behind until animations finish.
 */
export type DisplayTableState = TableState & {
    players: Array<Player & { seatIndex: number }>;
};

/**
 * Animation durations per event type (ms).
 * These match the durations used in useAnimationQueue / MotionOrchestrator.
 */
const ANIM_DURATIONS: Record<string, number> = {
    deal: 1200,      // Cards fly from dealer
    bet: 500,        // Chips slide to pot
    gather_pot: 600, // Bets sweep to center pot
    community: 1200,  // Community cards flip (must finish before showdown)
    showdown: 1500,  // Cards reveal
    win: 1200,       // Pot scoops to winner
    default: 400,    // Generic state update
};

/**
 * Detect what kind of change happened between two state snapshots.
 */
function detectEventType(
    prev: DisplayTableState | null,
    next: DisplayTableState | null
): string {
    if (!prev || !next) return 'default';

    // Phase change: waiting → preflop = deal
    if (prev.phase === 'waiting' && next.phase === 'preflop') return 'deal';

    // New community cards = community reveal
    if ((next.communityCards?.length ?? 0) > (prev.communityCards?.length ?? 0)) return 'community';

    // Phase change: → showdown
    if (prev.phase !== 'showdown' && next.phase === 'showdown') return 'showdown';

    // Phase change: showdown → waiting = win
    if (prev.phase === 'showdown' && next.phase === 'waiting') return 'win';

    // Pot increase = bet
    if (next.pot > prev.pot) return 'bet';

    // Check for individual bet increases
    for (const player of next.players) {
        const prevPlayer = prev.players.find(p => p.id === player.id);
        if (prevPlayer && (player.currentBet ?? 0) > (prevPlayer.currentBet ?? 0)) {
            return 'bet';
        }
    }

    return 'default';
}

/**
 * Derive what action each player took by comparing prev and next states.
 * Returns a map of playerId -> action.
 */
function derivePlayerActions(
    prev: DisplayTableState,
    next: DisplayTableState
): Map<string, Player['lastAction']> {
    const actions = new Map<string, Player['lastAction']>();

    // Find the max bet in the previous state to differentiate BET vs RAISE
    const prevMaxBet = Math.max(0, ...prev.players.map(p => p.currentBet ?? 0));

    for (const nextPlayer of next.players) {
        const prevPlayer = prev.players.find(p => p.id === nextPlayer.id);
        if (!prevPlayer) continue;

        // Player just folded
        if (prevPlayer.status !== 'folded' && nextPlayer.status === 'folded') {
            actions.set(nextPlayer.id, 'FOLD');
            continue;
        }

        // Player went all-in
        if (prevPlayer.status !== 'all-in' && nextPlayer.status === 'all-in') {
            actions.set(nextPlayer.id, 'ALL_IN');
            continue;
        }

        const prevBet = prevPlayer.currentBet ?? 0;
        const nextBet = nextPlayer.currentBet ?? 0;

        // Player's bet increased
        if (nextBet > prevBet) {
            if (prevMaxBet > 0 && nextBet > prevMaxBet) {
                actions.set(nextPlayer.id, 'RAISE');
            } else if (prevMaxBet > 0) {
                actions.set(nextPlayer.id, 'CALL');
            } else {
                actions.set(nextPlayer.id, 'BET');
            }
            continue;
        }

        // Player was active (it was their turn) and didn't change bet = CHECK
        if (prevPlayer.isActive && !nextPlayer.isActive && nextBet === prevBet) {
            // Only if they're still in the hand
            if (nextPlayer.status === 'active') {
                actions.set(nextPlayer.id, 'CHECK');
            }
        }
    }

    return actions;
}

/**
 * Enrich a target state with derived lastAction fields from a state diff.
 * FOLD actions persist; other actions are only set if newly detected.
 */
function enrichWithActions(
    prev: DisplayTableState | null,
    next: DisplayTableState,
    eventType: string
): DisplayTableState {
    if (!prev) return next;

    // On street change or deal, clear all non-FOLD actions
    const isStreetChange = eventType === 'community' || eventType === 'deal' || eventType === 'gather_pot';

    const actions = derivePlayerActions(prev, next);

    return {
        ...next,
        players: next.players.map(p => {
            const newAction = actions.get(p.id);
            const prevPlayer = prev.players.find(pp => pp.id === p.id);
            const prevAction = prevPlayer?.lastAction;

            // If street changed, only keep FOLD
            if (isStreetChange) {
                return {
                    ...p,
                    lastAction: prevAction === 'FOLD' ? 'FOLD' : (newAction ?? undefined),
                };
            }

            // Otherwise, carry forward FOLD or set new action
            return {
                ...p,
                lastAction: newAction ?? (prevAction === 'FOLD' ? 'FOLD' : undefined),
            };
        }) as DisplayTableState['players'],
    };
}

/**
 * Check if any players in the previous state had bets that need gathering.
 */
function hasBetsToGather(state: DisplayTableState | null): boolean {
    if (!state) return false;
    return state.players.some(p => (p.currentBet ?? 0) > 0);
}

/**
 * Create a synthetic "gather" state: same as the target but with
 * old community cards and cleared player bets, updated pot.
 * This makes bets vanish (animate out) while pot grows,
 * BEFORE the new community cards appear.
 */
function createGatherState(
    prev: DisplayTableState,
    next: DisplayTableState
): DisplayTableState {
    return {
        ...next,
        // Keep OLD community cards (don't reveal new ones yet)
        communityCards: prev.communityCards ?? [],
        // Clear all player bets (they've been gathered into the pot)
        players: next.players.map(p => ({
            ...p,
            currentBet: 0,
        })) as DisplayTableState['players'],
        // Pot is already updated to the new total
        pot: next.pot,
    };
}

/**
 * useGameOrchestrator — Decouples Network State from Visual State
 *
 * The Secret Sauce for professional game feel:
 *
 *   Socket Event → Queue → Wait for Animation → Update Display State
 *
 * The UI renders `displayState`, which lags behind the real `networkState`
 * by exactly the animation duration. This prevents chips from "teleporting"
 * and cards from "flashing" into existence.
 *
 * POT GATHER: When a street changes (new community cards), the orchestrator
 * injects a synthetic "gather" state that clears player bets and updates the
 * pot total BEFORE revealing the new community cards. This creates the
 * professional sequence: Bets Vanish → Pot Grows → Cards Deal.
 *
 * Uses refs for the queue to prevent re-render loops.
 */
export function useGameOrchestrator(
    networkState: DisplayTableState | null,
    onAnimationSettled?: (callback: (event: AnimationEvent) => void) => () => void
): {
    displayState: DisplayTableState | null;
    isAnimating: boolean;
    queueLength: number;
} {
    // Display state — what the user actually sees
    const [displayState, setDisplayState] = useState<DisplayTableState | null>(networkState);
    const [isAnimating, setIsAnimating] = useState(false);

    // 🔑 Always-fresh ref for displayState — solves the stale-closure bug.
    // processQueue captures this via useCallback, but queueMicrotask calls
    // it BEFORE React re-renders. Without this ref, gather states see
    // stale communityCards (e.g., [] instead of [3 flop cards]).
    const displayStateRef = useRef<DisplayTableState | null>(displayState);
    displayStateRef.current = displayState;

    // Use refs for the queue to avoid re-render loops
    const queueRef = useRef<DisplayTableState[]>([]);
    const isProcessingRef = useRef(false);
    const prevNetworkStateRef = useRef<DisplayTableState | null>(null);
    const [queueLength, setQueueLength] = useState(0);
    // Track active settled listener unsubscribe functions
    const unsubRef = useRef<(() => void) | null>(null);
    // Safety Flush: detects when displayState drifts from networkState
    const safetyFlushRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestNetworkRef = useRef<DisplayTableState | null>(networkState);
    latestNetworkRef.current = networkState;

    /**
     * Process the next item in the queue
     */
    const processQueue = useCallback(() => {
        if (isProcessingRef.current || queueRef.current.length === 0) return;

        isProcessingRef.current = true;
        setIsAnimating(true);

        const nextState = queueRef.current.shift()!;
        setQueueLength(queueRef.current.length);

        // 🔑 Use the ref (always-fresh) instead of the stale closure value
        const currentDisplay = displayStateRef.current;

        // Detect what kind of event this is to determine animation duration
        const eventType = detectEventType(currentDisplay, nextState);
        const duration = ANIM_DURATIONS[eventType] ?? ANIM_DURATIONS.default;

        // Catch-up protocol: reduce delay when queue is backing up
        const queueSize = queueRef.current.length;
        let effectiveDuration = duration;
        if (queueSize > 5) {
            effectiveDuration = 50; // Warp: near-instant
        } else if (queueSize > 3) {
            effectiveDuration = duration * 0.4; // 2.5x speed
        } else if (queueSize > 1) {
            effectiveDuration = duration * 0.7; // 1.4x speed
        }

        /**
         * Wait for animation completion.
         * Uses onAnimationSettled callback when available (actual Framer Motion completion),
         * with setTimeout as a safety fallback to prevent hung states.
         */
        const waitForAnimation = (duration: number): Promise<void> => {
            return new Promise<void>((resolve) => {
                let resolved = false;
                const safeResolve = () => {
                    if (resolved) return;
                    resolved = true;
                    // Clean up the subscription if we used one
                    if (unsubRef.current) {
                        unsubRef.current();
                        unsubRef.current = null;
                    }
                    resolve();
                };

                // Primary: subscribe to actual animation completion
                if (onAnimationSettled) {
                    unsubRef.current = onAnimationSettled(() => {
                        safeResolve();
                    });
                }

                // Safety fallback: setTimeout ensures we never hang
                // Even with the callback, we keep this as a ceiling
                setTimeout(safeResolve, duration + 200); // +200ms grace period
            });
        };

        // === POT GATHER INJECTION ===
        // When community cards are about to appear and there are player bets,
        // inject a gather phase: clear bets + update pot FIRST, then show cards.
        if (eventType === 'community' && currentDisplay && hasBetsToGather(currentDisplay)) {
            const gatherState = createGatherState(currentDisplay, nextState);
            const gatherDuration = ANIM_DURATIONS.gather_pot;

            waitForAnimation(effectiveDuration).then(() => {
                const enrichedGather = enrichWithActions(currentDisplay, gatherState, 'gather_pot');
                setDisplayState(enrichedGather);
                displayStateRef.current = enrichedGather; // 🔑 Keep ref in sync

                waitForAnimation(gatherDuration).then(() => {
                    const enrichedNext = enrichWithActions(gatherState, nextState, eventType);
                    setDisplayState(enrichedNext);
                    displayStateRef.current = enrichedNext; // 🔑 Keep ref in sync
                    setIsAnimating(false);
                    isProcessingRef.current = false;
                    setQueueLength(queueRef.current.length);

                    queueMicrotask(() => {
                        if (queueRef.current.length > 0) {
                            processQueue();
                        }
                    });
                }).catch((err) => {
                    console.error('[Orchestrator] Gather→community animation error, forcing unlock:', err);
                    isProcessingRef.current = false;
                    setIsAnimating(false);
                    setDisplayState(nextState);
                    displayStateRef.current = nextState;
                    setQueueLength(queueRef.current.length);
                });
            }).catch((err) => {
                console.error('[Orchestrator] Community gather animation error, forcing unlock:', err);
                isProcessingRef.current = false;
                setIsAnimating(false);
                setDisplayState(nextState);
                displayStateRef.current = nextState;
                setQueueLength(queueRef.current.length);
            });

            return; // Don't fall through to the normal flow
        }

        // === SHOWDOWN GATHER INJECTION ===
        // When entering showdown and there are player bets, gather first.
        if (eventType === 'showdown' && currentDisplay && hasBetsToGather(currentDisplay)) {
            const gatherState = createGatherState(currentDisplay, nextState);
            const gatherDuration = ANIM_DURATIONS.gather_pot;

            waitForAnimation(effectiveDuration).then(() => {
                const enrichedGather = enrichWithActions(currentDisplay, gatherState, 'gather_pot');
                setDisplayState(enrichedGather);
                displayStateRef.current = enrichedGather; // 🔑 Keep ref in sync

                waitForAnimation(gatherDuration).then(() => {
                    const enrichedNext = enrichWithActions(gatherState, nextState, eventType);
                    setDisplayState(enrichedNext);
                    displayStateRef.current = enrichedNext; // 🔑 Keep ref in sync
                    setIsAnimating(false);
                    isProcessingRef.current = false;
                    setQueueLength(queueRef.current.length);

                    queueMicrotask(() => {
                        if (queueRef.current.length > 0) {
                            processQueue();
                        }
                    });
                }).catch((err) => {
                    console.error('[Orchestrator] Showdown gather→reveal animation error, forcing unlock:', err);
                    isProcessingRef.current = false;
                    setIsAnimating(false);
                    setDisplayState(nextState);
                    displayStateRef.current = nextState;
                    setQueueLength(queueRef.current.length);
                });
            }).catch((err) => {
                console.error('[Orchestrator] Showdown gather animation error, forcing unlock:', err);
                isProcessingRef.current = false;
                setIsAnimating(false);
                setDisplayState(nextState);
                displayStateRef.current = nextState;
                setQueueLength(queueRef.current.length);
            });

            return;
        }

        // === Normal flow (no gather needed) ===
        // Wait for animation, then update display state
        waitForAnimation(effectiveDuration).then(() => {
            const enrichedNext = enrichWithActions(currentDisplay, nextState, eventType);
            setDisplayState(enrichedNext);
            displayStateRef.current = enrichedNext; // 🔑 Keep ref in sync
            setIsAnimating(false);
            isProcessingRef.current = false;
            setQueueLength(queueRef.current.length);

            // Process next in queue (if any)
            queueMicrotask(() => {
                if (queueRef.current.length > 0) {
                    processQueue();
                }
            });
        }).catch((err) => {
            console.error('[Orchestrator] Animation error, forcing unlock:', err);
            isProcessingRef.current = false;
            setIsAnimating(false);
            setDisplayState(nextState);
            displayStateRef.current = nextState;
            setQueueLength(queueRef.current.length);
        });
    }, [onAnimationSettled]); // 🔑 Removed displayState — now using displayStateRef

    /**
     * When network state changes, push to queue
     */
    useEffect(() => {
        if (!networkState) return;

        // Skip if this is the exact same reference (no change)
        if (networkState === prevNetworkStateRef.current) return;
        prevNetworkStateRef.current = networkState;

        // If display state is null (first load), apply immediately
        if (displayStateRef.current === null) {
            setDisplayState(networkState);
            displayStateRef.current = networkState;
            return;
        }

        // Push to queue
        queueRef.current.push(networkState);
        setQueueLength(queueRef.current.length);

        // Start processing if not already running
        if (!isProcessingRef.current) {
            processQueue();
        }
    }, [networkState, processQueue]);

    // === SAFETY FLUSH ===
    // If displayState is desynced from networkState for >2500ms,
    // forcefully snap to truth. Prevents permanent animation deadlocks.
    useEffect(() => {
        const current = latestNetworkRef.current;
        if (!current || !displayState) return;
        if (current === displayState) {
            // In sync — clear any pending flush
            if (safetyFlushRef.current) {
                clearTimeout(safetyFlushRef.current);
                safetyFlushRef.current = null;
            }
            return;
        }
        // Desync detected — arm the flush (only if not already armed)
        if (!safetyFlushRef.current) {
            safetyFlushRef.current = setTimeout(() => {
                const latest = latestNetworkRef.current;
                if (!latest) return;
                console.warn('[Orchestrator] ⚠️ SAFETY FLUSH: displayState desynced for >2.5s, forcing sync');
                queueRef.current = [];
                isProcessingRef.current = false;
                if (unsubRef.current) {
                    unsubRef.current();
                    unsubRef.current = null;
                }
                setIsAnimating(false);
                setDisplayState(latest);
                displayStateRef.current = latest; // 🔑 Keep ref in sync
                setQueueLength(0);
                safetyFlushRef.current = null;
            }, 2500);
        }
        return () => {
            if (safetyFlushRef.current) {
                clearTimeout(safetyFlushRef.current);
                safetyFlushRef.current = null;
            }
        };
    }, [networkState, displayState]);

    return {
        displayState,
        isAnimating,
        queueLength,
    };
}
