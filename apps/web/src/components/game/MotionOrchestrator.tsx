'use client';

import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { OverlayLayer, AnimationCoords } from './OverlayLayer';
import { FlyingCard } from './AnimatedCard';
import { PotExplosion } from './PotExplosion';
import { DealerShuffle, SHUFFLE_DURATION_MS } from './DealerShuffle';
import { FoldAnimation } from './FoldAnimation';
import { Card as CardType } from '@/types/game';
import { PhantomChips, usePhantomChips } from './PhantomChips';
import { useAnimationQueue, AnimationEvent } from '@/hooks/useAnimationQueue';
import { useSound, SoundTiming } from '@/hooks/useSound';
import { useTableLayoutOptional } from '@/contexts/TableLayoutContext';
import { AnimationSettledSubscriber } from '@/hooks/useAnimationBridge';

/**
 * Animation Context Types
 */
interface MotionContextValue {
    // Scene triggers
    triggerDeal: (dealerCoords: AnimationCoords, playerCoords: AnimationCoords[]) => void;
    triggerShowdown: (winnerSeats: number[]) => void;
    triggerWin: (potAmount: number, winnerCoords: AnimationCoords, splitPots?: { amount: number; coords: AnimationCoords }[]) => void;
    triggerFold: (playerCoords: AnimationCoords) => void;

    // Nuclear wipe: removes all active visual elements from the DOM
    clearAnimations: () => void;

    // Phantom chips for optimistic UI
    spawnPhantom: (id: string, amount: number, fromCoords: AnimationCoords, toCoords: AnimationCoords) => void;
    confirmPhantom: (id: string) => void;
    rejectPhantom: (id: string) => void;

    // Queue info
    queueLength: number;
    speedMultiplier: number;

