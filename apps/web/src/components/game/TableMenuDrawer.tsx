'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faXmark,
    faVolumeHigh,
    faVolumeMute,
    faChartBar,
    faClockRotateLeft,
    faComments,
    faPalette,
    faCog,
    faPersonWalkingArrowRight,
    faMugHot,
    faCoins,
    faArrowsRotate,
    faForwardStep,
    faDoorOpen,
    faChevronLeft,
    faPlus,
    faTableCells,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { useUI, TableSkin } from '@/contexts/UIContext';
import { useSocket } from '@/contexts/SocketContext';
import { useParams, useRouter } from 'next/navigation';

// ============================================
// PROPS
// ============================================
interface TableMenuDrawerProps {
    // Sound
    isSoundOn: boolean;
    onToggleSound: () => void;
    // Chat
    isChatOpen: boolean;
    onToggleChat: () => void;
    unreadChatCount?: number;
    // Stats
    onToggleStats?: () => void;
    isStatsOpen?: boolean;
    // Hand History
    onToggleHistory?: () => void;
    isHistoryOpen?: boolean;
    // Player actions
    onStandUp: () => void;
    onSitOut: () => void;
    onLeave: () => void;
    // Chip management
    onRebuy?: () => void;
    onTopUp?: () => void;
    // Leave Next BB (server-driven)
    isLeaveNextBB?: boolean;
    onToggleLNBB?: (value: boolean) => void;
    // Auto Rebuy (server-driven)
    isAutoRebuy?: boolean;
    onToggleAutoRebuy?: (value: boolean) => void;
}

// ============================================
// TOGGLE SWITCH
// ============================================
const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={cn(
            'relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
            checked ? 'bg-emerald-500' : 'bg-white/15'
        )}
    >
        <span
            className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                checked && 'translate-x-5'
            )}
        />
    </button>
);

