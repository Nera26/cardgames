'use client';

/**
 * GameTableTabBar — Inline multi-table navigation on the game page
 *
 * 🟣 Purple Cable: Premium tab bar using the Midnight Gold design system
 *
 * Sits at the top of the game felt. Features:
 *   - Active table tab with hero hole card previews (gold border)
 *   - Other table tabs with variant + stakes labels
 *   - Gold pulse-glow on tabs requiring action
 *   - "+" button with emerald accent to add tables from lobby
 *   - Glass morphism backdrop matching the project's design language
 *
 * Only renders when user has 2+ tables open.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { TableSlice } from '@/contexts/SocketContext';

// ── Card suit rendering helpers ──
const SUIT_COLORS: Record<string, string> = {
    h: 'text-red-500',
    d: 'text-blue-400',
    c: 'text-emerald-400',
    s: 'text-white',
};
const SUIT_SYMBOLS: Record<string, string> = {
    h: '♥', d: '♦', c: '♣', s: '♠',
};

interface GameTableTabBarProps {
    tables: Record<string, TableSlice>;
    currentTableId: string;
    heroUserId?: string;
}

export function GameTableTabBar({ tables, currentTableId, heroUserId }: GameTableTabBarProps) {
    const router = useRouter();
    const tableIds = Object.keys(tables);

    if (tableIds.length < 2) return null;

    return (
        <div className="
            absolute top-0 left-0 right-0 z-[35]
            flex items-center justify-center
            pt-2.5 pb-1.5 px-4
            pointer-events-auto
        ">
            <div className="
                flex items-center gap-1.5
                px-2 py-1.5
                rounded-2xl
                border border-white/[0.08]
                shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,215,0,0.05)]
                overflow-x-auto scrollbar-hide overflow-y-visible
                max-w-[95vw]
            " style={{
                background: 'linear-gradient(180deg, rgba(21,26,35,0.92) 0%, rgba(11,14,20,0.96) 100%)',
                backdropFilter: 'blur(16px)',
            }}>
                {tableIds.map((tableId) => {
                    const slice = tables[tableId];
                    const isCurrent = tableId === currentTableId;
                    const isMyTurn = slice?.isMyTurn ?? false;
                    const state = slice?.tableState;

                    return (
                        <TabItem
                            key={tableId}
                            tableId={tableId}
                            isCurrent={isCurrent}
                            isMyTurn={isMyTurn}
                            state={state}
                            heroUserId={heroUserId}
                            onClick={() => {
                                if (!isCurrent) router.push(`/game/${tableId}`);
                            }}
                        />
                    );
                })}

                {/* Divider */}
                <div className="w-px h-7 bg-white/[0.06] mx-0.5 flex-shrink-0" />

                {/* + Button — Add Table */}
                <button
                    onClick={() => router.push('/lobby')}
                    className="
                        flex-shrink-0 w-10 h-10 rounded-xl
                        border border-dashed border-emerald-500/30
                        flex items-center justify-center
                        text-emerald-400/50
                        hover:text-emerald-400 hover:border-emerald-400/50
                        hover:bg-emerald-500/10
                        hover:shadow-[0_0_16px_rgba(16,185,129,0.15)]
                        transition-all duration-300
                        active:scale-90
                    "
                    title="Add another table"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ============================================================
// Tab Item — single premium table tab
// ============================================================

interface TabItemProps {
    tableId: string;
    isCurrent: boolean;
    isMyTurn: boolean;
    state: any;
    heroUserId?: string;
    onClick: () => void;
}

