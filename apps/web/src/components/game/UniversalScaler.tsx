'use client';

import React, { useState, useEffect, useRef } from 'react';

interface UniversalScalerProps {
    baseWidth: number;
    baseHeight: number;
    maxScale?: number;  // Optional max scale limit
    children: React.ReactNode;
}

/**
 * Universal Scaler - The Engine
 * Scales content to fill the available space while maintaining aspect ratio.
 * Uses contain strategy - fits entirely within parent without clipping.
 */
export const UniversalScaler: React.FC<UniversalScalerProps> = ({
    baseWidth,
    baseHeight,
    maxScale = 1.0,  // Default max scale is 1.0 (no upscaling)
    children
}) => {
    const [scale, setScale] = useState(0.8);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (!wrapperRef.current) return;

            // Measure the available space
            const parentW = wrapperRef.current.clientWidth;
            const parentH = wrapperRef.current.clientHeight;

            // Bail out if dimensions are zero (element not mounted yet)
            if (parentW === 0 || parentH === 0) {
                setTimeout(handleResize, 50);
                return;
            }

            // Calculate fit - use contain strategy (fit entirely within parent)
            const scaleX = parentW / baseWidth;
            const scaleY = parentH / baseHeight;

            // Pick the smaller scale so content fits both dimensions
            // Also cap at maxScale to prevent over-scaling
            const newScale = Math.min(scaleX, scaleY, maxScale);

            setScale(newScale);
        };

        // Run immediately and on resize
        window.addEventListener('resize', handleResize);
        handleResize();

        // Multiple retries to ensure proper mount
        const timeout1 = setTimeout(handleResize, 50);
        const timeout2 = setTimeout(handleResize, 150);
        const timeout3 = setTimeout(handleResize, 300);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeout1);
            clearTimeout(timeout2);
            clearTimeout(timeout3);
        };
    }, [baseWidth, baseHeight, maxScale]);

    return (
        <div
            ref={wrapperRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
                position: 'relative'
            }}
        >
            <div
                style={{
                    width: baseWidth,
                    height: baseHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}
            >
                {children}
            </div>
        </div>
    );
};
