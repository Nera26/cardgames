'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faChartBar, faClock, faEye } from '@fortawesome/free-solid-svg-icons';
import { getAvatarUrl } from '@/config/avatars';

interface PlayerResult {
    username: string;
    avatarId?: string;
    chips: number;
    totalBuyIn: number;
    seatNumber: number;
    status: string;
}

interface WaitlistEntry {
    username: string;
    avatarId?: string;
    avatarUrl?: string | null;
}

interface RealTimeResultDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    tableName: string;
    variant?: string;
    smallBlind: number;
    bigBlind: number;
    players: PlayerResult[];
    waitlist?: WaitlistEntry[];
    observers?: WaitlistEntry[];
    /** Unix timestamp (seconds) when this session started */
    sessionStart?: number;
}

// Map index to a gradient color for the initials circle
const AVATAR_COLORS = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-violet-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
];

export const RealTimeResultDrawer: React.FC<RealTimeResultDrawerProps> = ({
    isOpen,
    onClose,
    tableName,
    variant = 'NLH',
    smallBlind,
    bigBlind,
    players,
    waitlist = [],
    observers = [],
    sessionStart,
}) => {
    // Session duration timer
    const [elapsed, setElapsed] = useState('00:00:00');

    useEffect(() => {
        if (!sessionStart) return;
        const tick = () => {
            const secs = Math.floor(Date.now() / 1000) - sessionStart;
            const h = Math.floor(secs / 3600).toString().padStart(2, '0');
            const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [sessionStart]);

    const formatChips = (amount: number): string => {
        if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
        if (Math.abs(amount) >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
        return amount.toLocaleString();
    };

    const activePlayers = players.filter(p => p.status !== 'sitting-out');

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    'fixed right-0 top-0 h-full w-80 sm:w-96 z-[80]',
                    'bg-gradient-to-b from-[#1a1d23] to-[#12141a]',
                    'border-l border-white/10',
                    'transform transition-transform duration-300 ease-in-out',
                    'shadow-2xl shadow-black/60',
                    'flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faChartBar} className="text-emerald-400" />
                            <h3 className="font-bold text-lg text-white">Real Time Result</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-amber-400 tabular-nums">{elapsed}</span>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                            >
                                <FontAwesomeIcon icon={faXmark} className="text-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Table Specs Grid */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Table Name</span>
                            <span className="text-white font-medium">{tableName}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-white/5 pt-1.5">
                            <span className="text-white/50">Table</span>
                            <span className="text-white font-medium">{variant}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-white/5 pt-1.5">
                            <span className="text-white/50">Blinds</span>
                            <span className="text-white font-medium">
                                {formatChips(smallBlind)}/{formatChips(bigBlind)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Player Results Table */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Column Headers */}
                    <div className="grid grid-cols-3 text-xs text-white/40 uppercase tracking-wider mb-3 px-1">
                        <span>Nickname</span>
                        <span className="text-center">Buy-in</span>
                        <span className="text-right">Winnings</span>
                    </div>

                    {/* Player Rows */}
                    <div className="space-y-1">
                        {activePlayers.map((player) => {
                            const winnings = player.chips - (player.totalBuyIn || player.chips);
                            const isPositive = winnings > 0;
                            const isNegative = winnings < 0;

                            return (
                                <div
                                    key={player.seatNumber}
                                    className="grid grid-cols-3 items-center py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <span className={cn(
                                        "text-sm font-medium truncate",
                                        isPositive ? "text-emerald-400" : "text-white/80"
                                    )}>
                                        {player.username}
                                    </span>
                                    <span className="text-sm text-amber-400/80 text-center font-mono tabular-nums">
                                        {formatChips(player.totalBuyIn || player.chips)}
                                    </span>
                                    <span className={cn(
                                        "text-sm font-bold text-right font-mono tabular-nums",
                                        isPositive && "text-emerald-400",
                                        isNegative && "text-red-400",
                                        !isPositive && !isNegative && "text-white/50"
                                    )}>
                                        {isPositive ? '+' : ''}{formatChips(winnings)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {activePlayers.length === 0 && (
                        <div className="text-center text-white/30 text-sm py-8">
                            No players at the table
                        </div>
                    )}
                </div>

                {/* Footer — Observers & Waitlist */}
                <div className="p-4 border-t border-white/10 space-y-4">
                    {/* Observers Section */}
                    {observers.length > 0 && (
                        <div>
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faEye} className="text-white/40 text-xs" />
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                                    Observer({observers.length})
                                </span>
                            </div>
                            <div className="flex gap-4 justify-center flex-wrap">
                                {observers.map((entry, index) => {
                                    return (
                                        <div key={`obs-${index}`} className="flex flex-col items-center gap-1.5 shrink-0">
                                            <img
                                                src={getAvatarUrl(entry.avatarId, entry.avatarUrl)}
                                                alt={entry.username}
                                                className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-600/60"
                                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(entry.avatarId); }}
                                            />
                                            <span className="text-[10px] text-white/50 max-w-[48px] truncate text-center">
                                                {entry.username}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Waitlist Section */}
                    {waitlist.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faClock} className="text-amber-400 text-xs" />
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Waitlist ({waitlist.length})
                                </span>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-1">
                                {waitlist.map((entry, index) => {
                                    return (
                                        <div key={`wl-${index}`} className="flex flex-col items-center gap-1.5 shrink-0">
                                            <div className="relative">
                                                <img
                                                    src={getAvatarUrl(entry.avatarId, entry.avatarUrl)}
                                                    alt={entry.username}
                                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-600/80"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(entry.avatarId); }}
                                                />
                                                <div className={cn(
                                                    "absolute -top-1 -left-1",
                                                    "w-5 h-5 rounded-full flex items-center justify-center",
                                                    "bg-[#1a1d23] text-amber-400 text-[10px] font-black",
                                                    "border-2 border-amber-500/70",
                                                    "shadow-lg shadow-black/40"
                                                )}>
                                                    {index + 1}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-white/50 max-w-[48px] truncate text-center">
                                                {entry.username}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {observers.length === 0 && waitlist.length === 0 && (
                        <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                            <FontAwesomeIcon icon={faEye} />
                            <span>No spectators</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
