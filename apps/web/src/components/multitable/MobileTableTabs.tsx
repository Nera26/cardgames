'use client';

/**
 * MobileTableTabs — S-Tier mobile multi-table tab navigation
 *
 * 🟣 Purple Cable: Dynamic Hole Card Tab Bar
 *
 * Premium features matching tier-one casino apps:
 *   - Active tab shows hero's ACTUAL hole cards (mini card faces)
 *   - Waiting/spectating tabs show variant text + eye icon
 *   - Gold pulse-glow on tabs requiring action (Midnight Gold system)
 *   - Emerald "+" button pinned right to add more tables
 *   - Glass morphism backdrop with gold accent border
 *
 * Only the active table is rendered below (saves DOM / battery).
 * Clicking any tab navigates to /game/{tableId} for full experience.
 */

import React from 'react';
import { useSocket, TableSlice } from '@/contexts/SocketContext';
import { useGame } from '@/contexts/GameContext';
import { useRouter } from 'next/navigation';

// ── Card rendering helpers ──
const SUIT_COLORS: Record<string, string> = {
    h: '#ef4444', // Red
    d: '#60a5fa', // Blue
    c: '#34d399', // Emerald
    s: '#f3f4f6', // White
};
const SUIT_SYMBOLS: Record<string, string> = {
    h: '♥', d: '♦', c: '♣', s: '♠',
};

// ── Hero card extraction helper ──
function extractHeroCards(slice: TableSlice | undefined, heroUserId: string | undefined): string[] {
    if (!heroUserId || !slice?.tableState?.players) return [];
    const players = Array.isArray(slice.tableState.players) ? slice.tableState.players : [];
    const hero = players.find((p: any) => p.id === heroUserId);
    if (!hero?.cards) return [];
    const cards = Array.isArray(hero.cards) ? hero.cards : [];
    return cards.filter((c: any) => typeof c === 'string' && c !== '??' && c.length >= 2);
}

interface MobileTableTabsProps {
    tableIds: string[];
    activeTableId: string | null;
    setActiveTableId: (id: string) => void;
}

