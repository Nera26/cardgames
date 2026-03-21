'use client';

import React, { useState, useEffect } from 'react';
import { Player, Card as CardType } from '@/types/game';
import { cn } from '@/lib/utils';
import { AnimatedCard } from './AnimatedCard';
import { PlayerAvatar } from './PlayerAvatar';
import { ActionBadge } from './ActionBadge';
import { BetChip } from './BetChip';
import { TurnTimerRing } from './TurnTimerRing';
import { TurnTimerData } from '@/contexts/SocketContext';
import { PositionResult } from '@/hooks/useTablePositions';
import { useUI } from '@/contexts/UIContext';

interface PlayerSeatProps {
    player: Player & { seatIndex: number };
    position: PositionResult;
    isHero: boolean;
    isPortrait: boolean;
    onRebuy?: () => void;
    onResumePlay?: () => void;
    isWinner?: boolean;
    handDescription?: string;
    amountWon?: number;
    isOffline?: boolean;
    turnTimer?: TurnTimerData | null;
    handStrength?: string;
    /** When true, dim this player's cards (showdown spotlight — non-winner) */
    isDimmed?: boolean;
    /** Revealed cards during showdown — overrides default hidden cards for opponents */
    showdownCards?: CardType[];
    /** Current table phase for mid-hand joiner detection */
    tablePhase?: string;
    /** When false, cards are invisible (waiting for deal animation). Defaults true. */
    dealReady?: boolean;
    /** This seat's index in the dealing order (0 = first dealt to) */
    seatDealOrder?: number;
    /** Total players being dealt to — needed for round-robin delay calc */
    totalDealPlayers?: number;
    /** 🟣 Iron Grid: ref attached to outermost positioned element for coordinate extraction */
    seatRef?: React.Ref<HTMLDivElement>;
    /** Winning 5-card subset for per-card highlight — cards NOT in this list are dimmed */
    highlightCards?: string[];
    /** 🟣 Radial Anchor: player's current bet this round (rendered as chip inside seat) */
    currentBet?: number;
    /** 🟣 Radial Anchor: portrait vs landscape — controls offset distance */
    isPortraitTable?: boolean;
    /** 🟣 Purple Cable: callback to re-open the minimized deposit modal */
    onResumeDeposit?: () => void;
    /** Big blind value for BB display mode */
    bigBlind?: number;
}

// ── Synced Deposit Countdown ──
// Displays a live countdown from the server-provided depositExpiresAt timestamp.
// Each client calculates its own remaining time from this single source of truth.
const DepositCountdown: React.FC<{ expiresAt: number }> = ({ expiresAt }) => {
    const [remaining, setRemaining] = useState(() => {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, expiresAt - now);
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            setRemaining(Math.max(0, expiresAt - now));
        }, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return <span>{mins}:{secs.toString().padStart(2, '0')}</span>;
};

