'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrophy, faPlay } from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { VisualReplayerModal } from './VisualReplayerModal';

// ── Types ──
interface ActionEntry {
    street: string;
    seat: number;
    player: string;
    action: string;
    amount: number;
    pot: number;
}

interface HandDetail {
    handId: string;
    endTime: string;
    communityCards: string[];
    pot: number;
    rake: number;
    heroSeat: number | null;
    heroNetProfit: number;
    heroHandDescription: string | null;
    heroCards: string[];
    actionLog: ActionEntry[];
    winners: {
        seat: number;
        amount: number;
        handDescription: string | null;
        cards?: string[];
        name?: string | null;
    }[];
}

interface HandReplayDetailProps {
    tableId: string;
    handId: string;
    onBack: () => void;
}

// ── Action Colors ──
const ACTION_STYLES: Record<string, { color: string; label: string }> = {
    fold: { color: 'text-white/30', label: 'FOLD' },
    check: { color: 'text-white/60', label: 'CHECK' },
    call: { color: 'text-sky-400', label: 'CALL' },
    raise: { color: 'text-amber-400', label: 'RAISE' },
    'all-in': { color: 'text-red-400', label: 'ALL-IN' },
    bet: { color: 'text-amber-400', label: 'BET' },
};

// ── Street Labels ──
const STREET_LABELS: Record<string, string> = {
    preflop: '🃏 Pre-Flop',
    flop: '🟢 Flop',
    turn: '🔵 Turn',
    river: '🔴 River',
};

// ── Mini Card ──
const SUIT_MAP: Record<string, { symbol: string; color: string }> = {
    s: { symbol: '♠', color: 'text-white' },
    h: { symbol: '♥', color: 'text-red-400' },
    d: { symbol: '♦', color: 'text-blue-400' },
    c: { symbol: '♣', color: 'text-emerald-400' },
};

const MiniCard: React.FC<{ card: string }> = ({ card }) => {
    if (!card || card.length < 2) return null;
    const rank = card.slice(0, -1).toUpperCase();
    const suitKey = card.slice(-1).toLowerCase();
    const suit = SUIT_MAP[suitKey] || { symbol: '?', color: 'text-white' };
    return (
        <span className={cn(
            'inline-flex items-center justify-center',
            'w-7 h-10 rounded text-xs font-bold leading-none',
            'bg-white/10 border border-white/10',
            suit.color
        )}>
            {rank}{suit.symbol}
        </span>
    );
};

// ── Group actions by street ──
function groupByStreet(actions: ActionEntry[]): { street: string; actions: ActionEntry[] }[] {
    const groups: { street: string; actions: ActionEntry[] }[] = [];
    let currentStreet = '';

    for (const action of actions) {
        if (action.street !== currentStreet) {
            currentStreet = action.street;
            groups.push({ street: currentStreet, actions: [] });
        }
        groups[groups.length - 1].actions.push(action);
    }

    return groups;
}

