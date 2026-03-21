'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faPause,
    faForwardStep,
    faBackwardStep,
    faRotateLeft,
    faXmark,
    faTrophy,
    faGaugeHigh,
} from '@fortawesome/free-solid-svg-icons';
import { useHandReplayer, ActionEntry } from '@/hooks/useHandReplayer';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { AnimatedCard } from '@/components/game/AnimatedCard';
import { CardBack } from '@/components/game/visuals/CardFace';
import { useTablePositions, RadiusConfig } from '@/hooks/useTablePositions';
import { Player, Card as CardType } from '@/types/game';

// ── Types ──
interface WinnerInfo {
    seat: number;
    amount: number;
    handDescription: string | null;
    cards?: string[];
    name?: string | null;
}

interface VisualReplayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionLog: ActionEntry[];
    communityCards: string[];
    winners: WinnerInfo[];
    heroSeat: number | null;
    heroCards?: string[];
    pot: number;
}

// ── Constants ──
const TOTAL_SEATS = 9;

const REPLAY_RADIUS: RadiusConfig = {
    outerX: 44, outerY: 40,
    innerX: 32, innerY: 28,
};

const SPEED_OPTIONS = [
    { label: '1x', ms: 1500 },
    { label: '2x', ms: 750 },
    { label: '4x', ms: 375 },
];

// ── Suit Conversion ──
const SUIT_MAP: Record<string, 'hearts' | 'spades' | 'diamonds' | 'clubs'> = {
    h: 'hearts',
    s: 'spades',
    d: 'diamonds',
    c: 'clubs',
};

function parseCardString(cardStr: any): CardType {
    // Handle object format: { rank: 'A', suit: 's' } or { rank: 'A', suit: 'spades' }
    if (typeof cardStr === 'object' && cardStr !== null) {
        const rank = cardStr.rank || '';
        let suit = cardStr.suit || 'spades';
        // If suit is a single char, map it to full name
        if (suit.length === 1) {
            suit = SUIT_MAP[suit] || 'spades';
        }
        return {
            rank: rank === 'T' ? '10' : rank,
            suit: suit as any,
            isFaceUp: true,
        };
    }
    // Handle string format: 'As', 'Kd', 'Th'
    if (typeof cardStr !== 'string' || !cardStr || cardStr.length < 2) {
        return { rank: '', suit: 'spades', isFaceUp: false };
    }
    const rank = cardStr.slice(0, -1);
    const suitChar = cardStr.slice(-1).toLowerCase();
    return {
        rank: rank === 'T' ? '10' : rank,
        suit: SUIT_MAP[suitChar] || 'spades',
        isFaceUp: true,
    };
}

// ── Action → lastAction mapping ──
const ACTION_TO_LAST_ACTION: Record<string, Player['lastAction']> = {
    fold: 'FOLD',
    check: 'CHECK',
    call: 'CALL',
    raise: 'RAISE',
    bet: 'BET',
    'all-in': 'ALL_IN',
};

// ── Street Labels ──
const STREET_LABELS: Record<string, string> = {
    preflop: 'PRE-FLOP',
    flop: 'FLOP',
    turn: 'TURN',
    river: 'RIVER',
};

