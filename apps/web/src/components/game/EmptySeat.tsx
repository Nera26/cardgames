'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChair } from '@fortawesome/free-solid-svg-icons';

interface EmptySeatProps {
    seatIndex: number;
    style?: React.CSSProperties;
    isPortrait?: boolean;
    onClick?: () => void;
}

/**
 * EmptySeat - Ghost Seat Component
 * 
 * Renders a clickable empty seat slot for the Spectator First architecture.
 * When clicked, opens the BuyInModal for that specific seat.
 */
export const EmptySeat: React.FC<EmptySeatProps> = ({
    seatIndex,
    style,
    isPortrait = false,
    onClick,
}) => {
    return (
        <div
            className={cn(
                "absolute flex flex-col items-center transition-all duration-300 pointer-events-auto cursor-pointer",
                "group hover:scale-110"
            )}
            style={style}
            onClick={onClick}
        >
            {/* Ghost Seat Circle */}
            <div className={cn(
                "relative flex items-center justify-center",
                "bg-white/[0.07]",
                "rounded-full border-2 border-dashed border-white/20",
                "hover:border-emerald-500/50 hover:bg-emerald-500/10",
                "transition-all duration-200",
                "shadow-inner",
                isPortrait ? "w-[40px] h-[40px]" : "w-[50px] h-[50px]"
            )}>
                <FontAwesomeIcon
                    icon={faChair}
                    className={cn(
                        "text-white/30 group-hover:text-emerald-400",
                        "transition-colors duration-200",
                        isPortrait ? "text-sm" : "text-lg"
                    )}
                />

                {/* Plus indicator on hover */}
                <div className={cn(
                    "absolute -top-1 -right-1",
                    "w-4 h-4 rounded-full",
                    "bg-emerald-500 text-white text-[10px] font-bold",
                    "flex items-center justify-center",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-200",
                    "shadow-lg"
                )}>
                    +
                </div>
            </div>

            {/* Seat Number Label */}
            <div className={cn(
                "mt-1 text-white/30 font-mono",
                "group-hover:text-white/60",
                "transition-colors duration-200",
                isPortrait ? "text-[8px]" : "text-[10px]"
            )}>
                Seat {seatIndex + 1}
            </div>

            {/* "Sit Here" tooltip on hover */}
            <div className={cn(
                "absolute -bottom-6 left-1/2 -translate-x-1/2",
                "bg-emerald-500 text-white text-[9px] font-bold",
                "px-2 py-0.5 rounded-full whitespace-nowrap",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-200",
                "shadow-lg"
            )}>
                Click to Sit
            </div>
        </div>
    );
};
