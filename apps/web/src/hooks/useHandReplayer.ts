'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ── Types ──
export interface ActionEntry {
    street: string;
    seat: number;
    player: string;
    action: string;
    amount: number;
    pot: number;
}

export interface PlayerSnapshot {
    seat: number;
    name: string;
    lastAction: string | null;
    lastAmount: number;
    isActive: boolean;
    totalContributed: number;
}

export interface ReplayState {
    currentIndex: number;
    currentStreet: string;
    pot: number;
    activeSeat: number | null;
    lastAction: ActionEntry | null;
    visibleCommunityCards: string[];
    players: Map<number, PlayerSnapshot>;
}

export interface UseHandReplayerReturn {
    // State
    state: ReplayState;
    isPlaying: boolean;
    playbackSpeed: number;
    totalActions: number;
    progress: number;
    // Controls
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    reset: () => void;
    goToIndex: (index: number) => void;
    setSpeed: (speed: number) => void;
}

// ── Street → Community Card Count ──
function getVisibleCardCount(street: string): number {
    switch (street) {
        case 'flop': return 3;
        case 'turn': return 4;
        case 'river': return 5;
        default: return 0; // preflop
    }
}

// ── Derive table state at a given index ──
function deriveState(
    actions: ActionEntry[],
    communityCards: string[],
    upToIndex: number
): ReplayState {
    const players = new Map<number, PlayerSnapshot>();
    let pot = 0;
    let currentStreet = 'preflop';
    let activeSeat: number | null = null;
    let lastAction: ActionEntry | null = null;

    // Replay from 0 to upToIndex
    for (let i = 0; i <= upToIndex && i < actions.length; i++) {
        const action = actions[i];

        // Track street progression
        if (action.street !== currentStreet) {
            // When street changes, reset all last-actions
            players.forEach((p) => {
                p.lastAction = null;
                p.lastAmount = 0;
            });
            currentStreet = action.street;
        }

        // Ensure player exists
        if (!players.has(action.seat)) {
            players.set(action.seat, {
                seat: action.seat,
                name: action.player,
                lastAction: null,
                lastAmount: 0,
                isActive: true,
                totalContributed: 0,
            });
        }

        const player = players.get(action.seat)!;
        player.lastAction = action.action;
        player.lastAmount = action.amount;

        if (action.action === 'fold') {
            player.isActive = false;
        }
        if (['call', 'raise', 'bet', 'all-in'].includes(action.action)) {
            player.totalContributed += action.amount;
        }

        pot = action.pot;
        activeSeat = action.seat;
        lastAction = action;
    }

    // Determine visible community cards
    const cardCount = getVisibleCardCount(currentStreet);
    const visibleCommunityCards = communityCards.slice(0, cardCount);

    return {
        currentIndex: upToIndex,
        currentStreet,
        pot,
        activeSeat,
        lastAction,
        visibleCommunityCards,
        players,
    };
}

// ── The Hook ──
export function useHandReplayer(
    actionLog: ActionEntry[],
    communityCards: string[]
): UseHandReplayerReturn {
    const [currentIndex, setCurrentIndex] = useState(-1); // -1 = initial state
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1000);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const totalActions = actionLog.length;

    // Derived state
    const state = useMemo(() => {
        if (currentIndex < 0 || actionLog.length === 0) {
            return {
                currentIndex: -1,
                currentStreet: 'preflop',
                pot: 0,
                activeSeat: null,
                lastAction: null,
                visibleCommunityCards: [],
                players: new Map<number, PlayerSnapshot>(),
            };
        }
        return deriveState(actionLog, communityCards, currentIndex);
    }, [currentIndex, actionLog, communityCards]);

    const progress = totalActions > 0 ? ((currentIndex + 1) / totalActions) * 100 : 0;

    // Playback loop
    useEffect(() => {
        if (!isPlaying) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => {
                if (prev >= totalActions - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, playbackSpeed);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, playbackSpeed, totalActions]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Controls
    const play = useCallback(() => {
        if (currentIndex >= totalActions - 1) {
            setCurrentIndex(-1); // Reset if at end
        }
        setIsPlaying(true);
    }, [currentIndex, totalActions]);

    const pause = useCallback(() => setIsPlaying(false), []);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    const stepForward = useCallback(() => {
        setIsPlaying(false);
        setCurrentIndex(prev => Math.min(prev + 1, totalActions - 1));
    }, [totalActions]);

    const stepBackward = useCallback(() => {
        setIsPlaying(false);
        setCurrentIndex(prev => Math.max(prev - 1, -1));
    }, []);

    const reset = useCallback(() => {
        setIsPlaying(false);
        setCurrentIndex(-1);
    }, []);

    const goToIndex = useCallback((index: number) => {
        setIsPlaying(false);
        setCurrentIndex(Math.max(-1, Math.min(index, totalActions - 1)));
    }, [totalActions]);

    const setSpeed = useCallback((speed: number) => {
        setPlaybackSpeed(speed);
    }, []);

    return {
        state,
        isPlaying,
        playbackSpeed,
        totalActions,
        progress,
        play,
        pause,
        togglePlay,
        stepForward,
        stepBackward,
        reset,
        goToIndex,
        setSpeed,
    };
}
