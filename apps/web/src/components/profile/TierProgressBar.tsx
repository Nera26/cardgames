'use client';

import { TIER_CONFIG, TIER_ORDER, Tier } from '@poker/shared';

interface TierProgressBarProps {
    currentTier: Tier;
    nextTierProgress: number;
    rakeToNextTier: number;
    lifetimeRake: number;
}

export function TierProgressBar({ currentTier, nextTierProgress, rakeToNextTier, lifetimeRake }: TierProgressBarProps) {
    const tierConfig = TIER_CONFIG[currentTier];
    const nextTierIndex = TIER_ORDER.indexOf(currentTier) + 1;
    const nextTier = nextTierIndex < TIER_ORDER.length ? TIER_ORDER[nextTierIndex] : null;

    return (
        <div className="w-full">
            {/* Current Tier Badge */}
            <p className="mt-1 flex items-center">
                Tier:
                <span
                    className="inline-block font-semibold py-1 px-3 rounded-full text-sm ml-2"
                    style={{
                        backgroundColor: tierConfig.color,
                        color: currentTier === 'BRONZE' || currentTier === 'GOLD' ? '#1a1d21' : '#fff'
                    }}
                >
                    {tierConfig.label}
                </span>
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-border-dark rounded-full h-3 mt-2 overflow-hidden">
                <div
                    className="h-full transition-all duration-500"
                    style={{
                        width: `${nextTierProgress}%`,
                        backgroundColor: nextTier ? TIER_CONFIG[nextTier].color : tierConfig.color
                    }}
                />
            </div>

            {/* Progress Text */}
            {nextTier ? (
                <p className="text-text-secondary text-xs mt-1">
                    {nextTierProgress}% to {TIER_CONFIG[nextTier].label}
                </p>
            ) : (
                <p className="text-accent-yellow text-xs mt-1">
                    🏆 Max Tier Achieved! Lifetime Rake: {lifetimeRake.toLocaleString()} MNT
                </p>
            )}
        </div>
    );
}