// ── Main Component ──
export const HandReplayDetail: React.FC<HandReplayDetailProps> = ({
    tableId,
    handId,
    onBack,
}) => {
    const [detail, setDetail] = useState<HandDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showReplayer, setShowReplayer] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await api.get(`/game/tables/${tableId}/history/${handId}`);
                setDetail(data);
            } catch (err: any) {
                console.error('Failed to fetch hand detail:', err);
                setError('Failed to load hand details');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [tableId, handId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="px-4 py-6">
                <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-4">
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                    <span className="text-sm">Back</span>
                </button>
                <p className="text-red-400 text-sm text-center">{error || 'Hand not found'}</p>
            </div>
        );
    }

    const streetGroups = groupByStreet(detail.actionLog);
    const isProfit = detail.heroNetProfit > 0;
    const isLoss = detail.heroNetProfit < 0;

    return (
        <div className="px-4 py-3 space-y-4">
            {/* Back Button + Hand ID */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                    <span className="text-sm font-medium">Back</span>
                </button>
                <span className="text-white/25 text-[10px] font-mono">
                    #{handId.slice(0, 8)}
                </span>
            </div>

            {/* Community Cards */}
            {detail.communityCards && detail.communityCards.length > 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Board</p>
                    <div className="flex items-center gap-1">
                        {detail.communityCards.map((card, i) => (
                            <MiniCard key={`board-${i}`} card={card} />
                        ))}
                    </div>
                </div>
            )}

            {/* Result Summary */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 flex items-center justify-between">
                <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider">Your Result</p>
                    <p className="text-white/60 text-xs mt-0.5">
                        {detail.heroHandDescription || 'No showdown'}
                    </p>
                </div>
                <span className={cn(
                    'text-lg font-bold',
                    isProfit && 'text-emerald-400',
                    isLoss && 'text-red-400',
                    !isProfit && !isLoss && 'text-white/40'
                )}>
                    {isProfit ? '+' : isLoss ? '-' : ''}${Math.abs(detail.heroNetProfit).toLocaleString()}
                </span>
            </div>

            {/* Watch Replay Button */}
            {detail.actionLog && detail.actionLog.length > 0 && (
                <button
                    onClick={() => setShowReplayer(true)}
                    className={cn(
                        'w-full rounded-xl p-3 flex items-center justify-center gap-2',
                        'bg-gradient-to-r from-amber-500/20 to-amber-600/20',
                        'border border-amber-500/30',
                        'hover:from-amber-500/30 hover:to-amber-600/30',
                        'transition-all duration-200 group'
                    )}
                >
                    <div className="w-7 h-7 rounded-full bg-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/40 transition-colors">
                        <FontAwesomeIcon icon={faPlay} className="text-amber-300 text-[10px] ml-0.5" />
                    </div>
                    <span className="text-amber-200 text-xs font-bold tracking-wide">Watch Replay</span>
                </button>
            )}

            {/* Visual Replayer Modal */}
            {detail.actionLog && (
                <VisualReplayerModal
                    isOpen={showReplayer}
                    onClose={() => setShowReplayer(false)}
                    actionLog={detail.actionLog}
                    communityCards={detail.communityCards}
                    winners={detail.winners}
                    heroSeat={detail.heroSeat}
                    heroCards={detail.heroCards}
                    pot={detail.pot}
                />
            )}

            {/* Action Log by Street */}
            {streetGroups.length > 0 ? (
                <div className="space-y-3">
                    {streetGroups.map((group, gi) => (
                        <div key={`street-${gi}`}>
                            {/* Street Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-white/50 text-xs font-semibold">
                                    {STREET_LABELS[group.street] || group.street}
                                </span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>

                            {/* Actions */}
                            <div className="space-y-1 pl-2">
                                {group.actions.map((action, ai) => {
                                    const style = ACTION_STYLES[action.action] || { color: 'text-white/50', label: action.action.toUpperCase() };
                                    return (
                                        <div
                                            key={`action-${gi}-${ai}`}
                                            className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {/* Seat indicator */}
                                                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/40 font-mono shrink-0">
                                                    {action.seat}
                                                </span>
                                                {/* Player name */}
                                                <span className="text-white/70 text-xs truncate max-w-[100px]">
                                                    {action.player}
                                                </span>
                                                {/* Action label */}
                                                <span className={cn('text-xs font-bold', style.color)}>
                                                    {style.label}
                                                </span>
                                                {/* Amount (if applicable) */}
                                                {action.amount > 0 && action.action !== 'fold' && action.action !== 'check' && (
                                                    <span className="text-white/40 text-xs">
                                                        ${action.amount.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Pot after action */}
                                            <span className="text-white/20 text-[10px] shrink-0">
                                                pot: ${action.pot.toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-white/30 text-sm">No action log available for this hand</p>
                    <p className="text-white/15 text-xs mt-1">Action logs are available for hands played after this update</p>
                </div>
            )}

            {/* Winners Section */}
            {detail.winners.length > 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">
                        <FontAwesomeIcon icon={faTrophy} className="text-amber-400/50 mr-1" />
                        Winners
                    </p>
                    <div className="space-y-1.5">
                        {detail.winners.map((w, i) => (
                            <div key={`winner-${i}`} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[9px] text-amber-400 font-mono">
                                        {w.seat}
                                    </span>
                                    <span className="text-white/70 text-xs font-medium truncate max-w-[130px]">
                                        {w.name || `Seat ${w.seat}`}
                                    </span>
                                    {w.handDescription && (
                                        <span className="text-white/30 text-[10px] truncate max-w-[100px]">
                                            {w.handDescription}
                                        </span>
                                    )}
                                </div>
                                <span className="text-emerald-400 text-xs font-bold">
                                    +${w.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