// ── Main Component ──
export const VisualReplayerModal: React.FC<VisualReplayerModalProps> = ({
    isOpen,
    onClose,
    actionLog,
    communityCards,
    winners,
    heroSeat,
    heroCards,
    pot: totalPot,
}) => {
    const {
        state,
        isPlaying,
        playbackSpeed,
        totalActions,
        progress,
        togglePlay,
        stepForward,
        stepBackward,
        reset,
        setSpeed,
        goToIndex,
    } = useHandReplayer(actionLog, communityCards);

    // Replay positions — hero always at bottom
    const positions = useTablePositions(
        TOTAL_SEATS,
        heroSeat ?? 0,
        REPLAY_RADIUS
    );

    // Parse hero's hole cards from API (string[] → CardType[])
    const heroCardsParsed: CardType[] = useMemo(() => {
        if (!heroCards || heroCards.length === 0) return [];
        return heroCards.map(parseCardString);
    }, [heroCards]);

    // Parse winner hole cards from API (string[] → CardType[])
    const winnerCardsMap = useMemo(() => {
        const map = new Map<number, CardType[]>();
        for (const w of winners) {
            if (w.cards && w.cards.length > 0) {
                map.set(w.seat, w.cards.map(parseCardString));
            }
        }
        return map;
    }, [winners]);

    // Is the replay complete?
    const isComplete = state.currentIndex >= totalActions - 1;

    // Map replayer derived state → Player objects for PlayerSeat
    const replayPlayers: Array<Player & { seatIndex: number }> = useMemo(() => {
        return Array.from(state.players.entries()).map(([seat, snapshot]) => {
            // Determine cards: hero always gets their cards, winners get cards when replay is complete
            let playerCards: CardType[] = [];
            if (seat === heroSeat && heroCardsParsed.length > 0) {
                playerCards = heroCardsParsed;
            } else if (isComplete && winnerCardsMap.has(seat)) {
                playerCards = winnerCardsMap.get(seat)!;
            }

            return {
                id: `replay-seat-${seat}`,
                seatIndex: seat,
                name: snapshot.name,
                balance: 0, // Not tracked in action log
                avatar: '',
                avatarId: undefined,
                cards: playerCards,
                isActive: snapshot.isActive && seat === state.activeSeat,
                isDealer: false,
                status: snapshot.isActive
                    ? (snapshot.lastAction === 'all-in' ? 'all-in' as const : 'active' as const)
                    : 'folded' as const,
                currentBet: snapshot.lastAmount > 0 && snapshot.lastAction !== 'fold' ? snapshot.lastAmount : 0,
                lastAction: snapshot.lastAction
                    ? ACTION_TO_LAST_ACTION[snapshot.lastAction] || undefined
                    : undefined,
            };
        });
    }, [state.players, state.activeSeat, heroSeat, heroCardsParsed, isComplete, winnerCardsMap]);

    // Convert community card strings to CardType objects
    // When replay is complete, show ALL community cards (all-in skips betting rounds)
    const replayCommunityCards: CardType[] = useMemo(() => {
        if (isComplete && communityCards.length > 0) {
            return communityCards.map(parseCardString);
        }
        return state.visibleCommunityCards.map(parseCardString);
    }, [state.visibleCommunityCards, isComplete, communityCards]);

    // 🟣 Purple Cable Adapter: Force isFaceUp: true on every card
    const formattedCommunityCards: CardType[] = useMemo(() => {
        return replayCommunityCards.map(card => ({ ...card, isFaceUp: true }));
    }, [replayCommunityCards]);

    // Speed cycle
    const currentSpeedIndex = SPEED_OPTIONS.findIndex(s => s.ms === playbackSpeed);
    const cycleSpeed = () => {
        const nextIdx = (currentSpeedIndex + 1) % SPEED_OPTIONS.length;
        setSpeed(SPEED_OPTIONS[nextIdx].ms);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={cn(
                        'pointer-events-auto',
                        'w-full max-w-[900px]',
                        'bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]',
                        'rounded-2xl border border-white/10',
                        'shadow-2xl shadow-black/50',
                        'overflow-hidden',
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="text-white font-bold text-sm">🎬 Hand Replay</span>
                            <span className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                isComplete
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                            )}>
                                {STREET_LABELS[state.currentStreet] || 'WAITING'}
                            </span>
                            {state.currentIndex >= 0 && state.lastAction && (
                                <span className="text-white/30 text-[10px]">
                                    {state.lastAction.player}: {state.lastAction.action.toUpperCase()}
                                    {state.lastAction.amount > 0 && state.lastAction.action !== 'fold' && state.lastAction.action !== 'check'
                                        ? ` $${state.lastAction.amount.toLocaleString()}`
                                        : ''
                                    }
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <FontAwesomeIcon icon={faXmark} className="text-white/60 text-sm" />
                        </button>
                    </div>

                    {/* ── REAL TABLE AREA ── */}
                    <div className="relative w-full overflow-hidden" style={{ height: '420px' }}>
                        {/* Scale wrapper to fit the real components into the modal */}
                        <div
                            className="absolute inset-0 origin-center"
                            style={{
                                transform: 'scale(0.82)',
                                transformOrigin: 'center center',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            {/* Green Felt Table */}
                            <div className="absolute inset-8 rounded-[50%] bg-gradient-to-br from-emerald-800/90 to-emerald-900/90 border-[6px] border-emerald-700/50 shadow-inner shadow-black/30 z-0" />

                            {/* Pot Display — Center */}
                            <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1">
                                {state.pot > 0 && (
                                    <div className="px-4 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm">
                                        <span className="text-amber-300 text-sm font-bold">
                                            ${state.pot.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Community Cards — Direct rendering with skipEntrance for instant face-up */}
                            <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center gap-0.5 p-1 scale-[0.85]">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const card = formattedCommunityCards[i];
                                    const isDealt = i < formattedCommunityCards.length;
                                    return (
                                        <div
                                            key={`replay-board-${i}`}
                                            className={isDealt ? 'opacity-100' : 'opacity-20'}
                                        >
                                            {isDealt ? (
                                                <AnimatedCard
                                                    card={card}
                                                    size="sm"
                                                    delay={0}
                                                    skipEntrance
                                                />
                                            ) : (
                                                <CardBack size="sm" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Player Seats — Real Components */}
                            <div className="absolute inset-0 z-30 pointer-events-none">
                                {replayPlayers.map((player) => {
                                    const position = positions[player.seatIndex];
                                    if (!position) return null;
                                    const isHero = player.seatIndex === heroSeat;
                                    const isWinner = isComplete && winners.some(w => w.seat === player.seatIndex);
                                    const winnerInfo = isComplete
                                        ? winners.find(w => w.seat === player.seatIndex)
                                        : undefined;

                                    return (
                                        <PlayerSeat
                                            key={player.id}
                                            player={player}
                                            position={position}
                                            isHero={isHero}
                                            isPortrait={false}
                                            isWinner={isWinner}
                                            handDescription={winnerInfo?.handDescription ?? undefined}
                                            amountWon={winnerInfo?.amount}
                                            isDimmed={isComplete && !isWinner && winners.length > 0}
                                            tablePhase={isComplete ? 'showdown' : state.currentStreet}
                                            dealReady={true}
                                            currentBet={player.currentBet}
                                            isPortraitTable={false}
                                        />
                                    );
                                })}
                                {/* 🟣 Bet chips now rendered inside PlayerSeat via radial anchoring */}
                            </div>
                        </div>
                    </div>

                    {/* Winners Bar (when complete) */}
                    {isComplete && winners.length > 0 && (
                        <div className="px-5 py-2 bg-emerald-500/10 border-t border-emerald-500/20">
                            <div className="flex items-center gap-2 justify-center flex-wrap">
                                <FontAwesomeIcon icon={faTrophy} className="text-amber-400 text-xs" />
                                {winners.map((w, i) => (
                                    <span key={`w-${i}`} className="text-emerald-300 text-xs font-medium">
                                        Seat {w.seat}: +${w.amount.toLocaleString()}
                                        {w.handDescription ? ` (${w.handDescription})` : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="px-5 pt-2">
                        <div
                            className="w-full h-1.5 bg-white/5 rounded-full cursor-pointer relative"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const ratio = (e.clientX - rect.left) / rect.width;
                                const idx = Math.round(ratio * (totalActions - 1));
                                goToIndex(idx);
                            }}
                        >
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2 border-amber-400 transition-all duration-200"
                                style={{ left: `${progress}%`, marginLeft: '-6px' }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-white/20 text-[9px]">
                                Action {Math.max(0, state.currentIndex + 1)} / {totalActions}
                            </span>
                            <span className="text-white/20 text-[9px]">
                                Total Pot: ${totalPot.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center justify-center gap-3 px-5 py-3">
                        <button
                            onClick={reset}
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            title="Reset"
                        >
                            <FontAwesomeIcon icon={faRotateLeft} className="text-white/50 text-xs" />
                        </button>

                        <button
                            onClick={stepBackward}
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            title="Previous action"
                        >
                            <FontAwesomeIcon icon={faBackwardStep} className="text-white/60 text-xs" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
                                isPlaying
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                    : 'bg-white/10 hover:bg-white/15 text-white/80'
                            )}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            <FontAwesomeIcon
                                icon={isPlaying ? faPause : faPlay}
                                className={cn(isPlaying ? 'text-base' : 'text-base ml-0.5')}
                            />
                        </button>

                        <button
                            onClick={stepForward}
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            title="Next action"
                        >
                            <FontAwesomeIcon icon={faForwardStep} className="text-white/60 text-xs" />
                        </button>

                        <button
                            onClick={cycleSpeed}
                            className="h-9 px-3 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center gap-1.5 transition-colors"
                            title="Playback speed"
                        >
                            <FontAwesomeIcon icon={faGaugeHigh} className="text-white/40 text-xs" />
                            <span className="text-white/60 text-xs font-bold">
                                {SPEED_OPTIONS[currentSpeedIndex >= 0 ? currentSpeedIndex : 0].label}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
