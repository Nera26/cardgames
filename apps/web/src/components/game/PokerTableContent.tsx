'use client';

/**
 * PokerTableContent — The Real Game Felt (Extracted from page.tsx)
 * 
 * 🟣 Purple Cable: Visual Multiplexer
 * 
 * Renders the full poker table felt with:
 *   - 3D background rail + felt (decorative layer)
 *   - 2D coordinate layer for seats + community cards
 *   - Player seats with animations, showdown, highlights
 *   - Pot display (single + multi-pot side pots)
 *   - Uncalled bet refund animation
 *   - Hand strength evaluation for hero
 * 
 * Extracted so it can be used in both the full game page
 * AND the multi-table DesktopTableGrid cells.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommunityCards } from '@/components/game/CommunityCards';
import { BetChip } from '@/components/game/BetChip';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { EmptySeat } from '@/components/game/EmptySeat';
import { NextHandTimer } from '@/components/game/NextHandTimer';
import { ShowdownOverlay } from '@/components/game/ShowdownOverlay';
import { PotToWinnerAnimation } from '@/components/game/PotToWinnerAnimation';
import { useTablePositions, RadiusConfig } from '@/hooks/useTablePositions';
import { useUI } from '@/contexts/UIContext';
import { useTableLayoutOptional } from '@/contexts/TableLayoutContext';
import { HandResultData, TurnTimerData } from '@/contexts/SocketContext';
import { cn } from '@/lib/utils';
import { Player, Card as CardType, SidePot } from '@/types/game';
import { useHandStrength } from '@/hooks/useHandStrength';
import { GameVariant } from '@poker/shared';

// ============================================
// CONSTANTS (shared with page.tsx)
// ============================================
export const TOTAL_SEATS = 9;

export const PORTRAIT_RADIUS: RadiusConfig = {
    outerX: 46, outerY: 44,
    innerX: 30, innerY: 32
};

export const LANDSCAPE_RADIUS: RadiusConfig = {
    outerX: 44, outerY: 40,
    innerX: 32, innerY: 28
};

// ============================================
// PokerTableContent Props
// ============================================
export interface PokerTableContentProps {
    players: Array<Player & { seatIndex: number }>;
    heroSeatIndex: number;
    pot: number;
    pots?: SidePot[];
    communityCards: CardType[];
    isPortrait: boolean;
    radiusConfig: RadiusConfig;
    phase?: string;
    onRebuy?: () => void;
    onSeatClick?: (seatIndex: number) => void;
    onResumePlay?: () => void;
    isSpectator?: boolean;
    handResult?: HandResultData | null;
    offlineSeats?: Record<number, boolean>;
    turnTimer?: TurnTimerData | null;
    variant?: GameVariant;
    uncalledBetRefund?: { seat: number; amount: number } | null;
    /** 🟣 Purple Cable: callback to re-open minimized deposit modal */
    onResumeDeposit?: () => void;
    /** Big blind for BB display mode */
    bigBlind?: number;
}

