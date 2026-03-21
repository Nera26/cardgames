import { useMemo } from 'react';

// --- Types ---
type LayoutMode = 'landscape' | 'portrait';

interface RadiusConfig {
    outerX: number; // Avatar Horizontal Radius %
    outerY: number; // Avatar Vertical Radius %
    innerX: number; // Cards Horizontal Radius %
    innerY: number; // Cards Vertical Radius %
}

interface PositionResult {
    avatar: { top: string; left: string };
    cards: { top: string; left: string };
    /** @deprecated Bet chips are now radially anchored to PlayerSeat. Retained for legacy animation compat. */
    chip: { top: string; left: string };
    deg: number; // Useful for debugging or rotating dealer buttons
}

// --- 1. The "Perfect" Angles Configuration ---
// These are NOT mathematically equal. They are visually tuned for a 
// standard poker table aspect ratio (~2:1) to prevent side-bunching.
const LANDSCAPE_ANGLES: Record<number, number[]> = {
    6: [90, 150, 210, 270, 330, 30],
    9: [90, 130, 170, 215, 255, 290, 325, 10, 50],
    2: [90, 270],
};

// Portrait angles: Push bottom & top clusters toward corners
// to prevent the "Portrait Pinch" overlap on narrow screens.
// Bottom hero-adjacents: 130→150, 50→30 (wider by 20°)
// Top adjacents: 215→200, 325→340 (wider by 15°)
// Side seats stay roughly the same.
const PORTRAIT_ANGLES: Record<number, number[]> = {
    6: [90, 155, 210, 270, 330, 25],
    9: [90, 150, 180, 200, 255, 290, 340, 0, 30],
    2: [90, 270],
};

// --- 2. Math Helpers ---
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Calculates CSS percentage coordinates based on ellipse math.
 * We subtract the result from 100 on the Y-axis because 
 * in CSS, 0% is the top, but in Unit Circle math, 90deg is up.
 */
const getEllipsePos = (deg: number, rx: number, ry: number) => {
    const rad = toRad(deg);
    // In CSS: Y grows downward, so for 90° to be at BOTTOM:
    // 90° -> sin=1 -> top = 50 + ry = near bottom (high %)
    // 270° -> sin=-1 -> top = 50 - ry = near top (low %)
    return {
        left: 50 + rx * Math.cos(rad),
        top: 50 + ry * Math.sin(rad),  // PLUS for CSS Y-axis
    };
};

// --- 3. The Hook ---
export const useTablePositions = (
    totalSeats: number,
    heroSeatIndex: number,
    radiusConfig: RadiusConfig
): PositionResult[] => {
    return useMemo(() => {
        // Detect portrait layout from radius ratio
        const isPortraitLayout = (radiusConfig.outerY / radiusConfig.outerX) > 0.93;

        // 1. Get the ideal angles for this seat count
        // Select portrait or landscape angles based on screen orientation
        const angleSet = isPortraitLayout ? PORTRAIT_ANGLES : LANDSCAPE_ANGLES;
        let baseAngles = angleSet[totalSeats];

        if (!baseAngles) {
            baseAngles = Array.from({ length: totalSeats }, (_, i) =>
                (i * 360) / totalSeats + 90
            );
        }

        // 2. Generate positions for every seat index (0 to N-1)
        const positions = new Array(totalSeats).fill(null).map((_, seatIndex) => {

            // 3. Calculate "Visual Rotation" 
            // We want the Hero (heroSeatIndex) to ALWAYS be at the first angle (90 deg / Bottom)
            // This calculates how many "steps" we need to rotate the table.
            const rotationSteps = (totalSeats - heroSeatIndex) % totalSeats;

            // Get the visually correct angle for this seat
            const visualIndex = (seatIndex + rotationSteps) % totalSeats;
            const angle = baseAngles[visualIndex];

            // 4. Calculate Avatar Position (Outer Rim)
            const avatarPos = getEllipsePos(angle, radiusConfig.outerX, radiusConfig.outerY);

            // 5. Calculate Card Position (Inner Rim)
            // We use the SAME angle so the cards are perfectly aligned with the player 
            // relative to the center.
            const cardPos = getEllipsePos(angle, radiusConfig.innerX, radiusConfig.innerY);

            // 6. Calculate Chip Position
            // Portrait (tall table): 60% radius — halfway between player and pot center
            // Landscape (wide table): 55% radius — halfway between player and pot
            const chipFactor = isPortraitLayout ? 0.80 : 0.55;
            const chipRx = radiusConfig.outerX * chipFactor;
            const chipRy = radiusConfig.outerY * chipFactor;
            const chipPos = getEllipsePos(angle, chipRx, chipRy);

            return {
                // We return percentages precise to 2 decimals for cleaner DOM
                avatar: {
                    left: `${avatarPos.left.toFixed(2)}%`,
                    top: `${avatarPos.top.toFixed(2)}%`
                },
                cards: {
                    left: `${cardPos.left.toFixed(2)}%`,
                    top: `${cardPos.top.toFixed(2)}%`
                },
                chip: {
                    left: `${chipPos.left.toFixed(2)}%`,
                    top: `${chipPos.top.toFixed(2)}%`
                },
                deg: angle,
            };
        });

        return positions;
    }, [totalSeats, heroSeatIndex, radiusConfig]);
};

export type { RadiusConfig, PositionResult, LayoutMode };