export function MobileTableTabs({ tableIds, activeTableId, setActiveTableId }: MobileTableTabsProps) {
    const { tables } = useSocket();
    const { user } = useGame();
    const router = useRouter();
    const heroUserId = user?.id;

    const handleTabClick = (tableId: string) => {
        setActiveTableId(tableId);
        router.push(`/game/${tableId}`);
    };

    return (
        <div className="flex md:hidden flex-col w-full h-full">
            {/* TAB BAR — Glass morphism with gold accent */}
            <div
                className="flex items-center gap-1.5 px-2.5 py-2 border-b border-white/[0.06] overflow-x-auto scrollbar-hide"
                style={{
                    background: 'linear-gradient(180deg, rgba(21,26,35,0.95) 0%, rgba(11,14,20,0.98) 100%)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                {tableIds.map((tableId) => {
                    const slice = tables[tableId];
                    const isActive = tableId === activeTableId;
                    const isMyTurn = slice?.isMyTurn ?? false;
                    const heroCards = extractHeroCards(slice, heroUserId);

                    return (
                        <TabButton
                            key={tableId}
                            tableId={tableId}
                            slice={slice}
                            isActive={isActive}
                            isMyTurn={isMyTurn}
                            heroCards={heroCards}
                            onClick={() => handleTabClick(tableId)}
                        />
                    );
                })}

                {/* Divider */}
                <div className="w-px h-8 bg-white/[0.06] mx-0.5 flex-shrink-0" />

                {/* + Button — Emerald accent */}
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
                    title="Join another table"
                >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* ACTIVE TABLE CONTENT */}
            <div className="flex-1 relative">
                {activeTableId ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-2xl animate-bounce">☝️</span>
                            <p className="font-medium">Tap a table tab to play</p>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                        <p>No tables joined</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// Tab Button — Dynamic hero card rendering
// ============================================================

interface TabButtonProps {
    tableId: string;
    slice: TableSlice | undefined;
    isActive: boolean;
    isMyTurn: boolean;
    heroCards: string[];
    onClick: () => void;
}

function TabButton({ tableId, slice, isActive, isMyTurn, heroCards, onClick }: TabButtonProps) {
    const state = slice?.tableState;
    const variant = state ? ((state.table as any)?.variant ?? 'NLH') : 'NLH';
    const displayVariant = variant === 'OMAHA' ? 'PLO4' : 'NLH';
    const phase = state ? ((state.table as any)?.phase ?? 'waiting') : 'waiting';

    const hasCards = heroCards.length > 0;

    return (
        <button
            onClick={onClick}
            className={`
                flex-shrink-0 relative flex items-center gap-2
                rounded-xl
                transition-all duration-300 ease-out
                ${hasCards && isActive ? 'px-2.5 py-1.5' : 'px-3.5 py-2'}
                ${isActive
                    ? 'bg-gradient-to-b from-white/[0.1] to-white/[0.04] border border-gold-500/30 text-white shadow-[0_2px_12px_rgba(212,175,55,0.12)]'
                    : 'bg-white/[0.03] border border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.08]'
                }
                ${isMyTurn && !isActive
                    ? 'border-gold-400/60 animate-pulse-glow text-gold-400'
                    : ''
                }
            `}
            style={isMyTurn && !isActive ? {
                boxShadow: '0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.1)'
            } : undefined}
        >
            {/* Turn indicator — gold dot */}
            {isMyTurn && !isActive && (
                <span className="
                    absolute -top-1.5 -right-1.5
                    w-3 h-3 rounded-full
                    bg-gradient-to-br from-gold-400 to-gold-600
                    shadow-[0_0_8px_rgba(255,215,0,0.8)]
                    animate-pulse
                " />
            )}

            {/* CONDITION A: Dealt In — Show actual hole cards */}
            {hasCards ? (
                <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                        {heroCards.map((card, i) => (
                            <MiniCard key={i} card={card} />
                        ))}
                    </div>
                    {/* Small variant badge next to cards */}
                    <span className={`
                        text-[10px] font-bold uppercase tracking-wider ml-0.5
                        ${isActive ? 'text-gold-500/60' : 'text-white/25'}
                    `}>
                        {displayVariant}
                    </span>
                </div>
            ) : (
                /* CONDITION B: Waiting/Spectating — Show variant + eye icon */
                <div className="flex items-center gap-1.5">
                    {/* Phase dot */}
                    <span className={`
                        w-2 h-2 rounded-full flex-shrink-0
                        ${phase === 'waiting'
                            ? 'bg-gold-500/40'
                            : 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]'
                        }
                    `} />
                    <span className={`
                        text-sm font-bold tracking-wide
                        ${isActive ? 'text-white' : ''}
                    `}>
                        {displayVariant}
                    </span>
                    {/* Eye icon for spectating/waiting */}
                    <span className={`text-[10px] ${isActive ? 'text-white/30' : 'text-white/15'}`}>👁</span>
                </div>
            )}

            {/* Active indicator line — gold gradient */}
            {isActive && (
                <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-gold-500/0 via-gold-500/60 to-gold-500/0" />
            )}
        </button>
    );
}

// ============================================================
// MiniCard — Lightweight CSS card face (no heavy deps)
// ============================================================

function MiniCard({ card }: { card: string }) {
    const rank = card.slice(0, -1).toUpperCase();
    const suitKey = card.slice(-1).toLowerCase();
    const color = SUIT_COLORS[suitKey] ?? '#9ca3af';
    const symbol = SUIT_SYMBOLS[suitKey] ?? '?';

    return (
        <div
            className="
                w-6 h-9 rounded-[4px]
                flex flex-col items-center justify-center
                shadow-[0_2px_6px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.15)]
            "
            style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%)',
            }}
        >
            <span className="text-[10px] font-black leading-none" style={{ color }}>{rank}</span>
            <span className="text-[8px] leading-none -mt-px" style={{ color }}>{symbol}</span>
        </div>
    );
}
