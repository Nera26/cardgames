'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BETTING_PRESETS } from '@/data/game-config';
import { GameActionButton } from './GameActionButton';
import { useSound } from '@/contexts/SoundContext';
import { useUI, TableSkin } from '@/contexts/UIContext';

// ═══════════════════════════════════════════════════════
// 🟣 Purple Cable: Action theme colors per table skin
// ═══════════════════════════════════════════════════════
const ACTION_THEME: Record<TableSkin, {
    presetActive: string;
    sliderText: string;
    sliderThumbBg: string;
    sliderThumbShadow: string;
    trackGradient: string;
    imBackGradient: string;
    imBackShadow: string;
    sitOutBorder: string;
}> = {
    green: {
        presetActive: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
        sliderText: 'text-emerald-400',
        sliderThumbBg: 'bg-emerald-400',
        sliderThumbShadow: '0 0 10px rgba(52,211,153,0.5)',
        trackGradient: 'from-emerald-500/50 to-emerald-400/30',
        imBackGradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
        imBackShadow: '0 0 16px rgba(34, 197, 94, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
        sitOutBorder: 'border-emerald-500/30',
    },
    blue: {
        presetActive: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
        sliderText: 'text-blue-400',
        sliderThumbBg: 'bg-blue-400',
        sliderThumbShadow: '0 0 10px rgba(59,130,246,0.5)',
        trackGradient: 'from-blue-500/50 to-blue-400/30',
        imBackGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        imBackShadow: '0 0 16px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
        sitOutBorder: 'border-blue-500/30',
    },
    red: {
        presetActive: 'bg-rose-500/20 border-rose-500/50 text-rose-400',
        sliderText: 'text-rose-400',
        sliderThumbBg: 'bg-rose-400',
        sliderThumbShadow: '0 0 10px rgba(244,63,94,0.5)',
        trackGradient: 'from-rose-500/50 to-rose-400/30',
        imBackGradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
        imBackShadow: '0 0 16px rgba(244, 63, 94, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
        sitOutBorder: 'border-rose-500/30',
    },
    midnight: {
        presetActive: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
        sliderText: 'text-amber-400',
        sliderThumbBg: 'bg-amber-400',
        sliderThumbShadow: '0 0 10px rgba(245,158,11,0.5)',
        trackGradient: 'from-amber-500/50 to-amber-400/30',
        imBackGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        imBackShadow: '0 0 16px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
        sitOutBorder: 'border-amber-500/30',
    },
};

interface GameControlsProps {
    playerBalance: number;
    minRaise: number;
    currentCallAmount: number;
    isPlayerTurn: boolean;
    onFold: () => void;
    onCheck: () => void;
    onCall: (amount: number) => void;
    onRaise: (amount: number) => void;
    onAllIn?: () => void;
    onAction?: (action: string) => void;
    onSitOut?: () => void;
    isSittingOut?: boolean;
    sitOutStart?: number; // Unix timestamp (seconds) for AFK countdown
    /** Big blind value for rounding raises to professional increments */
    bigBlind?: number;
    /** Total pot size from live game state — used for pot-relative preset buttons */
    totalPot?: number;
    className?: string;
    // Multi-Variant Support
    variant?: 'TEXAS_HOLDEM' | 'OMAHA' | 'ALL_IN_OR_FOLD';
    // 🟣 Defensive UX: prevents double-tap during Red Cable round-trip
    isActionPending?: boolean;
    /** 🟣 Grid Mode: when true, uses contained positioning instead of viewport-fixed */
    inline?: boolean;
}

const AFK_TIMEOUT_S = 10 * 60; // 10 minutes — matches player-reaper.service.ts

// 🟣 Purple Cable: Action → Sound mapping
const ACTION_SOUNDS: Record<string, ('card_fold' | 'check' | 'bet' | 'chip_slide' | 'all_in')[]> = {
    fold: ['card_fold'],
    check: ['check'],
    call: ['bet', 'chip_slide'],
    raise: ['bet'],
    'all-in': ['all_in'],
};

