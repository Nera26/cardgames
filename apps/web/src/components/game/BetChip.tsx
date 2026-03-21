'use client';

import React from 'react';

/**
 * BetChip — Premium SVG poker chip icon for player bet displays.
 * 
 * Inspired by professional poker apps: a gold/red gradient circle 
 * with inner ring pattern and a central star/dollar motif.
 */

interface BetChipProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZES = {
    sm: 18,
    md: 24,
    lg: 32,
};

export const BetChip: React.FC<BetChipProps> = ({ size = 'sm', className }) => {
    const px = SIZES[size];

    return (
        <svg
            width={px}
            height={px}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ flexShrink: 0 }}
        >
            {/* Outer ring — red/gold gradient */}
            <circle cx="16" cy="16" r="15" fill="url(#chipGrad)" stroke="#B8960F" strokeWidth="1" />

            {/* Inner dark ring */}
            <circle cx="16" cy="16" r="11.5" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />

            {/* Dashed edge pattern (casino chip notches) */}
            <circle
                cx="16" cy="16" r="13.5"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.2"
                strokeDasharray="3 4.5"
                strokeLinecap="round"
            />

            {/* Center fill */}
            <circle cx="16" cy="16" r="9" fill="url(#centerGrad)" />

            {/* Center star */}
            <text
                x="16" y="17.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="800"
                fill="rgba(255,255,255,0.95)"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
                ★
            </text>

            {/* Top highlight */}
            <ellipse cx="16" cy="9" rx="7" ry="4" fill="rgba(255,255,255,0.15)" />

            {/* Gradient definitions */}
            <defs>
                <radialGradient id="chipGrad" cx="0.4" cy="0.35" r="0.7">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#E6A800" />
                    <stop offset="100%" stopColor="#B8860B" />
                </radialGradient>
                <radialGradient id="centerGrad" cx="0.4" cy="0.35" r="0.7">
                    <stop offset="0%" stopColor="#FFE066" />
                    <stop offset="100%" stopColor="#D4A017" />
                </radialGradient>
            </defs>
        </svg>
    );
};