// ============================================
// COMPONENT
// ============================================
export const TableMenuDrawer: React.FC<TableMenuDrawerProps> = ({
    isSoundOn,
    onToggleSound,
    isChatOpen,
    onToggleChat,
    unreadChatCount = 0,
    onToggleStats,
    isStatsOpen = false,
    onToggleHistory,
    isHistoryOpen = false,
    onStandUp,
    onSitOut,
    onLeave,
    onRebuy,
    onTopUp,
    isLeaveNextBB = false,
    onToggleLNBB,
    isAutoRebuy = false,
    onToggleAutoRebuy,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const {
        tableSkin, setTableSkin,
        useFourColorDeck, setUseFourColorDeck,
        displayInBB, setDisplayInBB,
        autoMuck, setAutoMuck,
    } = useUI();
    const { setAutoMuck: setAutoMuckServer, tables } = useSocket();
    const params = useParams();
    const tableId = params?.tableId as string | undefined;
    const router = useRouter();
    const activeTableCount = Object.keys(tables).length;

    // ── Auto-open on desktop, closed on mobile ──
    useEffect(() => {
        const isDesktop = window.innerWidth >= 768;
        setIsOpen(isDesktop);
    }, []);

    const cycleSkin = () => {
        const skins: TableSkin[] = ['green', 'blue', 'red', 'midnight'];
        const currentIndex = skins.indexOf(tableSkin);
        const nextIndex = (currentIndex + 1) % skins.length;
        setTableSkin(skins[nextIndex]);
    };

    const skinColorClass = {
        green: 'text-emerald-400',
        blue: 'text-blue-400',
        red: 'text-red-400',
        midnight: 'text-slate-400',
    }[tableSkin];

    /** Fire callback & close drawer (mobile only) */
    const act = (fn: (() => void) | undefined) => {
        fn?.();
        // On mobile, close after action. On desktop, keep open.
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* ═══ GHOST SPACER (Desktop only) ═══
                Invisible div that occupies space in the flex row.
                Pushes the game area to the right on md+ screens.
                On mobile it's hidden — zero layout impact. */}
            <div
                className={cn(
                    'hidden md:block shrink-0 h-full',
                    'transition-[width] duration-300 ease-in-out'
                )}
                style={{ width: isOpen ? '16rem' : '0' }}
            />

            {/* ═══ HAMBURGER TRIGGER (only when drawer is closed) ═══ */}
            {!isOpen && (
                <button
                    id="table-menu-trigger"
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        'fixed top-4 left-4 z-[40]',
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        'bg-black/40 backdrop-blur-xl border border-white/10',
                        'text-white/80 hover:text-white hover:bg-black/60 hover:border-white/20',
                        'transition-all duration-200 active:scale-90 shadow-lg',
                    )}
                >
                    <FontAwesomeIcon icon={faBars} className="text-sm" />
                </button>
            )}

            {/* ═══ BACKDROP (Mobile only — no darkening on desktop) ═══ */}
            <div
                className={cn(
                    'md:hidden fixed inset-0 bg-black/50 z-[50] transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* ═══ DRAWER PANEL ═══ */}
            <div
                className={cn(
                    'fixed top-0 left-0 h-full w-64 z-[60]',
                    'bg-[#1e212b] shadow-2xl',
                    'transform transition-transform duration-300 ease-in-out',
                    'flex flex-col',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* ── Header (pinned) ── */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
                    <h3 className="text-white font-bold text-base tracking-wide">Menu</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        {/* Desktop: chevron left to collapse; Mobile: X to close */}
                        <FontAwesomeIcon
                            icon={typeof window !== 'undefined' && window.innerWidth >= 768 ? faChevronLeft : faXmark}
                            className="text-lg"
                        />
                    </button>
                </div>

                {/* ── Scrollable Menu Body ── */}
                <div className="flex-1 overflow-y-auto">

                    {/* ── GROUP: Controls ── */}
                    <div className="py-2 border-b border-white/10">
                        <p className="px-4 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Controls</p>

                        {/* Sound Toggle */}
                        <button
                            onClick={() => { onToggleSound(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <FontAwesomeIcon
                                icon={isSoundOn ? faVolumeHigh : faVolumeMute}
                                className={cn('w-4 text-center', isSoundOn ? 'text-emerald-400' : 'text-white/40')}
                            />
                            <span>Sound {isSoundOn ? 'On' : 'Off'}</span>
                        </button>

                        {/* Real Time Result */}
                        {onToggleStats && (
                            <button
                                onClick={() => act(onToggleStats)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                            >
                                <FontAwesomeIcon
                                    icon={faChartBar}
                                    className={cn('w-4 text-center', isStatsOpen ? 'text-emerald-400' : 'text-white/40')}
                                />
                                <span>Real Time Result</span>
                            </button>
                        )}

                        {/* Hand History */}
                        {onToggleHistory && (
                            <button
                                onClick={() => act(onToggleHistory)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                            >
                                <FontAwesomeIcon
                                    icon={faClockRotateLeft}
                                    className={cn('w-4 text-center', isHistoryOpen ? 'text-amber-400' : 'text-white/40')}
                                />
                                <span>Hand History</span>
                            </button>
                        )}
                    </div>

                    {/* ── GROUP: Multi-Table ── */}
                    <div className="py-2 border-b border-white/10">
                        <p className="px-4 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Multi-Table</p>

                        {/* Add Table */}
                        <button
                            onClick={() => { setIsOpen(false); router.push('/lobby'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPlus} className="w-4 text-center text-emerald-400" />
                            <span>Add Table</span>
                        </button>

                        {/* Multi-Table View */}
                        {activeTableCount > 1 && (
                            <button
                                onClick={() => { setIsOpen(false); router.push('/play'); }}
                                className="hidden md:flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTableCells} className="w-4 text-center text-blue-400" />
                                <span>Multi-Table View</span>
                                <span className="ml-auto text-xs text-white/30">{activeTableCount} tables</span>
                            </button>
                        )}
                    </div>

                    {/* ── GROUP: Table ── */}
                    <div className="py-2 border-b border-white/10">
                        <p className="px-4 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Table</p>

                        {/* Table Skin */}
                        <button
                            onClick={cycleSkin}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPalette} className={cn('w-4 text-center transition-colors', skinColorClass)} />
                            <span>Table Felt</span>
                            <span className="ml-auto text-xs text-white/30 capitalize">{tableSkin}</span>
                        </button>

                        {/* Table Settings */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faCog} className={cn('w-4 text-center transition-colors', showSettings ? 'text-amber-400' : 'text-white/40')} />
                            <span>Table Settings</span>
                            <FontAwesomeIcon
                                icon={faChevronLeft}
                                className={cn('ml-auto w-3 text-white/30 transition-transform duration-200', showSettings && '-rotate-90')}
                            />
                        </button>

                        {/* Settings Accordion */}
                        <div className={cn(
                            'overflow-hidden transition-all duration-300 ease-in-out',
                            showSettings ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                        )}>
                            <div className="px-3 pb-2 space-y-1">
                                {/* 4-Color Deck */}
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">🃏</span>
                                        <div>
                                            <p className="text-xs text-white/80 font-medium">4-Color Deck</p>
                                            <p className="text-[10px] text-white/30">♣ green · ♦ blue</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={useFourColorDeck} onChange={() => setUseFourColorDeck(!useFourColorDeck)} />
                                </div>

                                {/* Display in BB */}
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">📊</span>
                                        <div>
                                            <p className="text-xs text-white/80 font-medium">Display in BB</p>
                                            <p className="text-[10px] text-white/30">Stacks as big blinds</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={displayInBB} onChange={() => setDisplayInBB(!displayInBB)} />
                                </div>

                                {/* Auto-Muck */}
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">🎭</span>
                                        <div>
                                            <p className="text-xs text-white/80 font-medium">Auto-Muck</p>
                                            <p className="text-[10px] text-white/30">Hide losing hands</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={autoMuck} onChange={() => {
                                        const newValue = !autoMuck;
                                        setAutoMuck(newValue); // 🟣 Purple Cable: localStorage
                                        if (tableId) {
                                            setAutoMuckServer(tableId, newValue).catch(() => {}); // 🔴 Red Cable: WebSocket
                                        }
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="py-2 border-b border-white/10">
                        <p className="px-4 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Player</p>

                        {/* Stand Up (Give Up Seat → Spectator) */}
                        <button
                            onClick={() => act(onStandUp)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPersonWalkingArrowRight} className="w-4 text-center text-white/40" />
                            <span>Stand Up</span>
                        </button>

                        {/* Take a Break (Sit Out — Depleting Time Bank) */}
                        <button
                            onClick={() => onSitOut()}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faMugHot} className="w-4 text-center text-amber-400/70" />
                            <span>Take a Break</span>
                        </button>
                    </div>

                    {/* ── GROUP: Chip Management ── */}
                    <div className="py-2 border-b border-white/10">
                        <p className="px-4 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Chips</p>

                        {/* Top Up */}
                        <button
                            onClick={() => act(onTopUp || onRebuy)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faCoins} className="w-4 text-center text-amber-400/70" />
                            <span>Top Up</span>
                        </button>

                        {/* Auto Rebuy */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onToggleAutoRebuy?.(!isAutoRebuy)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleAutoRebuy?.(!isAutoRebuy); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <FontAwesomeIcon
                                icon={faArrowsRotate}
                                className={cn('w-4 text-center', isAutoRebuy ? 'text-emerald-400' : 'text-white/40')}
                            />
                            <span className="flex-1 text-left">Auto Rebuy</span>
                            <ToggleSwitch checked={isAutoRebuy} onChange={() => onToggleAutoRebuy?.(!isAutoRebuy)} />
                        </div>
                    </div>

                    {/* ── GROUP: Special (Leave Next BB toggle) ── */}
                    <div className="py-2 border-b border-white/10">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onToggleLNBB?.(!isLeaveNextBB)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleLNBB?.(!isLeaveNextBB); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <FontAwesomeIcon
                                icon={faForwardStep}
                                className={cn('w-4 text-center', isLeaveNextBB ? 'text-amber-400' : 'text-white/40')}
                            />
                            <span className="flex-1 text-left">Leave Next BB</span>
                            <ToggleSwitch checked={isLeaveNextBB} onChange={() => onToggleLNBB?.(!isLeaveNextBB)} />
                        </div>
                    </div>

                </div>

                {/* ── EXIT (pinned to bottom) ── */}
                <div className="p-4 shrink-0">
                    <button
                        onClick={() => act(onLeave)}
                        className={cn(
                            'w-full flex items-center justify-center gap-2',
                            'px-4 py-3 rounded-xl text-sm font-bold',
                            'bg-red-500/15 border border-red-500/30 text-red-400',
                            'hover:bg-red-500/25 hover:text-red-300',
                            'transition-all duration-200 active:scale-95',
                        )}
                    >
                        <FontAwesomeIcon icon={faDoorOpen} />
                        <span>Exit Table</span>
                    </button>
                </div>
            </div>
        </>
    );
};
