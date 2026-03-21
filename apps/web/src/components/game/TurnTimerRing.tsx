'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * TurnTimerRing — Two-Phase Turn Timer (GGPoker/PokerStars Standard)
 *
 * Phase 1 (Game Pace):  Cyan ring, smooth linear countdown. Free time.
 * Phase 2 (Time Bank):  Red/amber ring, pulse animation. Depletes permanently.
 *
 * The ring "refills" when switching from Pace → Bank mode via the
 * time_bank_activated socket event.
 */

interface TurnTimerRingProps {
    deadline: number;       // Date.now() + durationMs at time of creation
    totalDuration: number;  // Total ms for this phase
    isActive: boolean;
    isTimeBank?: boolean;   // Phase 2 mode (from socket event)
}

// ── GEOMETRY ──
const STROKE_WIDTH = 3;
const SVG_SIZE = 64;
const RADIUS = (SVG_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const URGENT_THRESHOLD = 5; // seconds — warning zone for Game Pace

// ── COLORS ──
const PACE_COLOR = '#00E5FF';        // Cyan — Phase 1 (Game Pace)
const PACE_GLOW = 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.5))';
const PACE_URGENT_COLOR = '#FF9800'; // Orange — 5s warning
const PACE_URGENT_GLOW = 'drop-shadow(0 0 6px rgba(255, 152, 0, 0.7))';

const BANK_COLOR = '#EF4444';        // Red — Phase 2 (Time Bank)
const BANK_GLOW = 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.7))';

export const TurnTimerRing: React.FC<TurnTimerRingProps> = ({
    deadline,
    totalDuration,
    isActive,
    isTimeBank = false,
}) => {
    const circleRef = useRef<SVGCircleElement>(null);
    const urgentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number>(0);
    const [showBadge, setShowBadge] = useState(false);

    useEffect(() => {
        setShowBadge(isTimeBank && isActive);
    }, [isTimeBank, isActive]);

    useEffect(() => {
        if (!isActive || !deadline || !totalDuration || !circleRef.current) return;

        const circle = circleRef.current;
        const now = Date.now();
        const remaining = Math.max(0, deadline - now);
        const elapsed = totalDuration - remaining;
        // Cap at 95% — never fully deplete so the ring is always visible while active
        const progress = Math.min(0.95, elapsed / totalDuration);
        const currentOffset = CIRCUMFERENCE * progress;

        // ── Determine initial visual state ──
        // If timer has elapsed but turn hasn't moved, show depleted (urgent) state
        const isElapsed = remaining <= 0;
        const color = isTimeBank ? BANK_COLOR : (isElapsed ? PACE_URGENT_COLOR : PACE_COLOR);
        const glow = isTimeBank ? BANK_GLOW : (isElapsed ? PACE_URGENT_GLOW : PACE_GLOW);

        // ── STEP 1: Jump to current position (no transition) ──
        circle.style.transition = 'none';
        circle.setAttribute('stroke-dashoffset', String(currentOffset));
        circle.setAttribute('stroke', color);
        circle.style.filter = glow;

        // ── STEP 2: Animate smoothly to max depletion (95%) ──
        // If already elapsed (background tab catch-up), skip animation
        if (!isElapsed) {
            const targetOffset = CIRCUMFERENCE * 0.95; // Stop at 95%, keep ring visible
            rafRef.current = requestAnimationFrame(() => {
                if (!circleRef.current) return;
                const transitionProps = `stroke-dashoffset ${remaining}ms linear, stroke 0.4s ease, filter 0.4s ease`;
                circle.style.transition = transitionProps;
                circle.setAttribute('stroke-dashoffset', String(targetOffset));
            });
        }

        // ── STEP 3: Pace mode — switch to warning color at 5s ──
        if (!isTimeBank) {
            const urgentMs = remaining - URGENT_THRESHOLD * 1000;
            if (urgentMs > 0) {
                urgentTimerRef.current = setTimeout(() => {
                    if (!circleRef.current) return;
                    circleRef.current.setAttribute('stroke', PACE_URGENT_COLOR);
                    circleRef.current.style.filter = PACE_URGENT_GLOW;
                }, urgentMs);
            } else if (remaining <= URGENT_THRESHOLD * 1000) {
                // Already in urgent zone
                circle.setAttribute('stroke', PACE_URGENT_COLOR);
                circle.style.filter = PACE_URGENT_GLOW;
            }
        }

        return () => {
            cancelAnimationFrame(rafRef.current);
            if (urgentTimerRef.current) {
                clearTimeout(urgentTimerRef.current);
                urgentTimerRef.current = null;
            }
        };
    }, [isActive, deadline, totalDuration, isTimeBank]);

    if (!isActive) return null;

    const initialColor = isTimeBank ? BANK_COLOR : PACE_COLOR;
    const initialGlow = isTimeBank ? BANK_GLOW : PACE_GLOW;

    return (
        <div
            className="absolute z-[35] pointer-events-none"
            style={{
                width: SVG_SIZE,
                height: SVG_SIZE,
                top: 26,
                left: '50%',
                transform: 'translate(-50%, -50%)',
            }}
        >
            <svg
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            >
                {/* Background track — faint ring */}
                <circle
                    cx={SVG_SIZE / 2}
                    cy={SVG_SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={STROKE_WIDTH}
                />

                {/* Progress ring */}
                <circle
                    ref={circleRef}
                    cx={SVG_SIZE / 2}
                    cy={SVG_SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={initialColor}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={0}
                    transform={`rotate(-90 ${SVG_SIZE / 2} ${SVG_SIZE / 2})`}
                    style={{ filter: initialGlow }}
                />
            </svg>

            {/* TIME BANK badge — shown when in Phase 2 */}
            {showBadge && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center animate-pulse"
                    style={{
                        bottom: -14,
                        zIndex: 40,
                    }}
                >
                    <span
                        className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                            background: 'rgba(239, 68, 68, 0.85)',
                            color: '#fff',
                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                            letterSpacing: '0.06em',
                        }}
                    >
                        TIME BANK
                    </span>
                </div>
            )}
        </div>
    );
};