// ============================================
// THE COMPONENT
// ============================================
export const PokerTableContent: React.FC<PokerTableContentProps> = ({
    players,
    heroSeatIndex,
    pot,
    pots,
    communityCards,
    isPortrait,
    radiusConfig,
    phase,
    onRebuy,
    onResumePlay,
    onSeatClick,
    isSpectator = false,
    handResult,
    offlineSeats = {},
    turnTimer = null,
    variant,
    uncalledBetRefund = null,
    onResumeDeposit,
    bigBlind = 0,
}) => {
    const positions = useTablePositions(TOTAL_SEATS, heroSeatIndex, radiusConfig);

    // 🟣 Iron Grid: attach DOM refs for animation targeting
    const layout = useTableLayoutOptional();

    // 🟣 Purple Cable: Client-side hand strength evaluation
    const heroPlayer = players.find(p => p.seatIndex === heroSeatIndex);
    const gameType: 'holdem' | 'omaha' = variant === 'OMAHA' ? 'omaha' : 'holdem';
    const handStrength = useHandStrength(
        heroPlayer?.cards ?? [],
        communityCards,
        gameType,
    );

    // 🟣 Showdown Delay: Buffer handResult by 1s so card flip animations finish before
    // the overlay, spotlight, dimming, and win amounts appear.
    const [delayedHandResult, setDelayedHandResult] = useState<HandResultData | null>(null);
    useEffect(() => {
        if (handResult) {
            const timer = setTimeout(() => setDelayedHandResult(handResult), 1500);
            return () => clearTimeout(timer);
        } else {
            setDelayedHandResult(null);
        }
    }, [handResult]);

    // 🟣 Purple Cable: Synchronized deal sequence — cards invisible until FlyingCard lands
    const [dealReady, setDealReady] = useState(true); // Start true for mid-hand joins
    const prevPhaseRef = useRef<string | undefined>(phase);
    const dealTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const prevPhase = prevPhaseRef.current;
        prevPhaseRef.current = phase;

        // Detect ANY transition into preflop (new hand dealt)
        if (prevPhase !== 'preflop' && phase === 'preflop') {
            setDealReady(false);
            const activePlayers = players.filter(p => p.status === 'active' || p.status === 'all-in');
            const totalCards = 2 * activePlayers.length;
            const dealDuration = 800 + totalCards * 120 + 500;
            if (dealTimerRef.current) clearTimeout(dealTimerRef.current);
            dealTimerRef.current = setTimeout(() => setDealReady(true), dealDuration);
            return () => {
                if (dealTimerRef.current) clearTimeout(dealTimerRef.current);
            };
        }

        // Safety override: if phase moved PAST preflop, cards must be visible
        if (phase && phase !== 'preflop' && phase !== 'waiting') {
            setDealReady(true);
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    // 🟣 Visual pot: base pot + current round bets (so pot updates after every action)
    const currentRoundBets = players.reduce((sum, p) => sum + (p.currentBet ?? 0), 0);
    const visualPot = (pots && pots.length > 0)
        ? pots.reduce((sum, p) => sum + p.amount, 0)
        : pot + currentRoundBets;

    // 🟣 BB Display: format pot/side-pot amounts
    const { displayInBB } = useUI();
    const formatPot = (amount: number): string => {
        if (displayInBB && bigBlind > 0) {
            const bb = amount / bigBlind;
            return bb % 1 === 0 ? `${bb} BB` : `${bb.toFixed(1)} BB`;
        }
        return `$${amount.toLocaleString()}`;
    };

    // 🟣 Phase 2 (Spotlight): Derive winning 5-card subset for community card highlighting
    const highlightCards = useMemo(() => {
        if (!delayedHandResult?.winners?.length) return undefined;
        const allWinningCards = delayedHandResult.winners
            .filter(w => w.type === 'win')
            .flatMap(w => w.winningCards || []);
        if (allWinningCards.length === 0) return undefined;

        const suitMap: Record<string, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
        return allWinningCards.map(card => {
            const rank = card.slice(0, -1);
            const suit = suitMap[card.slice(-1)] || 'spades';
            return `${rank === 'T' ? '10' : rank}${suit}`;
        });
    }, [delayedHandResult]);

    // 🟣 Phase 2 (Spotlight): Set of winner seats for dimming non-winners
    const winnerSeats = useMemo(() => {
        if (!delayedHandResult) return new Set<number>();
        const seats = new Set<number>();
        delayedHandResult.winners?.forEach(w => {
            if (w.type === 'win') seats.add(w.seat);
        });
        if (delayedHandResult.winningSeat !== undefined) seats.add(delayedHandResult.winningSeat);
        return seats;
    }, [delayedHandResult]);

    // 🟣 Showdown: Convert revealedHands (backend format) → CardType[] per seat
    const revealedCardsMap = useMemo(() => {
        const map = new Map<number, CardType[]>();
        if (!delayedHandResult?.revealedHands) return map;
        const suitMap: Record<string, CardType['suit']> = {
            s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs',
        };
        for (const hand of delayedHandResult.revealedHands) {
            const cards: CardType[] = hand.cards.map(cardStr => {
                const rank = cardStr.slice(0, -1);
                const suit = suitMap[cardStr.slice(-1)] || 'spades';
                return { rank: rank === 'T' ? '10' : rank, suit, isFaceUp: true };
            });
            map.set(hand.seat, cards);
        }
        return map;
    }, [delayedHandResult]);

    // 🔴 PERF: Pre-compute deal order outside JSX (replaces per-render IIFE)
    const { seatDealOrderMap, activeSeatCount } = useMemo(() => {
        const sorted = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
        const orderMap = new Map<number, number>();
        sorted.forEach((p, idx) => orderMap.set(p.seatIndex, idx));
        return { seatDealOrderMap: orderMap, activeSeatCount: sorted.length };
    }, [players]);


    return (
        <>
            {/* ═══ LAYER 1: 3D BACKGROUND (Decorative — tilted felt + rail) ═══ */}
            <div
                className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9] pointer-events-none",
                    isPortrait
                        ? "w-[340px] h-[620px] rounded-[170px]"
                        : "w-[1050px] h-[470px] rounded-[235px]"
                )}
                style={{
                    background: 'radial-gradient(50% 50% at 50% 50%, var(--color-table-felt) 0%, color-mix(in srgb, var(--color-table-felt) 60%, black) 100%)',
                    border: '15px solid var(--color-table-border)',
                    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7), 0 0 60px rgba(0,0,0,0.4), 0 8px 30px rgba(0,0,0,0.5)',
                    transition: 'background 0.5s ease-in-out, border-color 0.5s ease-in-out',
                    // 🟣 Pseudo-3D tilt — portrait only, purely cosmetic
                    ...(isPortrait ? {
                        transform: 'perspective(800px) rotateX(8deg)',
                        transformOrigin: 'center 40%',
                    } : {}),
                }}
            >
                <div className={cn(
                    "absolute inset-0 overflow-hidden",
                    isPortrait ? "rounded-[160px]" : "rounded-[225px]"
                )}>
                    <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
                </div>
            </div>

            {/* ═══ LAYER 2: 2D COORDINATE LAYER (Flat — Iron Grid safe) ═══ */}
            {/* This layer is NEVER transformed. getBoundingClientRect() stays accurate. */}
            <div className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                isPortrait
                    ? "w-[340px] h-[620px]"
                    : "w-[1050px] h-[470px]"
            )}>
                {/* Pot & Community Cards */}
                <div ref={layout?.potRef} className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 pointer-events-none",
                    isPortrait && "pt-[5%]"  /* Shift pot+cards DOWN in portrait so they clear the side seats' bet chips */
                )}>
                    <div className="flex flex-col items-center gap-1">
                        {/* Multi-pot display: Main Pot + Side Pots */}
                        {(pots && pots.length > 1) ? (
                            /* Multiple pots — show labeled breakdown */
                            <>
                                {pots.map((sidePot, idx) => (
                                    <div
                                        key={`pot-${idx}`}
                                        className={cn(
                                            'backdrop-blur-md px-4 py-1 rounded-full border flex items-center gap-2 shadow-lg',
                                            idx === 0
                                                ? 'bg-surface/80 border-border'
                                                : 'bg-surface/60 border-border/50 scale-90'
                                        )}
                                    >
                                        <span className="text-[9px] text-text-secondary font-bold tracking-wider uppercase">
                                            {idx === 0 ? 'MAIN POT' : `SIDE POT ${idx}`}
                                        </span>
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={sidePot.amount}
                                                className={cn(
                                                    'font-mono font-bold',
                                                    idx === 0 ? 'text-gold-500 text-lg' : 'text-gold-400 text-sm'
                                                )}
                                                initial={{ scale: 1.4, color: '#FFE135' }}
                                                animate={{ scale: 1, color: idx === 0 ? 'var(--color-gold-500)' : 'var(--color-gold-400)' }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                                {formatPot(sidePot.amount)}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                ))}
                                <NextHandTimer
                                    durationMs={delayedHandResult?.nextHandDelay ?? 5000}
                                    isActive={!!delayedHandResult}
                                />
                            </>
                        ) : (
                            /* Single pot — original display */
                            <>
                                <div className="bg-surface/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-border flex items-center gap-2 shadow-lg mb-2">
                                    <span className="text-[10px] text-text-secondary font-bold tracking-wider uppercase">POT</span>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={visualPot}
                                            className="text-gold-500 font-mono text-lg font-bold"
                                            initial={{ scale: 1.4, color: '#FFE135' }}
                                            animate={{ scale: 1, color: 'var(--color-gold-500)' }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            {formatPot(visualPot)}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                                <NextHandTimer
                                    durationMs={delayedHandResult?.nextHandDelay ?? 5000}
                                    isActive={!!delayedHandResult}
                                />
                            </>
                        )}
                    </div>
                    {((phase && phase !== 'waiting' && phase !== 'preflop') || (communityCards && communityCards.length > 0)) && (
                        <CommunityCards
                            cards={communityCards}
                            highlightCards={highlightCards}
                            className={isPortrait ? 'scale-[0.80] origin-center' : 'scale-[0.80] origin-center'}
                        />
                    )}
                    {/* 🟣 Showdown Overlay: 4-phase cinematic sequence */}
                    <ShowdownOverlay
                        handResult={delayedHandResult ?? null}
                        heroSeatIndex={heroSeatIndex}
                        isVisible={!!delayedHandResult}
                    />
                    {/* 🟣 Pot-to-Winner: Chips fly from pot center to each winner's seat */}
                    <PotToWinnerAnimation
                        winners={delayedHandResult?.winners ?? []}
                        positions={positions}
                        isPortrait={isPortrait}
                        isActive={!!delayedHandResult && (delayedHandResult.winners?.length ?? 0) > 0}
                    />
                    {phase === 'waiting' && !handResult && (
                        <div className="text-white/50 text-sm">Waiting for players...</div>
                    )}
                </div>
            </div>

            {/* Player Seats Layer */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Occupied Seats */}
                {players.map((player) => {
                    const seatIndex = player.seatIndex;
                    const position = positions[seatIndex];
                    // CRASH GUARD: skip if seatIndex is out of bounds
                    if (!position) return null;
                    const isHero = seatIndex === heroSeatIndex;

                    // Check if this player is a real winner (type="win" only, not refunds)
                    const winsForSeat = delayedHandResult?.winners?.filter(w => w.seat === seatIndex && w.type === 'win') ?? [];
                    const winnerInfo = winsForSeat.length > 0 ? {
                        ...winsForSeat[0],
                        amount: winsForSeat.reduce((sum, w) => sum + (w.displayAmount || w.amount), 0),
                    } : undefined;
                    const isWinnerBySeat = delayedHandResult?.winningSeat === seatIndex;
                    const isWinner = !!winnerInfo || isWinnerBySeat;

                    // 🟣 Per-seat winning cards (converted to frontend format)
                    const seatHighlightCards = (() => {
                        if (!isWinner || !winsForSeat.length) return undefined;
                        const suitMap: Record<string, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
                        const cards = winsForSeat.flatMap(w => w.winningCards || []);
                        if (cards.length === 0) return undefined;
                        return cards.map(card => {
                            const rank = card.slice(0, -1);
                            const suit = suitMap[card.slice(-1)] || 'spades';
                            return `${rank === 'T' ? '10' : rank}${suit}`;
                        });
                    })();

                    return (
                        <PlayerSeat
                            key={player.id}
                            seatRef={layout?.registerSeat(seatIndex)}
                            player={player}
                            position={position}
                            isHero={isHero}
                            isPortrait={isPortrait}
                            onRebuy={isHero ? onRebuy : undefined}
                            onResumePlay={isHero ? onResumePlay : undefined}
                            isWinner={isWinner}
                            handDescription={winnerInfo?.handDescription}
                            amountWon={winnerInfo?.amount}
                            isOffline={!!offlineSeats[seatIndex]}
                            turnTimer={turnTimer}
                            handStrength={isHero ? (handStrength ?? undefined) : undefined}
                            isDimmed={!!handResult && !isWinner && winnerSeats.size > 0}
                            showdownCards={revealedCardsMap.get(seatIndex)}
                            tablePhase={phase}
                            dealReady={dealReady}
                            seatDealOrder={seatDealOrderMap.get(seatIndex) ?? 0}
                            totalDealPlayers={activeSeatCount}
                            highlightCards={seatHighlightCards}
                            currentBet={player.currentBet}
                            isPortraitTable={isPortrait}
                            onResumeDeposit={isHero ? onResumeDeposit : undefined}
                            bigBlind={bigBlind}
                        />
                    );
                })}

                {/* 🟣 Bet chips now anchored inside PlayerSeat via radial offsets */}

                {/* 🟣 UNCALLED BET REFUND: Chip slides from avatar zone back to player seat */}
                <AnimatePresence>
                    {uncalledBetRefund && (() => {
                        const refundSeat = uncalledBetRefund.seat;
                        const position = positions[refundSeat];
                        if (!position) return null;

                        const startLeft = position.avatar.left;
                        const startTop = position.avatar.top;

                        const formatted = uncalledBetRefund.amount >= 10000
                            ? `${(uncalledBetRefund.amount / 1000).toFixed(uncalledBetRefund.amount % 1000 === 0 ? 0 : 1)}K`
                            : uncalledBetRefund.amount.toLocaleString();

                        return (
                            <motion.div
                                key={`refund-${refundSeat}-${uncalledBetRefund.amount}`}
                                className="absolute z-[36] pointer-events-none"
                                style={{
                                    left: startLeft,
                                    top: startTop,
                                    transform: 'translate(-50%, -50%)',
                                }}
                                initial={{ scale: 1.2, opacity: 1 }}
                                animate={{
                                    scale: 0.8,
                                    opacity: 0,
                                    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                                }}
                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            >
                                <div className="bg-emerald-900/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg border border-emerald-400/50">
                                    <BetChip size="sm" />
                                    <span
                                        className="text-emerald-400 font-mono font-bold text-xs tabular-nums"
                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                    >
                                        +${formatted}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                {/* Ghost Seats (Empty positions - only show for spectators) */}
                {isSpectator && Array.from({ length: TOTAL_SEATS }, (_, i) => {
                    const isOccupied = players.some(p => p.seatIndex === i);
                    if (isOccupied) return null;

                    const position = positions[i];
                    if (!position) return null;
                    return (
                        <EmptySeat
                            key={`empty-${i}`}
                            seatIndex={i}
                            isPortrait={isPortrait}
                            style={{
                                left: position.avatar.left,
                                top: position.avatar.top,
                                transform: 'translate(-50%, -50%)',
                            }}
                            onClick={() => onSeatClick?.(i)}
                        />
                    );
                })}

            </div>
        </>
    );
};
