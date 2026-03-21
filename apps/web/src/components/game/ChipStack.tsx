'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// CHIP COLOR SYSTEM
// ============================================

interface ChipColor {
    bg: string;
    edge: string;
    stripe: string;
    shadow: string;
    label: string;
}

const CHIP_COLORS: { threshold: number; color: ChipColor }[] = [
    {
        threshold: 10000,
        color: {
            bg: 'linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #B8960F 100%)',
            edge: '#B8960F',
            stripe: 'rgba(255,255,255,0.5)',
            shadow: 'rgba(139,114,9,0.6)',
            label: '★',
        },
    },
    {
        threshold: 1000,
        color: {
            bg: 'linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #B8960F 100%)',
            edge: '#B8960F',
            stripe: 'rgba(255,255,255,0.5)',
            shadow: 'rgba(139,114,9,0.6)',
            label: '1K',
        },
    },
    {
        threshold: 500,
        color: {
            bg: 'linear-gradient(135deg, #CE93D8 0%, #9C27B0 40%, #7B1FA2 100%)',
            edge: '#7B1FA2',
            stripe: 'rgba(255,255,255,0.4)',
            shadow: 'rgba(74,20,140,0.6)',
            label: '500',
        },
    },
    {
        threshold: 100,
        color: {
            bg: 'linear-gradient(135deg, #666 0%, #333 40%, #222 100%)',
            edge: '#222',
            stripe: 'rgba(255,255,255,0.3)',
            shadow: 'rgba(0,0,0,0.7)',
            label: '100',
        },
    },
    {
        threshold: 0,
        color: {
            bg: 'linear-gradient(135deg, #EF9A9A 0%, #F44336 40%, #D32F2F 100%)',
            edge: '#D32F2F',
            stripe: 'rgba(255,255,255,0.4)',
            shadow: 'rgba(183,28,28,0.6)',
            label: '5',
        },
    },
];

function getChipColor(amount: number): ChipColor {
    for (const { threshold, color } of CHIP_COLORS) {
        if (amount >= threshold) return color;
    }
    return CHIP_COLORS[CHIP_COLORS.length - 1].color;
}

/**
 * Format amount for display: 1500 → "1,500", 25000 → "25K"
 */
function formatAmount(amount: number): string {
    if (amount >= 100000) return `${(amount / 1000).toFixed(0)}K`;
    if (amount >= 10000) return `${(amount / 1000).toFixed(1)}K`.replace('.0K', 'K');
    return amount.toLocaleString();
}

// ============================================
// CHIP SIZES
// ============================================

const CHIP_SIZES = {
    sm: { diameter: 20, fontSize: 6 },
    md: { diameter: 26, fontSize: 7 },
    lg: { diameter: 32, fontSize: 9 },
};

// ============================================
// SINGLE CHIP ICON
// ============================================

const ChipIcon: React.FC<{ color: ChipColor; size: 'sm' | 'md' | 'lg' }> = ({ color, size }) => {
    const { diameter, fontSize } = CHIP_SIZES[size];

    return (
        <div
            className="relative rounded-full flex-shrink-0"
            style={{
                width: diameter,
                height: diameter,
                background: color.bg,
                boxShadow: `
                    0 2px 0 0 ${color.edge},
                    0 3px 6px ${color.shadow},
                    inset 0 1px 2px rgba(255,255,255,0.3)
                `,
            }}
        >
            {/* Dashed edge stripe */}
            <div
                className="absolute rounded-full"
                style={{
                    inset: diameter * 0.12,
                    border: `1.5px dashed ${color.stripe}`,
                }}
            />
            {/* Center label */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    fontSize,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
            >
                {color.label}
            </div>
            {/* Top shine */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    top: 1,
                    left: '15%',
                    right: '15%',
                    height: '35%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
                    borderRadius: '50%',
                }}
            />
        </div>
    );
};

// ============================================
// CHIP STACK COMPONENT (EXPORTED)
// ============================================

interface ChipStackProps {
    potAmount: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    layoutId?: string;
    position?: 'left' | 'center' | 'right';
}

export const ChipStack: React.FC<ChipStackProps> = ({
    potAmount,
    size = 'md',
    className,
    layoutId,
    position = 'center',
}) => {
    if (potAmount <= 0) return null;

    const color = getChipColor(potAmount);
    const formatted = formatAmount(potAmount);

    const isRight = position === 'right';

    return (
        <motion.div
            layoutId={layoutId}
            className={cn(
                'flex items-center gap-1.5 pointer-events-none select-none',
                position === 'center' && 'justify-center',
                className
            )}
            initial={layoutId ? undefined : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            {isRight && (
                <span
                    className="text-white font-bold tabular-nums"
                    style={{
                        fontSize: size === 'sm' ? 10 : size === 'md' ? 13 : 16,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                >
                    ${formatted}
                </span>
            )}

            <ChipIcon color={color} size={size} />

            {!isRight && (
                <span
                    className="text-white font-bold tabular-nums"
                    style={{
                        fontSize: size === 'sm' ? 10 : size === 'md' ? 13 : 16,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                >
                    ${formatted}
                </span>
            )}
        </motion.div>
    );
};

// Re-export for backward compatibility
export { getChipColor, CHIP_COLORS };
