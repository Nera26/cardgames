'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faHistory, faTrophy, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { HandReplayDetail } from './HandReplayDetail';

// ── Types ──
interface HandHistoryEntry {
    handId: string;
    endTime: string;
    communityCards: string[];
    pot: number;
    heroSeat: number | null;
    heroNetProfit: number;
    heroHandDescription: string | null;
    heroCards?: string[];
    winners: {
        seat: number;
        amount: number;
        handDescription: string | null;
        name?: string | null;
    }[];
}

interface HandHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    tableId: string;
}

// ── Card Mini Renderer ──
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
        <span
            className={cn(
                'inline-flex items-center justify-center',
                'w-6 h-8 rounded-[3px] text-[10px] font-bold leading-none',
                'bg-white/10 border border-white/10',
                suit.color
            )}
        >
            {rank}{suit.symbol}
        </span>
    );
};

// ── Relative Time Helper ──
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// ── Main Component ──
export const HandHistoryDrawer: React.FC<HandHistoryDrawerProps> = ({
    isOpen,
    onClose,
    tableId,
}) => {
    const [hands, setHands] = useState<HandHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedHandId, setSelectedHandId] = useState<string | null>(null);

    // Fetch hand history when drawer opens
    useEffect(() => {
        if (!isOpen || !tableId) return;

        const fetchHistory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await api.get(`/game/tables/${tableId}/history`);
                setHands(data || []);
            } catch (err: any) {
                console.error('Failed to fetch hand history:', err);
                setError('Failed to load hand history');
                setHands([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [isOpen, tableId]);

    // Reset detail view when drawer closes
    useEffect(() => {
        if (!isOpen) setSelectedHandId(null);
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={cn(
                    'fixed top-0 right-0 h-full z-[70]',
                    'w-[340px] max-w-[90vw]',
                    'bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]',
                    'border-l border-white/10',
                    'shadow-2xl',
                    'transition-transform duration-300 ease-out',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <FontAwesomeIcon icon={faHistory} className="text-amber-400 text-xs" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm tracking-wide">Hand History</h2>
                            <p className="text-white/40 text-[10px]">Last {hands.length} hands</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-white/60 text-sm" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100%-68px)]">
                    {/* Detail View */}
                    {selectedHandId ? (
                        <HandReplayDetail
                            tableId={tableId}
                            handId={selectedHandId}
                            onBack={() => setSelectedHandId(null)}
                        />
                    ) : (
                        <div className="px-4 py-3 space-y-2.5">
                            {isLoading && (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                                </div>
                            )}

                            {error && (
                                <div className="text-center py-16">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {!isLoading && !error && hands.length === 0 && (
                                <div className="text-center py-16">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faHistory} className="text-white/20 text-xl" />
                                    </div>
                                    <p className="text-white/40 text-sm font-medium">No hand history available</p>
                                    <p className="text-white/25 text-xs mt-1">Play some hands to see your history here</p>
                                </div>
                            )}

                            {!isLoading && !error && hands.map((hand) => {
                                const isProfit = hand.heroNetProfit > 0;
                                const isLoss = hand.heroNetProfit < 0;
                                const topWinner = hand.winners[0];

                                return (
                                    <div
                                        key={hand.handId}
                                        onClick={() => setSelectedHandId(hand.handId)}
                                        className={cn(
                                            'rounded-xl p-3.5 cursor-pointer',
                                            'bg-white/[0.03] border border-white/[0.06]',
                                            'hover:bg-white/[0.06] hover:border-white/10',
                                            'transition-all duration-200 group'
                                        )}
                                    >
                                        {/* Row 1: Hand ID + Time + Delta */}
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/30 text-[10px] font-mono">
                                                    #{hand.handId.slice(0, 8)}
                                                </span>
                                                <span className="text-white/20 text-[10px]">
                                                    {timeAgo(hand.endTime)}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-sm font-bold tracking-tight',
                                                    isProfit && 'text-emerald-400',
                                                    isLoss && 'text-red-400',
                                                    !isProfit && !isLoss && 'text-white/40'
                                                )}
                                            >
                                                {isProfit ? '+' : isLoss ? '-' : ''}${Math.abs(hand.heroNetProfit).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Row 2: Hero Cards + Board Cards */}
                                        <div className="flex items-center gap-1 mb-2">
                                            {/* Hero Hole Cards */}
                                            {hand.heroCards && hand.heroCards.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-0.5">
                                                        {hand.heroCards.map((card, i) => (
                                                            <span
                                                                key={`${hand.handId}-hc-${i}`}
                                                                className={cn(
                                                                    'inline-flex items-center justify-center',
                                                                    'w-6 h-8 rounded-[3px] text-[10px] font-bold leading-none',
                                                                    'bg-amber-500/20 border border-amber-500/30',
                                                                    SUIT_MAP[card.slice(-1).toLowerCase()]?.color || 'text-white'
                                                                )}
                                                            >
                                                                {card.slice(0, -1).toUpperCase()}{SUIT_MAP[card.slice(-1).toLowerCase()]?.symbol || '?'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {/* Separator */}
                                                    {hand.communityCards && hand.communityCards.length > 0 && (
                                                        <div className="w-px h-5 bg-white/15 mx-0.5" />
                                                    )}
                                                </>
                                            )}
                                            {/* Community Cards */}
                                            {hand.communityCards && hand.communityCards.length > 0 && (
                                                <div className="flex items-center gap-0.5">
                                                    {hand.communityCards.map((card, i) => (
                                                        <MiniCard key={`${hand.handId}-cc-${i}`} card={card} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Row 3: Pot + Winner */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/25 text-[10px]">
                                                Pot: ${hand.pot.toLocaleString()}
                                            </span>
                                            {topWinner && (
                                                <div className="flex items-center gap-1.5">
                                                    <FontAwesomeIcon icon={faTrophy} className="text-amber-400/60 text-[9px]" />
                                                    <span className="text-white/50 text-[10px] max-w-[150px] truncate">
                                                        {topWinner.handDescription || topWinner.name || `Seat ${topWinner.seat} won`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Row 4: Hero Hand Description */}
                                        {hand.heroHandDescription && (
                                            <div className="mt-1.5 pt-1.5 border-t border-white/[0.04]">
                                                <span className="text-amber-300/60 text-[10px] italic">
                                                    Your hand: {hand.heroHandDescription}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
