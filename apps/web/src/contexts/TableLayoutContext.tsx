'use client';

/**
 * TableLayoutContext — The Iron Grid
 *
 * Captures live DOM positions of key table elements so that
 * flying animations (chips, cards) know exactly where to
 * originate and land.
 *
 * This is a "dumb" spatial utility: it measures getBoundingClientRect()
 * and feeds {x,y} to the animation system. Zero game logic.
 *
 * @see MotionEventBridge.tsx — consumes these coordinates
 * @see useMotionEvents.ts  — uses them for animation triggers
 */

import React, {
    createContext,
    useContext,
    useRef,
    useCallback,
    type RefObject,
    type ReactNode,
} from 'react';

// ============================================================
// Types
// ============================================================

interface Coords {
    x: number;
    y: number;
}

interface TableLayoutContextValue {
    /** Attach to the pot display element */
    potRef: RefObject<HTMLDivElement | null>;

    /** Attach to a dealer/deck marker (or reuses pot if absent) */
    dealerRef: RefObject<HTMLDivElement | null>;

    /**
     * Returns a ref-callback for a specific seat index.
     * Usage: <div ref={registerSeat(seatIndex)} />
     */
    registerSeat: (seatIndex: number) => (el: HTMLDivElement | null) => void;

    /**
     * Returns a ref-callback for a community card board slot (0-4).
     * Usage: <div ref={registerBoardSlot(index)} />
     */
    registerBoardSlot: (slotIndex: number) => (el: HTMLDivElement | null) => void;

    /** Live center-point of a player seat's DOM element */
    getPlayerCoords: (seatIndex: number) => Coords;

    /** Live center-point of a community card board slot. Returns null if ref is missing. */
    getBoardCoords: (slotIndex: number) => Coords | null;

    /** Live center-point of the pot element */
    getPotCoords: () => Coords;

    /** Live center-point of the dealer/deck element (falls back to pot) */
    getDealerCoords: () => Coords;
}

// ============================================================
// Helpers
// ============================================================

/** Extract document-relative center coords from a DOM element */
function centerOf(el: HTMLElement | null): Coords | null {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // Degenerate rect guard: collapsed/ghost elements return {0,0,0,0}
    if (rect.width === 0 && rect.height === 0) return null;
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

/** Viewport-center fallback when no ref is attached */
function viewportCenter(): Coords {
    return {
        x: (typeof window !== 'undefined' ? window.innerWidth : 800) / 2,
        y: (typeof window !== 'undefined' ? window.innerHeight : 600) * 0.35,
    };
}

// ============================================================
// Context
// ============================================================

const TableLayoutContext = createContext<TableLayoutContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface TableLayoutProviderProps {
    children: ReactNode;
}

export const TableLayoutProvider: React.FC<TableLayoutProviderProps> = ({ children }) => {
    const potRef = useRef<HTMLDivElement | null>(null);
    const dealerRef = useRef<HTMLDivElement | null>(null);

    // Map<seatIndex, HTMLDivElement> — populated by registerSeat callbacks
    const seatElements = useRef<Map<number, HTMLDivElement>>(new Map());

    // Map<slotIndex, HTMLDivElement> — populated by registerBoardSlot callbacks (0-4)
    const boardSlotElements = useRef<Map<number, HTMLDivElement>>(new Map());

    /**
     * Returns a ref-callback for a given seat index.
     * React calls this with the element on mount and null on unmount.
     */
    const registerSeat = useCallback((seatIndex: number) => {
        return (el: HTMLDivElement | null) => {
            if (el) {
                seatElements.current.set(seatIndex, el);
            } else {
                seatElements.current.delete(seatIndex);
            }
        };
    }, []);

    /**
     * Returns a ref-callback for a community card board slot (0-4).
     */
    const registerBoardSlot = useCallback((slotIndex: number) => {
        return (el: HTMLDivElement | null) => {
            if (el) {
                boardSlotElements.current.set(slotIndex, el);
            } else {
                boardSlotElements.current.delete(slotIndex);
            }
        };
    }, []);

    const getPlayerCoords = useCallback((seatIndex: number): Coords => {
        const el = seatElements.current.get(seatIndex) ?? null;
        return centerOf(el) ?? fallbackSeatCoords(seatIndex);
    }, []);

    /** Returns exact center of a board slot, or null if ref is missing/collapsed */
    const getBoardCoords = useCallback((slotIndex: number): Coords | null => {
        const el = boardSlotElements.current.get(slotIndex) ?? null;
        return centerOf(el); // null when element is missing or has zero dimensions
    }, []);

    const getPotCoords = useCallback((): Coords => {
        return centerOf(potRef.current) ?? viewportCenter();
    }, []);

    const getDealerCoords = useCallback((): Coords => {
        // Prefer dedicated dealer ref; fall back to pot position
        return centerOf(dealerRef.current) ?? getPotCoords();
    }, [getPotCoords]);

    const value: TableLayoutContextValue = {
        potRef,
        dealerRef,
        registerSeat,
        registerBoardSlot,
        getPlayerCoords,
        getBoardCoords,
        getPotCoords,
        getDealerCoords,
    };

    return (
        <TableLayoutContext.Provider value={value}>
            {children}
        </TableLayoutContext.Provider>
    );
};

// ============================================================
// Hook
// ============================================================

export function useTableLayout(): TableLayoutContextValue {
    const ctx = useContext(TableLayoutContext);
    if (!ctx) {
        throw new Error('useTableLayout must be used within <TableLayoutProvider>');
    }
    return ctx;
}

/**
 * Nullable hook variant — returns null if no provider is present.
 * Used by components that can operate with or without the grid.
 */
export function useTableLayoutOptional(): TableLayoutContextValue | null {
    return useContext(TableLayoutContext);
}

// ============================================================
// Fallback seat coords (same approximation as useMotionEvents)
// ============================================================

function fallbackSeatCoords(seatIndex: number): Coords {
    const angle = (seatIndex / 9) * Math.PI * 2 - Math.PI / 2;
    const centerX = (typeof window !== 'undefined' ? window.innerWidth : 800) / 2;
    const centerY = (typeof window !== 'undefined' ? window.innerHeight : 600) * 0.4;
    const radiusX = (typeof window !== 'undefined' ? window.innerWidth : 800) * 0.35;
    const radiusY = (typeof window !== 'undefined' ? window.innerHeight : 600) * 0.25;
    return {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
    };
}