export const GameControls: React.FC<GameControlsProps> = ({
    playerBalance,
    minRaise,
    currentCallAmount,
    isPlayerTurn,
    onFold,
    onCheck,
    onCall,
    onRaise,
    onAllIn,
    onAction,
    onSitOut,
    isSittingOut = false,
    sitOutStart,
    bigBlind,
    totalPot = 0,
    className,
    variant = 'TEXAS_HOLDEM',
    isActionPending = false,
    inline = false,
}) => {
    // 🟣 Grid Mode: positioned inline (contained) vs fixed (viewport)
    const positionClasses = inline
        ? 'relative mx-auto w-[92%] max-w-[500px]'
        : 'fixed bottom-6 left-1/2 -translate-x-1/2';
    const positionClassesCompact = inline
        ? 'relative mx-auto w-[92%] max-w-[500px]'
        : 'fixed left-1/2 -translate-x-1/2';
    // Sanitize numeric props to prevent NaN in DOM attributes
    playerBalance = Number(playerBalance) || 0;
    minRaise = Number(minRaise) || 0;
    currentCallAmount = Number(currentCallAmount) || 0;

    const [raiseAmount, setRaiseAmount] = useState(minRaise);
    const isAoF = variant === 'ALL_IN_OR_FOLD';
    const { playSound } = useSound();
    const { tableSkin } = useUI();
    const theme = ACTION_THEME[tableSkin];

    // 🟣 Purple Cable: Pre-action toggles (mutually exclusive)
    const [checkFoldToggle, setCheckFoldToggle] = useState(false);
    const [callCurrentToggle, setCallCurrentToggle] = useState(false);
    const [callAnyToggle, setCallAnyToggle] = useState(false);
    const prevIsPlayerTurn = useRef(false);

    // Mutual exclusivity helpers
    const activateCheckFold = (on: boolean) => {
        setCheckFoldToggle(on);
        if (on) { setCallCurrentToggle(false); setCallAnyToggle(false); }
    };
    const activateCallCurrent = (on: boolean) => {
        setCallCurrentToggle(on);
        if (on) { setCheckFoldToggle(false); setCallAnyToggle(false); }
    };
    const activateCallAny = (on: boolean) => {
        setCallAnyToggle(on);
        if (on) { setCheckFoldToggle(false); setCallCurrentToggle(false); }
    };

    // Auto-fire pre-action when isPlayerTurn transitions false → true
    useEffect(() => {
        const wasTurn = prevIsPlayerTurn.current;
        prevIsPlayerTurn.current = isPlayerTurn;

        // Only fire on rising edge (false → true)
        if (!wasTurn && isPlayerTurn) {
            if (checkFoldToggle) {
                setCheckFoldToggle(false);
                const canCheck = currentCallAmount === 0;
                if (canCheck) {
                    triggerAction('check', onCheck);
                } else {
                    triggerAction('fold', onFold);
                }
                return;
            }
            if (callCurrentToggle) {
                setCallCurrentToggle(false);
                const canCheck = currentCallAmount === 0;
                if (canCheck) {
                    triggerAction('check', onCheck);
                } else {
                    triggerAction('call', () => onCall(currentCallAmount));
                }
                return;
            }
            if (callAnyToggle) {
                setCallAnyToggle(false);
                const canCheck = currentCallAmount === 0;
                if (canCheck) {
                    triggerAction('check', onCheck);
                } else {
                    triggerAction('call', () => onCall(currentCallAmount));
                }
                return;
            }
        }

        // Reset toggles when it's no longer our turn (hand ended, etc.)
        if (wasTurn && !isPlayerTurn) {
            // Don't reset — user may have set them for the NEXT hand
        }
    }, [isPlayerTurn]); // Intentionally minimal deps — triggerAction/onCheck/onFold are stable

    // AFK countdown timer
    const [afkRemaining, setAfkRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!isSittingOut || !sitOutStart) {
            setAfkRemaining(null);
            return;
        }
        const tick = () => {
            const elapsed = Math.floor(Date.now() / 1000) - sitOutStart;
            setAfkRemaining(Math.max(0, AFK_TIMEOUT_S - elapsed));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isSittingOut, sitOutStart]);


    useEffect(() => {
        setRaiseAmount(minRaise);
    }, [minRaise]);

    // Compute professional raise step: snap to big blind increments
    const raiseStep = bigBlind && bigBlind > 0 ? bigBlind : Math.max(1, Math.pow(10, Math.floor(Math.log10(Math.max(1, minRaise)))));

    // Round a value to the nearest step multiple
    const roundToStep = (val: number) => Math.round(val / raiseStep) * raiseStep;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = Number(e.target.value);
        // If within one step of max, snap to exact playerBalance (all-in)
        if (raw >= playerBalance - raiseStep) {
            setRaiseAmount(playerBalance);
            return;
        }
        const rounded = roundToStep(raw);
        setRaiseAmount(Math.max(minRaise, rounded));
    };

    const triggerAction = (action: string, callback: () => void) => {
        // 🟣 Purple Cable: Fire mapped sound effects
        const sounds = ACTION_SOUNDS[action];
        if (sounds) {
            sounds.forEach(s => playSound(s));
        }
        onAction?.(action);
        callback();
    };

    const canCheck = currentCallAmount === 0;
    const canCall = currentCallAmount > 0;
    // canRaise: player has ANY chips left after a call → must show a 3rd button (raise or all-in)
    const canRaise = playerBalance > currentCallAmount;
    // canSliderRaise: player can meet the legal minimum raise → show slider + presets
    const canSliderRaise = canRaise && playerBalance > minRaise && minRaise > 0;
    const isAllIn = raiseAmount >= playerBalance;
    // Short-shove: player can raise but only by going all-in (below min raise)
    const isShortShove = canRaise && !canSliderRaise;



    // ... inside component ...
    // NLH Pot-Sized Raise formula:
    // potSizedBet = totalPot + (amountToCall * 2)
    // This is the standard "pot bet" in No-Limit Hold'em.
    const potSizedBet = totalPot + (currentCallAmount * 2);

    // Preset amounts — Vegas-grade math
    const presets = BETTING_PRESETS.map(preset => {
        let amount = 0;
        if (preset.value === 'min') amount = minRaise;
        else if (preset.value === 'pot') amount = Math.min(potSizedBet, playerBalance);
        else if (preset.value === 'all-in') amount = playerBalance;
        else if (typeof preset.value === 'number') {
            // Fractional pot bets (e.g., 0.5 = half-pot)
            amount = Math.floor(potSizedBet * preset.value);
        }

        // Clamp: never below minRaise, never above playerBalance
        amount = Math.max(minRaise, Math.min(amount, playerBalance));

        return { label: preset.label, amount };
    });

    // Player is sitting out - show prominent "I'm Back" bar with countdown
    if (isSittingOut) {
        const afkMinutes = afkRemaining != null ? Math.floor(afkRemaining / 60) : null;
        const afkSeconds = afkRemaining != null ? afkRemaining % 60 : null;
        const isUrgent = afkRemaining != null && afkRemaining <= 120;

        return (
            <div className={cn(
                positionClasses,
                !inline && "w-[90%] max-w-[500px]",
                "bg-black/60 backdrop-blur-xl border",
                theme.sitOutBorder,
                "rounded-2xl shadow-2xl shadow-black/50",
                "p-4 flex flex-col items-center gap-3",
                className
            )}>
                <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="text-base">☕</span>
                    <span className="text-amber-400/80">You are sitting out</span>
                    {afkMinutes != null && afkSeconds != null && (
                        <>
                            <span className="text-white/20">·</span>
                            <span className={cn(
                                "font-mono font-bold tabular-nums",
                                isUrgent ? "text-red-400" : "text-white/40"
                            )}>
                                {afkMinutes}:{afkSeconds.toString().padStart(2, '0')}
                            </span>
                        </>
                    )}
                </div>
                <button
                    onClick={onSitOut}
                    className={cn(
                        "w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95",
                        tableSkin === 'midnight' ? 'text-black' : 'text-white'
                    )}
                    style={{
                        background: theme.imBackGradient,
                        boxShadow: theme.imBackShadow,
                    }}
                >
                    ▶ I'm Back
                </button>
            </div>
        );
    }

    // Not player's turn - show pre-action queue (Sit Out available via SidebarDrawer)
    if (!isPlayerTurn) {
        // 🟣 Grid Mode: pre-action toggles are hidden in inline mode
        // (grinders only need the bar when it's their turn)
        if (inline) return null;

        const callAmountFormatted = currentCallAmount >= 10000
            ? `${(currentCallAmount / 1000).toFixed(currentCallAmount % 1000 === 0 ? 0 : 1)}K`
            : currentCallAmount.toLocaleString();
        const callLabel = currentCallAmount > 0 ? `Call $${callAmountFormatted}` : 'Check';

        return (
            <div className={cn(
                positionClasses,
                !inline && "w-[90%] max-w-[500px]",
                "bg-black/60 backdrop-blur-xl border border-white/10",
                "rounded-2xl shadow-2xl shadow-black/50",
                "p-3 sm:p-4",
                className
            )}>
                {/* Pre-action toggles — 3-column professional layout */}
                <div className="grid grid-cols-3 gap-2">
                    {/* F/C (Fold/Check) */}
                    <button
                        onClick={() => activateCheckFold(!checkFoldToggle)}
                        className={cn(
                            "flex items-center justify-center gap-1.5 text-sm font-semibold cursor-pointer transition-all py-2.5 rounded-xl border",
                            checkFoldToggle
                                ? "text-amber-300 bg-amber-500/15 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                : "text-white/50 hover:text-white/70 bg-white/5 hover:bg-white/10 border-white/10"
                        )}
                    >
                        {checkFoldToggle && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                        F/C
                    </button>

                    {/* Call [Amount] — dynamic from Red Cable state */}
                    <button
                        onClick={() => activateCallCurrent(!callCurrentToggle)}
                        className={cn(
                            "flex items-center justify-center gap-1.5 text-sm font-semibold cursor-pointer transition-all py-2.5 rounded-xl border",
                            callCurrentToggle
                                ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                                : "text-white/50 hover:text-white/70 bg-white/5 hover:bg-white/10 border-white/10"
                        )}
                    >
                        {callCurrentToggle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {callLabel}
                    </button>

                    {/* Call Any */}
                    <button
                        onClick={() => activateCallAny(!callAnyToggle)}
                        className={cn(
                            "flex items-center justify-center gap-1.5 text-sm font-semibold cursor-pointer transition-all py-2.5 rounded-xl border",
                            callAnyToggle
                                ? "text-blue-300 bg-blue-500/15 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                : "text-white/50 hover:text-white/70 bg-white/5 hover:bg-white/10 border-white/10"
                        )}
                    >
                        {callAnyToggle && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                        Call Any
                    </button>
                </div>
            </div>
        );
    }

    // ============================================
    // AoF Mode: Only Fold / All-In
    // ============================================
    if (isAoF) {
        return (
            <div className={cn(
                positionClassesCompact,
                !inline && "bottom-3 w-[95%] max-w-[380px] p-3 gap-3",
                !inline && "sm:bottom-6 sm:w-[92%] sm:max-w-[550px] sm:p-4 sm:gap-4",
                inline && "p-3 gap-2 mb-2",
                "bg-black/70 backdrop-blur-xl border border-amber-500/30",
                "rounded-xl sm:rounded-2xl shadow-2xl shadow-black/50",
                "flex flex-col items-center",
                className
            )}>
                {/* AoF Warning Banner */}
                <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wide">
                    <span className="text-lg">⚡</span>
                    All-In or Fold Only
                    <span className="text-lg">⚡</span>
                </div>

                {/* Two Buttons Only */}
                <div className="flex gap-3 w-full">
                    <GameActionButton
                        variant="fold"
                        onClick={() => triggerAction('fold', onFold)}
                        disabled={isActionPending}
                        className="flex-1 h-12 sm:h-14"
                    >
                        Fold
                    </GameActionButton>
                    <GameActionButton
                        variant="all-in"
                        onClick={() => triggerAction('all-in', () => onAllIn?.())}
                        disabled={isActionPending}
                        className="flex-1 h-12 sm:h-14"
                    >
                        All-In ${playerBalance.toLocaleString()}
                    </GameActionButton>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            // Floating Glass Capsule (or inline when in grid mode)
            positionClassesCompact,
            // Mobile: smaller, closer to bottom (skip in inline mode)
            !inline && "bottom-3 w-[95%] max-w-[380px] p-2.5 gap-2",
            // Desktop: larger, more padding
            !inline && "sm:bottom-6 sm:w-[92%] sm:max-w-[550px] sm:p-4 sm:gap-3",
            inline && "p-3 gap-2 mb-2",
            "bg-black/70 backdrop-blur-xl border border-white/10",
            "rounded-2xl",
            "shadow-2xl shadow-black/50",
            "flex flex-col",
            className
        )}>
            {/* Row 1: Quick-bet Presets (Pill Chips) - Hidden in grid mode for compact layout */}
            {canSliderRaise && !inline && (
                <div className="flex justify-center gap-1.5 sm:gap-2">
                    {presets.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => setRaiseAmount(preset.amount)}
                            className={cn(
                                "px-2.5 py-1 text-[10px] sm:px-4 sm:py-1.5 sm:text-xs font-bold uppercase tracking-wide rounded-full transition-all duration-500",
                                "border",
                                raiseAmount === preset.amount
                                    ? theme.presetActive
                                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                            )}
                            disabled={isActionPending}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Row 2: Glowing Slider - Hidden in grid mode for compact layout */}
            {canSliderRaise && !inline && (
                <div className="px-1 sm:px-2">
                    <div className="flex justify-between items-center mb-1 sm:mb-2">
                        <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">Raise</span>
                        <span className={cn(
                            'text-sm sm:text-lg font-bold font-mono transition-colors duration-500',
                            isAllIn ? 'text-rose-400' : theme.sliderText
                        )}>
                            {isAllIn ? 'ALL-IN' : `$${raiseAmount.toLocaleString()}`}
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="range"
                            min={minRaise}
                            max={playerBalance}
                            step={raiseStep}
                            value={raiseAmount}
                            onChange={handleSliderChange}
                            className={cn(
                                'w-full h-1.5 sm:h-2 bg-white/10 rounded-full appearance-none cursor-pointer',
                                '[&::-webkit-slider-thumb]:appearance-none',
                                '[&::-webkit-slider-thumb]:w-4',
                                '[&::-webkit-slider-thumb]:h-4',
                                '[&::-webkit-slider-thumb]:sm:w-5',
                                '[&::-webkit-slider-thumb]:sm:h-5',
                                '[&::-webkit-slider-thumb]:rounded-full',
                                `[&::-webkit-slider-thumb]:${theme.sliderThumbBg}`,
                                '[&::-webkit-slider-thumb]:border-2',
                                '[&::-webkit-slider-thumb]:border-white/20',
                                '[&::-webkit-slider-thumb]:cursor-grab',
                                '[&::-webkit-slider-thumb]:active:cursor-grabbing',
                                '[&::-webkit-slider-thumb]:transition-colors',
                                '[&::-webkit-slider-thumb]:duration-500'
                            )}
                            style={{
                                // Dynamic slider thumb shadow — Tailwind arbitrary values can't use template literals in pseudo-elements
                                // so we use a CSS custom property as a workaround
                                '--tw-slider-shadow': theme.sliderThumbShadow,
                            } as React.CSSProperties}
                            disabled={isActionPending}
                        />
                        {/* Glow track fill */}
                        <div
                            className={cn(
                                'absolute top-0 left-0 h-1.5 sm:h-2 rounded-full bg-gradient-to-r pointer-events-none transition-all duration-500',
                                theme.trackGradient
                            )}
                            style={{ width: `${playerBalance > minRaise ? ((raiseAmount - minRaise) / (playerBalance - minRaise)) * 100 : 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Row 3: The Big Three Buttons - Compact in grid mode */}
            <div className={cn("flex gap-1.5 sm:gap-2", inline ? "h-8" : "h-9 sm:h-12")}>
                {/* FOLD */}
                <GameActionButton
                    variant="fold"
                    onClick={() => triggerAction('fold', onFold)}
                    disabled={isActionPending}
                >
                    Fold
                </GameActionButton>

                {/* CHECK */}
                {canCheck && (
                    <GameActionButton
                        variant="check"
                        onClick={() => triggerAction('check', onCheck)}
                        disabled={isActionPending}
                    >
                        Check
                    </GameActionButton>
                )}

                {/* CALL */}
                {canCall && (
                    <GameActionButton
                        variant="call"
                        onClick={() => triggerAction('call', () => onCall(currentCallAmount))}
                        disabled={isActionPending}
                    >
                        Call ${currentCallAmount}
                    </GameActionButton>
                )}

                {/* RAISE */}
                {canRaise && (
                    <GameActionButton
                        variant={isAllIn ? "all-in" : "raise"}
                        disabled={isActionPending}
                        onClick={() => {
                            if (isAllIn && onAllIn) {
                                triggerAction('all-in', onAllIn);
                            } else {
                                triggerAction('raise', () => onRaise(raiseAmount));
                            }
                        }}
                    >
                        {isShortShove
                            ? `All-In $${playerBalance.toLocaleString()}`
                            : isAllIn ? 'All-In' : `Raise $${raiseAmount.toLocaleString()}`}
                    </GameActionButton>
                )}
            </div>
        </div>
    );
};
