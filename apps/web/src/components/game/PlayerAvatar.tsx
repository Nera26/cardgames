import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Player } from '@/types/game';
import { getAvatarUrl } from '@/config/avatars';
import { useUI } from '@/contexts/UIContext';

/**
 * PlayerAvatar — Clean circular avatar + name + balance.
 *
 * Design reference: GGPoker/PokerStars style.
 * - Bare circular photo (no pill container)
 * - Name text directly below
 * - Balance below name
 * - Minimal, compact layout
 * - ☕ Coffee Cup overlay with MM:SS countdown when sitting out
 */

export interface PlayerAvatarProps {
    player: Player & { seatIndex: number };
    style?: React.CSSProperties;
    className?: string;
    isHero?: boolean;
    isPortrait?: boolean;
    onRebuy?: () => void;
    isWinner?: boolean;
    handDescription?: string;
    amountWon?: number;
    /** Big blind value for BB display mode */
    bigBlind?: number;
}

const PlayerAvatarInner: React.FC<PlayerAvatarProps> = ({
    player,
    style,
    className,
    isHero = false,
    isPortrait = false,
    onRebuy,
    isWinner = false,
    handDescription,
    amountWon,
    bigBlind = 0,
}) => {
    const isFolded = player.status === 'folded';
    const isSittingOut = player.status === 'sitting_out';
    const avatarSize = isPortrait ? 48 : 52;
    const { displayInBB } = useUI();

    // 🟣 BB Display: format amount as BB or $
    const formatAmount = (amount: number): string => {
        if (displayInBB && bigBlind > 0) {
            const bb = amount / bigBlind;
            return bb % 1 === 0 ? `${bb} BB` : `${bb.toFixed(1)} BB`;
        }
        return `$${amount.toLocaleString()}`;
    };

    // ═══ Coffee Cup Timer: Live countdown for sitting_out players ═══
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!isSittingOut || !player.sitOutStartedAt || !player.sitOutBank) {
            setTimeLeft(null);
            return;
        }

        const tick = () => {
            const nowSec = Math.floor(Date.now() / 1000);
            const elapsed = nowSec - player.sitOutStartedAt!;
            const remaining = Math.max(0, player.sitOutBank! - elapsed);
            setTimeLeft(remaining);
        };

        tick(); // Immediate
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isSittingOut, player.sitOutStartedAt, player.sitOutBank]);

    const formatTime = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center transition-all duration-300 pointer-events-auto",
                !isFolded && "group",
                className
            )}
            style={style}
        >
            {/* 1. Avatar Circle — bare, no container */}
            <div className="relative">
                <div
                    className={cn(
                        "rounded-full overflow-hidden",
                        "border-2 transition-all duration-300",
                        isWinner
                            ? "border-yellow-400"
                            : isFolded
                                ? "border-white/10"
                                : "border-white/20",
                        !isHero && !isFolded && "hover:scale-105",
                        isWinner && "scale-110",
                    )}
                    style={{
                        width: avatarSize,
                        height: avatarSize,
                        ...(isWinner ? {
                            boxShadow: '0 0 16px 3px rgba(255,215,0,0.7), 0 0 32px 6px rgba(255,215,0,0.25)',
                            animation: 'avatarWinGlow 1.5s ease-in-out infinite',
                        } : {}),
                    }}
                >
                    <img
                        src={getAvatarUrl(player.avatarId, player.avatarUrl) || player.avatar}
                        alt={player.name}
                        width={avatarSize}
                        height={avatarSize}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-300",
                            isSittingOut && "grayscale opacity-50"
                        )}
                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(player.avatarId); }}
                        style={isFolded ? {
                            filter: 'grayscale(100%) brightness(40%)',
                        } : undefined}
                    />

                    {/* ☕ Coffee Cup Overlay with live countdown */}
                    {isSittingOut && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full">
                            <span className="text-amber-400 text-sm leading-none">☕</span>
                            {timeLeft !== null ? (
                                <span className="text-white text-[9px] font-bold tracking-wider leading-none mt-0.5">
                                    {formatTime(timeLeft)}
                                </span>
                            ) : (
                                <span className="text-white/60 text-[8px] font-medium leading-none mt-0.5">
                                    Break
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Dealer badge — outside overflow-hidden so it's fully visible */}
                {player.isDealer && (
                    <div className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-white rounded-full text-[10px] flex items-center justify-center font-bold text-black shadow-md border border-gray-300 z-20">
                        D
                    </div>
                )}
            </div>

            {/* 2. Name + Balance — frosted glass pill */}
            <div className="flex flex-col items-center px-2.5 py-1 mt-1 rounded-lg"
                style={{
                    background: 'rgba(11, 14, 20, 0.88)',
                }}
            >
                <div className={cn(
                    "font-semibold uppercase tracking-wide truncate text-center leading-none",
                    "max-w-[72px]",
                    isFolded ? "text-gray-500" : isHero ? "text-gold-500" : "text-text-primary",
                    isPortrait ? "text-[9px]" : "text-[10px]"
                )}>
                    {player.name}
                </div>
                <div className={cn(
                    "font-mono font-medium leading-none mt-0.5",
                    isFolded ? "text-gray-600" : isHero ? "text-white" : "text-gray-300",
                    isPortrait ? "text-[10px]" : "text-[11px]"
                )}>
                    {formatAmount(player.balance)}
                </div>
            </div>

            {/* 4. Winner Badge — below balance */}
            {isWinner && (
                <div className="flex flex-col items-center mt-1 gap-0.5">
                    {handDescription && (
                        <div className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider whitespace-nowrap"
                            style={{
                                background: 'var(--image-gold-gradient)',
                                color: '#1a1a1a',
                                textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                            }}>
                            {handDescription}
                        </div>
                    )}
                    {amountWon != null && amountWon > 0 && (
                        <div className="text-[9px] font-bold text-gold-400">
                            +{formatAmount(amountWon)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const PlayerAvatar = React.memo(PlayerAvatarInner);


// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('avatar-win-glow-keyframes')) {
    const style = document.createElement('style');
    style.id = 'avatar-win-glow-keyframes';
    style.textContent = `
        @keyframes avatarWinGlow {
            0%, 100% { box-shadow: 0 0 12px 2px rgba(255,215,0,0.6), 0 0 24px 4px rgba(255,215,0,0.2); }
            50% { box-shadow: 0 0 18px 3px rgba(255,215,0,0.8), 0 0 36px 6px rgba(255,215,0,0.3); }
        }
    `;
    document.head.appendChild(style);
}
