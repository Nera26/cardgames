'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface OverlayLayerProps {
    children: React.ReactNode;
    zIndex?: number;
}

/**
 * OverlayLayer - React Portal for Flying Animations
 * 
 * Solves the "Z-Index Trap": Flying elements (chips, cards) would get clipped
 * by overflow:hidden containers. This Portal renders them at document root.
 * 
 * Strategy:
 * 1. Hide "real" element at source position
 * 2. Spawn "motion clone" in this overlay at source coordinates
 * 3. Animate to destination coordinates
 * 4. Show "real" element at destination on completion
 */
export const OverlayLayer: React.FC<OverlayLayerProps> = ({ children, zIndex = 9999 }) => {
    const [mounted, setMounted] = useState(false);
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Create container div at document body
        const el = document.createElement('div');
        el.id = 'motion-overlay';
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: ${zIndex};
            overflow: visible;
        `;
        document.body.appendChild(el);
        setContainer(el);
        setMounted(true);

        return () => {
            document.body.removeChild(el);
        };
    }, [zIndex]);

    if (!mounted || !container) return null;

    return createPortal(children, container);
};

/**
 * Hook to get element coordinates for animation source/target
 */
export function useElementCoords(ref: React.RefObject<HTMLElement | null>) {
    const getCoords = React.useCallback(() => {
        if (!ref.current) return { x: 0, y: 0, width: 0, height: 0 };
        const rect = ref.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
        };
    }, [ref]);

    return getCoords;
}

/**
 * AnimationCoords type for flying animations
 */
export interface AnimationCoords {
    x: number;
    y: number;
    width?: number;
    height?: number;
}