function TabItem({ tableId, isCurrent, isMyTurn, state, heroUserId, onClick }: TabItemProps) {
    const variant = state ? ((state.table as any)?.variant ?? 'NLHE') : 'NLHE';
    const displayVariant = variant === 'OMAHA' ? 'PLO4' : 'NLH';
    const stakes = state ? ((state.table as any)?.stakes ?? '') : '';
    const phase = state ? ((state.table as any)?.phase ?? 'waiting') : 'waiting';

    // Find hero's hole cards for ANY table the hero is dealt into
    const heroCards: string[] = [];
    if (heroUserId && state?.players) {
        const players = Array.isArray(state.players) ? state.players : [];
        const hero = players.find((p: any) => p.id === heroUserId);
        if (hero?.cards) {
            const cards = Array.isArray(hero.cards) ? hero.cards : [];
            cards.forEach((c: any) => {
                if (typeof c === 'string' && c !== '??' && c.length >= 2) {
                    heroCards.push(c);
                }
            });
        }
    }

    const showCards = heroCards.length > 0;

    return (
        <button
            onClick={onClick}
            className={`
                flex-shrink-0 relative flex items-center gap-2
                rounded-xl
                transition-all duration-300 ease-out
                ${isCurrent
                    ? 'px-3 py-1.5'
                    : 'px-3.5 py-2'
                }
                ${isCurrent
                    ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-gold-500/30 text-white shadow-[0_2px_12px_rgba(212,175,55,0.1)]'
                    : 'bg-white/[0.03] border border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.08]'
                }
                ${isMyTurn && !isCurrent
                    ? 'border-gold-400/60 animate-pulse-glow text-gold-400'
                    : ''
                }
            `}
            style={isMyTurn && !isCurrent ? {
                boxShadow: '0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.1)'
            } : undefined}
        >
            {/* Turn indicator — gold dot */}
            {isMyTurn && !isCurrent && (
                <span className="
                    absolute -top-1.5 -right-1.5
                    w-3 h-3 rounded-full
                    bg-gradient-to-br from-gold-400 to-gold-600
                    shadow-[0_0_8px_rgba(255,215,0,0.8)]
                    animate-pulse
                " />
            )}

            {/* Phase indicator dot */}
            <span className={`
                w-2 h-2 rounded-full flex-shrink-0
                ${phase === 'waiting'
                    ? 'bg-gold-500/40'
                    : 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]'
                }
            `} />

            {/* Hero Card Previews (current table only) */}
            {showCards && (
                <div className="flex gap-0.5">
                    {heroCards.map((card, i) => (
                        <MiniHoleCard key={i} card={card} />
                    ))}
                </div>
            )}

            {/* Spectator eye (no cards on this table) */}
            {!showCards && (
                <span className={`text-xs ${isCurrent ? 'text-white/30' : 'text-white/15'}`}>👁</span>
            )}

            {/* Table label */}
            <div className="flex flex-col items-start leading-none">
                <span className={`
                    text-sm font-bold tracking-wide
                    ${isCurrent ? 'text-white' : ''}
                `}>
                    {displayVariant}
                </span>
                {stakes && (
                    <span className={`
                        text-[10px] mt-0.5
                        ${isCurrent ? 'text-gold-500/70' : 'text-white/25'}
                    `}>
                        {stakes}
                    </span>
                )}
            </div>

            {/* Active indicator line */}
            {isCurrent && (
                <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-gold-500/0 via-gold-500/60 to-gold-500/0" />
            )}
        </button>
    );
}

// ============================================================
// MiniHoleCard — premium card face for the tab preview
// ============================================================

function MiniHoleCard({ card }: { card: string }) {
    const rank = card.slice(0, -1).toUpperCase();
    const suitKey = card.slice(-1).toLowerCase();
    const color = SUIT_COLORS[suitKey] ?? 'text-white/50';
    const symbol = SUIT_SYMBOLS[suitKey] ?? '?';

    return (
        <div className="
            w-8 h-11 rounded-[5px]
            bg-gradient-to-b from-white to-gray-100
            flex flex-col items-center justify-center
            shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.3)]
            border border-white/40
        ">
            <span className={`text-[13px] font-black leading-none ${color}`}>{rank}</span>
            <span className={`text-[11px] leading-none -mt-px ${color}`}>{symbol}</span>
        </div>
    );
}
