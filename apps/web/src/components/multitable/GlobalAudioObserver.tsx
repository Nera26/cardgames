'use client';

/**
 * GlobalAudioObserver — Multi-Table Sound Engine
 *
 * 🟣 Purple Cable: Sound Multiplexer
 *
 * A renderless component mounted at the layout level that watches
 * the entire `tables` dictionary. When ANY table transitions from
 * isMyTurn=false → isMyTurn=true, it fires the appropriate sound:
 *
 *   - Active table: 'alert' (the standard turn chime)
 *   - Background table: 'notification' (a softer, distinct chime)
 *
 * Uses a ref to track previous turn states per-table, ensuring
 * sounds only fire on the rising edge (false → true) — no spam.
 *
 * This component is NOT bound to any specific table's render lifecycle,
 * so it works even when:
 *   - The user is on a different tab (mobile)
 *   - The table component is not mounted (desktop grid)
 *   - The browser tab is in the background (alt-tabbed)
 */

import { useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useSound } from '@/contexts/SoundContext';

export function GlobalAudioObserver() {
    const { tables, activeTableId } = useSocket();
    const { playSound } = useSound();

    // Track previous isMyTurn state per table for edge detection
    const prevTurnStatesRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
        const prevStates = prevTurnStatesRef.current;

        for (const [tableId, slice] of Object.entries(tables)) {
            const wasMyTurn = prevStates[tableId] ?? false;
            const isMyTurn = slice.isMyTurn;

            // Rising edge: false → true
            if (!wasMyTurn && isMyTurn) {
                const isBackground = tableId !== activeTableId;

                if (isBackground) {
                    // Background table: play distinct notification sound
                    playSound('notification');
                    console.log(`[Audio] 🔔 Background table alert: ${tableId}`);
                }
                // Note: active table alert is already handled by the
                // 'your_turn' socket event listener in SocketContext
            }

            // Update tracking ref
            prevStates[tableId] = isMyTurn;
        }

        // Clean up removed tables from the ref
        for (const tableId of Object.keys(prevStates)) {
            if (!(tableId in tables)) {
                delete prevStates[tableId];
            }
        }
    }, [tables, activeTableId, playSound]);

    // Renderless component
    return null;
}
