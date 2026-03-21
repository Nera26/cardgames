'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faClock, faFire, faLock, faPause, faKey, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { GameVariant } from '@poker/shared';
import { toast } from 'sonner';
import api from '@/lib/api';

interface PremiumTableCardProps {
    id: string;
    name: string;
    blinds: string;
    type: GameVariant;
    seated: number;
    maxSeats: number;
    avgPot: string;
    minBuyIn: number;
    maxBuyIn: number;
    handsPerHour?: number;
    holeCardsCount?: number;
    isPrivate?: boolean;
    status?: string;
}

function getOmahaBadge(holeCardsCount: number) {
    switch (holeCardsCount) {
        case 5:
            return { label: '5-CARD', bgClass: 'bg-purple-500/10', textClass: 'text-purple-400', borderClass: 'border-purple-500/20' };
        case 6:
            return { label: '6-CARD', bgClass: 'bg-red-500/10', textClass: 'text-red-400', borderClass: 'border-red-500/20' };
        default:
            return { label: 'CLASSIC', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', borderClass: 'border-blue-500/20' };
    }
}

export function PremiumTableCard({
    id,
    name,
    blinds,
    type,
    seated,
    maxSeats,
    avgPot,
    minBuyIn,
    maxBuyIn,
    handsPerHour = 0,
    holeCardsCount = 4,
    isPrivate = false,
    status = 'WAITING',
}: PremiumTableCardProps) {
    const router = useRouter();
    const isFull = seated >= maxSeats;
    const isHot = handsPerHour > 60;
    const isPaused = status === 'PAUSED';
    const isOmaha = type === 'OMAHA';
    const omahaBadge = isOmaha ? getOmahaBadge(holeCardsCount) : null;

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleJoin = () => {
        if (isPaused) return;
        if (isPrivate) {
            setShowPasswordModal(true);
            setPasswordInput('');
            setPasswordError('');
            return;
        }
        router.push(`/game/${id}`);
    };

    const handlePasswordSubmit = async () => {
        if (!passwordInput.trim()) {
            setPasswordError('Password is required');
            return;
        }
        setIsVerifying(true);
        setPasswordError('');
        try {
            // 🔒 Strict Handshake: Verify password with server BEFORE routing
            const res = await api.post(`/game/tables/${id}/verify-password`, {
                password: passwordInput.trim(),
            });
            if (res.data.valid) {
                // Password accepted — store for SocketContext join flow
                sessionStorage.setItem(`table_password_${id}`, passwordInput.trim());
                setShowPasswordModal(false);
                router.push(`/game/${id}`);
            } else {
                setPasswordError('Incorrect password');
                toast.error('Incorrect password. Access denied.');
            }
        } catch (err: any) {
            setPasswordError('Verification failed');
            toast.error(`Password check failed: ${err.message}`);
        } finally {
            setIsVerifying(false);
        }
    };

    // Card border style based on status
    const cardBorderClass = isPaused
        ? 'border-orange-500/30'
        : isPrivate
            ? 'border-amber-500/20 hover:border-amber-500/40'
            : 'border-white/5 hover:border-emerald-500/30';

    return (
        <>
            <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900/90 via-neutral-900/80 to-neutral-950/90 border ${cardBorderClass} transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] backdrop-blur-xl`}>

                {/* Top-right status indicator - only show ONE badge */}
                {isPaused ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/15 px-2 py-1 rounded-full border border-orange-500/30">
                        <FontAwesomeIcon icon={faPause} className="text-[9px]" />
                        PAUSED
                    </div>
                ) : isHot ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                        <FontAwesomeIcon icon={faFire} className="text-[9px]" />
                        HOT
                    </div>
                ) : null}

                <div className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-lg font-bold tracking-tight transition-colors flex items-center gap-2 ${isPaused ? 'text-neutral-500' : 'text-white group-hover:text-emerald-400'}`}>
                                <span className="truncate">{name}</span>
                                {isPrivate && (
                                    <FontAwesomeIcon
                                        icon={faLock}
                                        className="text-[10px] text-amber-400 flex-shrink-0"
                                        title="Private Table"
                                    />
                                )}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {/* Blinds Badge */}
                                <span className="text-xs font-medium text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {blinds}
                                </span>

                                {/* Game Type Badge */}
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${type === 'OMAHA'
                                    ? 'text-orange-400 bg-orange-950/50 border-orange-500/20'
                                    : type === 'ALL_IN_OR_FOLD'
                                        ? 'text-rose-400 bg-rose-950/50 border-rose-500/20'
                                        : 'text-neutral-400 bg-neutral-800/50 border-neutral-700/30'
                                    }`}>
                                    {type === 'TEXAS_HOLDEM' ? 'NLH' : type === 'OMAHA' ? 'PLO' : 'AoF'}
                                </span>

                                {/* Omaha Variant Badge */}
                                {isOmaha && omahaBadge && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${omahaBadge.bgClass} ${omahaBadge.textClass} ${omahaBadge.borderClass}`}>
                                        {omahaBadge.label}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 border border-white/10 flex-shrink-0 ml-3">
                            <FontAwesomeIcon icon={faClock} className="text-xs text-neutral-400" />
                        </div>
                    </div>

                    {/* Visual Seat Bar */}
                    <div className="space-y-2 mb-5">
                        <div className="flex justify-between text-xs text-neutral-400">
                            <span className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                                {seated}/{maxSeats} Seated
                            </span>
                            <span className="text-neutral-500">
                                ${minBuyIn} - ${maxBuyIn}
                            </span>
                        </div>
                        <div className="flex gap-1 h-2 w-full">
                            {Array.from({ length: maxSeats }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-all duration-300 ${i < seated
                                        ? isPaused
                                            ? 'bg-neutral-600'
                                            : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                        : 'bg-neutral-800'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                        <div className="text-xs text-neutral-500">
                            <span>Avg Pot: </span>
                            <span className={isPaused ? 'text-neutral-500' : 'text-emerald-400 font-medium'}>{avgPot}</span>
                        </div>
                        <button
                            onClick={handleJoin}
                            disabled={isPaused}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${isPaused
                                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                                    : isPrivate
                                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                                        : isFull
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                }`}
                        >
                            {isPaused ? (
                                <>
                                    <FontAwesomeIcon icon={faPause} className="text-xs" />
                                    Paused
                                </>
                            ) : isPrivate ? (
                                <>
                                    <FontAwesomeIcon icon={faLock} className="text-xs" />
                                    Enter Password
                                </>
                            ) : isFull ? (
                                'Join Waitlist'
                            ) : (
                                'Join Table'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Password Modal Overlay */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-amber-500/30 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.15)] w-full max-w-sm mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faKey} className="text-amber-400 text-sm" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Private Table</h3>
                                    <p className="text-[10px] text-amber-400/70 uppercase tracking-widest font-semibold">{name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-white/60 font-medium mb-2">Enter table password</label>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                    placeholder="••••••••"
                                    autoFocus
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                                />
                                {passwordError && (
                                    <p className="text-xs text-red-400 mt-1.5">{passwordError}</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordSubmit}
                                    disabled={isVerifying}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                                >
                                    {isVerifying ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faLock} className="text-xs" />
                                            Enter Room
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