const PlayerSeatInner: React.FC<PlayerSeatProps> = ({
    player,
    position,
    isHero,
    isPortrait,
    onRebuy,
    onResumePlay,
    isWinner = false,
    handDescription,
    amountWon,
    isOffline = false,
    turnTimer = null,
    handStrength,
    isDimmed = false,
    showdownCards,
    tablePhase,
    dealReady = true,
    seatDealOrder = 0,
    totalDealPlayers = 1,
    highlightCards,
    seatRef,
    currentBet = 0,
    isPortraitTable = false,
    onResumeDeposit,
    bigBlind = 0,
}) => {
    const isInHand = player.status === 'active' || player.status === 'all-in';
    const isWaitingPhase = tablePhase === 'waiting';
    const hasCards = player.cards && player.cards.length > 0 && isInHand && !isWaitingPhase;
    const { displayInBB } = useUI();

    // 🟣 Round-robin pitch delay: (roundIndex * playerCount + seatOrder) * 120ms
    const PITCH_DELAY = 0.12; // 120ms per card pitch
    const getCardDealDelay = (cardIndex: number) =>
        (cardIndex * totalDealPlayers + seatDealOrder) * PITCH_DELAY;

    // ── Centripetal Card Anchor ──
    // Uses the seat's angle (deg) to push cards toward the table center.
    // Hero always gets the side-car (right). Opponents push inward.
    const getCardAnchor = (): string => {
        if (isHero) {
            // Hero: Side-Car to the right, tight to avatar
            return 'absolute -right-[64px] top-1/2 -translate-y-1/2';
        }
        const deg = position.deg;
        const angle = ((deg % 360) + 360) % 360;

        if (angle > 45 && angle <= 135) {
            // Bottom quadrant — push cards up (toward center)
            return 'absolute -top-1 left-1/2 -translate-x-1/2';
        } else if (angle > 135 && angle <= 225) {
            // Left side — push cards to the RIGHT (toward center)
            return 'absolute -right-[36px] top-1/2 -translate-y-1/2';
        } else if (angle > 225 && angle <= 315) {
            // Top quadrant — push cards down (toward center)
            return 'absolute -bottom-1 left-1/2 -translate-x-1/2';
        } else {
            // Right side (315-360, 0-45) — push cards to the LEFT (toward center)
            return 'absolute -left-[36px] top-1/2 -translate-y-1/2';
        }
    };

    // ── 🟣 Zero-Point Anchor: Radial Bet Offset ──
    // Push distance: tighter on mobile (portrait), wider on desktop (landscape)
    const betDistance = isPortraitTable ? 55 : 80;
    const betRad = (position.deg * Math.PI) / 180;
    // Push TOWARD center = OPPOSITE direction of the seat angle
    const betOffsetX = -Math.cos(betRad) * betDistance;
    const betOffsetY = -Math.sin(betRad) * betDistance;

    // ── Bet Formatting ──
    const formattedBet = (() => {
        if (displayInBB && bigBlind > 0) {
            const bb = currentBet / bigBlind;
            return bb % 1 === 0 ? `${bb} BB` : `${bb.toFixed(1)} BB`;
        }
        return currentBet >= 10000
            ? `$${(currentBet / 1000).toFixed(currentBet % 1000 === 0 ? 0 : 1)}K`
            : `$${currentBet.toLocaleString()}`;
    })();

    // ── Dynamic Omaha Overlap ──
    // More cards = tighter squeeze so they don't explode in width
    const getCardOverlap = (): string => {
        const count = player.cards?.length ?? 2;
        if (count <= 2) return '-6px';
        if (count <= 4) return '-16px';
        return '-20px';  // 5-6 cards (PLO6)
    };

    return (
        <div
            ref={seatRef}
            className="absolute"
            style={{
                left: position.avatar.left,
                top: position.avatar.top,
                transform: 'translate(-50%, -50%)',
                zIndex: 30,
            }}
        >
            {/* The Player Island — relative container */}
            {/* Hero: horizontal row (avatar left, cards right)
             * Opponents: vertical column (avatar on top, cards centripetal) */}
            <div className={cn(
                "relative",
                isHero
                    ? "flex flex-row items-center gap-1"
                    : "flex flex-col items-center"
            )}>

                {/* Avatar wrapper — provides relative context for timer ring + overlays */}
                <div className="relative flex flex-col items-center">

                    {/* ── LAYER 4: ACTION BADGE (centered on avatar, z-40) ── */}
                    {player.lastAction && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 whitespace-nowrap">
                            <ActionBadge action={player.lastAction} />
                        </div>
                    )}

                    {/* ── LAYER 1: AVATAR (base) ── */}
                    <PlayerAvatar
                        player={player}
                        isHero={isHero}
                        isPortrait={isPortrait}
                        isWinner={isWinner}
                        handDescription={handDescription}
                        amountWon={amountWon}
                        onRebuy={onRebuy}
                        bigBlind={bigBlind}
                    />

                    {/* ── LAYER 1.5: TURN TIMER RING (z-35) ── */}
                    {(() => {
                        const showRing = player.isActive
                            && turnTimer != null
                            && Number(turnTimer.seat) === Number(player.seatIndex);
                        // console.log removed — fired on every seat render (perf)
                        return showRing ? (
                            <TurnTimerRing
                                deadline={turnTimer.startedAt + turnTimer.durationMs}
                                totalDuration={turnTimer.durationMs}
                                isActive={true}
                                isTimeBank={turnTimer.isTimeBank ?? false}
                            />
                        ) : null;
                    })()}


                    {/* ── LAYER 2: DISCONNECTED OVERLAY ── */}
                    {isOffline && (
                        <div className="absolute inset-0 z-45 flex items-center justify-center rounded-full">
                            <div className="absolute inset-0 bg-black/60 rounded-full" />
                            <svg
                                className="relative w-5 h-5 text-red-400 animate-pulse drop-shadow-lg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M1 1l22 22" />
                                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                                <circle cx="12" cy="20" r="1" fill="currentColor" />
                            </svg>
                        </div>
                    )}

                    {/* ── LAYER 2.5: WAITING FOR NEXT HAND OVERLAY ── */}
                    {player.status === 'waiting' && tablePhase && tablePhase !== 'waiting' && tablePhase !== 'showdown' && (
                        <div className="absolute inset-0 z-45 flex items-center justify-center rounded-full">
                            <div className="absolute inset-0 bg-black/50 rounded-full" />
                            <span className="relative text-[8px] font-semibold text-white/70 text-center leading-tight px-1">
                                Waiting…
                            </span>
                        </div>
                    )}

                    {/* ── LAYER 2.6: DEPOSITING OVERLAY (amber badge + synced countdown) ── */}
                    {player.depositExpiresAt && player.depositExpiresAt > Math.floor(Date.now() / 1000) && (
                        <>
                            <div className="absolute inset-0 z-45 flex items-center justify-center rounded-full">
                                <div className={`absolute inset-0 bg-amber-900/60 rounded-full border-2 border-amber-400/50 ${isHero && onResumeDeposit ? 'animate-pulse' : 'animate-pulse'}`} />
                            </div>
                            <div
                                className={`absolute -bottom-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap ${
                                    isHero && onResumeDeposit ? 'pointer-events-auto cursor-pointer' : ''
                                }`}
                                onClick={isHero && onResumeDeposit ? onResumeDeposit : undefined}
                            >
                                <div className={`text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 transition-all ${
                                    isHero && onResumeDeposit
                                        ? 'bg-amber-500 hover:bg-amber-400 hover:scale-110 shadow-amber-500/40'
                                        : 'bg-amber-600/90'
                                }`}>
                                    <span>🏦</span>
                                    <DepositCountdown expiresAt={player.depositExpiresAt} />
                                </div>
                                {isHero && onResumeDeposit && (
                                    <p className="text-[6px] text-amber-300/80 text-center mt-0.5 font-semibold">Tap to resume</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── LAYER 3: OPPONENT HOLE CARDS ── */}
                    {hasCards && !isHero && (
                        showdownCards && showdownCards.length > 0 ? (
                            /* Showdown: cards COVER the avatar circle — name/balance stay visible below */
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center"
                                style={{ width: 60, height: 60 }}
                            >
                                <div className="flex items-center scale-[0.75]">
                                    {showdownCards.map((card, i) => {
                                        // Per-card dimming: if highlightCards is set, only highlight cards in the winning 5
                                        const cardId = `${card.rank}${card.suit}`;
                                        const isCardHighlighted = highlightCards ? highlightCards.includes(cardId) : false;
                                        const cardDimmed = isDimmed || (highlightCards ? !isCardHighlighted : false);
                                        return (
                                            <AnimatedCard
                                                key={`reveal-${card.rank || 'x'}${card.suit}-${i}`}
                                                card={{ ...card, isFaceUp: true }}
                                                size="sm"
                                                delay={0.3 + i * 0.15}
                                                isDimmed={cardDimmed}
                                                isWinning={isCardHighlighted}
                                                dealReady={true}
                                                className={cn(
                                                    'shadow-lg',
                                                    i > 0 && 'ml-[-10px]',
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* Normal: tiny face-down badges peeking from right */
                            <div className="absolute -right-6 top-1 z-30 flex items-center scale-[0.35] origin-left">
                                {player.cards.map((card, i) => (
                                    <AnimatedCard
                                        key={`opp-${card.rank || 'x'}${card.suit}-${i}`}
                                        card={{ ...card, isFaceUp: false }}
                                        size="sm"
                                        delay={getCardDealDelay(i)}
                                        isDimmed={isDimmed}
                                        dealReady={dealReady}
                                        className={cn(
                                            'shadow-md',
                                            i > 0 && 'ml-[-14px]',
                                        )}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {/* ── 🟣 RADIAL BET CHIP (Zero-Point Anchor) ── */}
                    {/* Bet chip pushed onto felt via trig; Action Badge is on the avatar */}
                    {currentBet > 0 && (
                        <div
                            className="absolute top-1/2 left-1/2 w-0 h-0 z-[35] pointer-events-none"
                            style={{
                                transform: `translate(${betOffsetX.toFixed(1)}px, ${betOffsetY.toFixed(1)}px)`,
                            }}
                        >
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="bg-black/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg border border-gold-500/30 whitespace-nowrap">
                                    <BetChip size="sm" />
                                    <span
                                        className="text-gold-400 font-mono font-bold text-xs tabular-nums"
                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                    >
                                        {formattedBet}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>


                {/* ── LAYER 3: HERO HOLE CARDS (Inline Side-Car) ── */}
                {/* Hero cards flow naturally next to the avatar — never overlap */}
                {hasCards && isHero && (
                    <div className="flex flex-col items-center z-30">
                        <div className="relative flex items-center group cursor-pointer scale-[0.75] origin-center">
                            {player.cards.map((card, i) => {
                                // Per-card dimming for hero too
                                const cardId = `${card.rank}${card.suit}`;
                                const isCardHighlighted = highlightCards ? highlightCards.includes(cardId) : false;
                                const cardDimmed = isDimmed || (highlightCards && card.isFaceUp ? !isCardHighlighted : false);
                                return (
                                    <div
                                        key={`hero-${card.rank || 'x'}${card.suit}-${i}`}
                                        className="transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-110"
                                        style={{
                                            marginLeft: i > 0 ? '-8px' : '0',
                                        }}
                                    >
                                        <AnimatedCard
                                            card={{ ...card, isFaceUp: card.isFaceUp }}
                                            size="sm"
                                            delay={getCardDealDelay(i)}
                                            isDimmed={!!cardDimmed}
                                            isWinning={isCardHighlighted}
                                            dealReady={dealReady}
                                            className="shadow-lg"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {/* ── HAND STRENGTH BADGE (directly below cards) ── */}
                        {handStrength && (
                            <div className="bg-black/80 px-2.5 py-0.5 rounded-full
                                text-[9px] text-white font-semibold whitespace-nowrap
                                shadow-lg border border-white/10 mt-1">
                                {handStrength}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// 🔴 React.memo: prevents re-render when this seat's props haven't changed
function arePlayerSeatPropsEqual(prev: PlayerSeatProps, next: PlayerSeatProps): boolean {
    // Fast identity checks
    if (prev.player.id !== next.player.id) return false;
    if (prev.player.status !== next.player.status) return false;
    if (prev.player.balance !== next.player.balance) return false;
    if (prev.player.currentBet !== next.player.currentBet) return false;
    if (prev.player.isActive !== next.player.isActive) return false;
    if (prev.player.lastAction !== next.player.lastAction) return false;
    if (prev.player.isDealer !== next.player.isDealer) return false;
    if (prev.isWinner !== next.isWinner) return false;
    if (prev.isDimmed !== next.isDimmed) return false;
    if (prev.dealReady !== next.dealReady) return false;
    if (prev.isOffline !== next.isOffline) return false;
    if (prev.handStrength !== next.handStrength) return false;
    if (prev.handDescription !== next.handDescription) return false;
    if (prev.amountWon !== next.amountWon) return false;
    if (prev.tablePhase !== next.tablePhase) return false;
    if (prev.seatDealOrder !== next.seatDealOrder) return false;
    if (prev.totalDealPlayers !== next.totalDealPlayers) return false;
    // Turn timer: compare seat match (not object identity)
    const prevTimerSeat = prev.turnTimer?.seat;
    const nextTimerSeat = next.turnTimer?.seat;
    if (prevTimerSeat !== nextTimerSeat) return false;
    if (prev.turnTimer?.startedAt !== next.turnTimer?.startedAt) return false;
    // Cards: compare by stringified identity (cheap for 2-4 cards)
    const prevCards = prev.player.cards?.map(c => `${c.rank}${c.suit}`).join(',') ?? '';
    const nextCards = next.player.cards?.map(c => `${c.rank}${c.suit}`).join(',') ?? '';
    if (prevCards !== nextCards) return false;
    // Showdown cards
    const prevShowdown = prev.showdownCards?.map(c => `${c.rank}${c.suit}`).join(',') ?? '';
    const nextShowdown = next.showdownCards?.map(c => `${c.rank}${c.suit}`).join(',') ?? '';
    if (prevShowdown !== nextShowdown) return false;
    // Highlight cards
    const prevHighlight = prev.highlightCards?.join(',') ?? '';
    const nextHighlight = next.highlightCards?.join(',') ?? '';
    if (prevHighlight !== nextHighlight) return false;
    // 🟣 Radial Anchor: bet chip props
    if (prev.currentBet !== next.currentBet) return false;
    if (prev.isPortraitTable !== next.isPortraitTable) return false;
    // Big blind value for BB display
    if (prev.bigBlind !== next.bigBlind) return false;
    // Deposit state
    if (prev.player.depositExpiresAt !== next.player.depositExpiresAt) return false;
    // Resume deposit callback identity
    if (prev.onResumeDeposit !== next.onResumeDeposit) return false;
    return true;
}

export const PlayerSeat = React.memo(PlayerSeatInner, arePlayerSeatPropsEqual);

