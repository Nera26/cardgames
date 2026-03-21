'use client';

/**
 * MotionEventBridge - Connects game state to animation system
 * 
 * This component must be rendered INSIDE MotionOrchestrator AND
 * INSIDE TableLayoutProvider. It watches game state and triggers
 * animations automatically.
 * 
 * 🟣 Iron Grid: Consumes TableLayoutContext directly so that
 * useMotionEvents receives real DOM-measured coordinates for
 * all animation trajectories (chips, cards, fold).
 */

import React from 'react';
import { useMotionEvents } from '@/hooks/useMotionEvents';
import { Player, TableState } from '@/types/game';
import { HandResultData } from '@/contexts/SocketContext';
import { useTableLayoutOptional } from '@/contexts/TableLayoutContext';

interface MotionEventBridgeProps {
    tableState: (TableState & { players: Array<Player & { seatIndex: number }> }) | null;
    heroSeatIndex: number;
    isJoined: boolean;
    handResult?: HandResultData | null;
    children: React.ReactNode;
}

export const MotionEventBridge: React.FC<MotionEventBridgeProps> = ({
    tableState,
    heroSeatIndex,
    isJoined,
    handResult,
    children,
}) => {
    // 🟣 Iron Grid: consume DOM coordinate context directly
    const layout = useTableLayoutOptional();




    // 🟣 Iron Grid: Forward DOM coordinate callbacks to the motion events hook
    useMotionEvents(
        { tableState, heroSeatIndex, isJoined, handResult },
        layout?.getPlayerCoords,
        layout?.getPotCoords,
        layout?.getDealerCoords,
    );

    return <>{children}</>;
};