    // Animation completion subscription
    onAnimationSettled: (callback: (event: AnimationEvent) => void) => () => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export const useMotion = () => {
    const ctx = useContext(MotionContext);
    if (!ctx) throw new Error('useMotion must be used within MotionOrchestrator');
    return ctx;
};

/**
 * Active animation state
 */
interface ActiveAnimation {
    type: 'deal' | 'showdown' | 'win' | 'fold';
    data: Record<string, unknown>;
}

/**
 * MotionOrchestrator - Central Animation Coordinator
 * 
 * Responsibilities:
 * 1. Subscribe to game events
 * 2. Queue animations via useAnimationQueue (with catch-up protocol)
 * 3. Coordinate child animation components
 * 4. Synchronize sound with animation completion
 */
export const MotionOrchestrator: React.FC<{
    children: React.ReactNode;
    registerSettler?: (settler: AnimationSettledSubscriber) => void;
}> = ({ children, registerSettler }) => {
    const { enqueue, queueLength, speedMultiplier, getEffectiveDuration, current, onAnimationSettled } = useAnimationQueue();
    const { play, playAfter } = useSound();
    const phantomChips = usePhantomChips();
    // 🟣 Iron Grid: live DOM coords for fold muck target
    const tableLayout = useTableLayoutOptional();

    // Register the animation settled subscriber with the bridge
    useEffect(() => {
        if (registerSettler) {
            registerSettler(onAnimationSettled);
        }
    }, [registerSettler, onAnimationSettled]);

    const [activeAnimations, setActiveAnimations] = useState<ActiveAnimation[]>([]);


    // Generate collision-proof animation ID
    // Uses timestamp + random to prevent React key recycling on rapid actions
    const genId = useCallback(() => {
        return `anim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }, []);

    /**
     * Scene 1: The Deal - Cards fly from dealer to players
     */
    const triggerDeal = useCallback((dealerCoords: AnimationCoords, playerCoords: AnimationCoords[]) => {
        const id = genId();
        const shuffleMs = SHUFFLE_DURATION_MS;
        const baseDuration = shuffleMs + 1500; // shuffle + deal sequence

        enqueue({
            id,
            type: 'deal',
            priority: 'essential',
            duration: baseDuration,
            data: { dealerCoords, playerCoords },
        }, () => {
            // Animation complete callback
            setActiveAnimations(prev => prev.filter(a => a.data.id !== id));
        });

        setActiveAnimations(prev => [...prev, {
            type: 'deal',
            data: { id, dealerCoords, playerCoords },
        }]);

        // 🟣 Shuffle sound at start
        playAfter('card_slide', 50, 0.3);
        playAfter('card_slide', 250, 0.35);
        playAfter('card_slide', 500, 0.3);

        // 🟣 Round-robin card pitch sounds: offset by shuffle duration
        const pitchDelay = 120; // 120ms per card pitch
        const playerCount = playerCoords.length;
        for (let cardIdx = 0; cardIdx < 2; cardIdx++) {
            playerCoords.forEach((_, pIdx) => {
                const delay = shuffleMs + (cardIdx * playerCount + pIdx) * pitchDelay / speedMultiplier;
                playAfter('card_slide', delay, 0.5 + Math.random() * 0.15);
            });
        }
    }, [enqueue, genId, playAfter, speedMultiplier]);

    // Scene 2 (Bet) AMPUTATED: Flying chips caused ghost DOM elements.
    // Bets are now rendered statically by ChipStack in page.tsx.

    // Nuclear wipe: called by Safety Flush to destroy all ghost visuals
    const clearAnimations = useCallback(() => {
        console.warn('[MotionOrchestrator] 🧹 clearAnimations: wiping all active visual elements');
        setActiveAnimations([]);
    }, []);

    /**
     * Scene 3: The Showdown - Cards flip to reveal
     */
    const triggerShowdown = useCallback((winnerSeats: number[]) => {
        const id = genId();
        const baseDuration = 2000;

        enqueue({
            id,
            type: 'showdown',
            priority: 'essential',
            duration: baseDuration,
            data: { winnerSeats },
        }, () => {
            setActiveAnimations(prev => prev.filter(a => a.data.id !== id));
        });

        setActiveAnimations(prev => [...prev, {
            type: 'showdown',
            data: { id, winnerSeats },
        }]);

        // Card flip sounds — synced to delayedHandResult (1500ms buffer in page.tsx)
        playAfter('card_flip', 1500, 0.5);
        playAfter('card_flip', 1700, 0.5);
    }, [enqueue, genId, playAfter]);

    /**
     * Scene 4: The Win - Pot explodes to winner
     */
    const triggerWin = useCallback((
        potAmount: number,
        winnerCoords: AnimationCoords,
        splitPots?: { amount: number; coords: AnimationCoords }[]
    ) => {
        const id = genId();
        const baseDuration = 1500;

        enqueue({
            id,
            type: 'win',
            priority: 'essential',
            duration: baseDuration,
            data: { potAmount, winnerCoords, splitPots },
        }, () => {
            setActiveAnimations(prev => prev.filter(a => a.data.id !== id));
        });

        setActiveAnimations(prev => [...prev, {
            type: 'win',
            data: { id, potAmount, winnerCoords, splitPots },
        }]);

        // Chip impact and fanfare
        const effectiveDuration = getEffectiveDuration(baseDuration);
        playAfter('chip_impact', SoundTiming.onImpact(effectiveDuration), 0.7);
        playAfter('win_fanfare', Math.round(effectiveDuration * 0.6), 0.5);
    }, [enqueue, genId, getEffectiveDuration, playAfter]);

    /**
     * Scene 5: The Fold — Cards toss toward muck
     */
    const triggerFold = useCallback((playerCoords: AnimationCoords) => {
        const id = genId();
        const baseDuration = 400;

        enqueue({
            id,
            type: 'fold',
            priority: 'non-essential', // Skippable in catch-up
            duration: baseDuration,
            data: { playerCoords },
        }, () => {
            setActiveAnimations(prev => prev.filter(a => a.data.id !== id));
        });

        setActiveAnimations(prev => [...prev, {
            type: 'fold',
            data: { id, playerCoords },
        }]);

        // 🟣 Fold sound at start (feels like a deliberate toss)
        play('fold', 0.4);
    }, [enqueue, genId, play]);

    // Community cards are now rendered directly by CommunityCards.tsx
    // with AnimatedCard's built-in 3D flip — no orchestrator involvement.

    // Phantom chip handlers
    const spawnPhantom = useCallback((id: string, amount: number, fromCoords: AnimationCoords, toCoords: AnimationCoords) => {
        phantomChips.spawn(id, amount, fromCoords, toCoords);
        play('chip_slide', 0.3);
    }, [phantomChips, play]);

    const confirmPhantom = useCallback((id: string) => {
        phantomChips.confirm(id);
        play('chip_impact', 0.4);
    }, [phantomChips, play]);

    const rejectPhantom = useCallback((id: string) => {
        phantomChips.reject(id);
        // No sound for rejection - feels more natural
    }, [phantomChips]);

    // Community cards no longer animated through the orchestrator

    const contextValue: MotionContextValue = {
        triggerDeal,
        triggerShowdown,
        triggerWin,
        triggerFold,
        clearAnimations,
        spawnPhantom,
        confirmPhantom,
        rejectPhantom,
        queueLength,
        speedMultiplier,
        onAnimationSettled,
    };

    return (
        <MotionContext.Provider value={contextValue}>
            {children}

            {/* Overlay Layer for flying animations */}
            <OverlayLayer>
                <AnimatePresence>

                    {/* Render active deal animations — shuffle + pitched cards */}
                    {activeAnimations
                        .filter(a => a.type === 'deal')
                        .flatMap((anim) => {
                            const playerCoords = anim.data.playerCoords as AnimationCoords[];
                            const dealerCoords = anim.data.dealerCoords as AnimationCoords;
                            const playerCount = playerCoords.length;
                            const pitchDelay = 0.12 / speedMultiplier; // 120ms per pitch
                            const shuffleOffset = SHUFFLE_DURATION_MS / 1000; // shuffle plays first

                            return [
                                // Phase 1: Dealer shuffle at center
                                <DealerShuffle
                                    key={`${anim.data.id}-shuffle`}
                                    x={dealerCoords.x}
                                    y={dealerCoords.y}
                                />,
                                // Phase 2: Round-robin pitched cards (offset by shuffle duration)
                                ...[0, 1].flatMap((cardIdx) =>
                                    playerCoords.map((pCoords, pIdx) => (
                                        <FlyingCard
                                            key={`${anim.data.id}-r${cardIdx}-p${pIdx}`}
                                            from={dealerCoords}
                                            to={pCoords}
                                            delay={shuffleOffset + (cardIdx * playerCount + pIdx) * pitchDelay}
                                            cardIndex={cardIdx * playerCount + pIdx}
                                        />
                                    ))
                                ),
                            ];
                        })}

                    {/* Render pot explosions */}
                    {activeAnimations
                        .filter(a => a.type === 'win')
                        .map((anim) => (
                            <PotExplosion
                                key={anim.data.id as string}
                                amount={anim.data.potAmount as number}
                                winnerCoords={anim.data.winnerCoords as { x: number; y: number }}
                                splitPots={anim.data.splitPots as { amount: number; coords: { x: number; y: number } }[] | undefined}
                                potOrigin={tableLayout?.getPotCoords()}
                            />
                        ))}

                    {/* Render fold animations — cards toss toward muck */}
                    {activeAnimations
                        .filter(a => a.type === 'fold')
                        .map((anim) => {
                            // Muck target: measured pot coords, or viewport center fallback
                            const muckCoords = tableLayout
                                ? tableLayout.getPotCoords()
                                : { x: window.innerWidth / 2, y: window.innerHeight * 0.35 };
                            return (
                                <FoldAnimation
                                    key={anim.data.id as string}
                                    from={anim.data.playerCoords as { x: number; y: number }}
                                    to={muckCoords}
                                    duration={getEffectiveDuration(400) / 1000}
                                />
                            );
                        })}

                    {/* Render phantom chips */}
                    {phantomChips.phantoms.map((p) => (
                        <PhantomChips
                            key={p.id}
                            amount={p.amount}
                            fromCoords={p.fromCoords}
                            toCoords={p.toCoords}
                            state={p.state}
                            onComplete={() => phantomChips.remove(p.id)}
                        />
                    ))}
                </AnimatePresence>
            </OverlayLayer>
        </MotionContext.Provider>
    );
};
