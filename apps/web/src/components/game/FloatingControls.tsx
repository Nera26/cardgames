'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVolumeHigh,
    faVolumeMute,
    faComments,
    faCog,
    faSignOutAlt,
    faXmark,
    faPalette,
    faChartBar,
    faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { useUI, TableSkin } from '@/contexts/UIContext';

interface FloatingControlsProps {
    isSoundOn: boolean;
    onToggleSound: () => void;
    isChatOpen: boolean;
    onToggleChat: () => void;
    onLeave: () => void;
    onToggleStats?: () => void;
    isStatsOpen?: boolean;
    onToggleHistory?: () => void;
    isHistoryOpen?: boolean;
    unreadChatCount?: number;
    className?: string;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
    isSoundOn,
    onToggleSound,
    isChatOpen,
    onToggleChat,
    onLeave,
    onToggleStats,
    isStatsOpen = false,
    onToggleHistory,
    isHistoryOpen = false,
    unreadChatCount = 0,
    className,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const { tableSkin, setTableSkin } = useUI();

    const cycleSkin = () => {
        const skins: TableSkin[] = ['green', 'blue', 'red', 'midnight'];
        const currentIndex = skins.indexOf(tableSkin);
        const nextIndex = (currentIndex + 1) % skins.length;
        setTableSkin(skins[nextIndex]);
    };

    return (
        <>
            {/* Floating Control Pill */}
            <div
                className={cn(
                    'fixed top-4 right-4 z-50',
                    'flex items-center gap-1',
                    'bg-black/40 backdrop-blur-xl',
                    'rounded-full border border-white/10',
                    'p-1.5',
                    'transition-all duration-300',
                    isHovered ? 'bg-black/60 border-white/20 shadow-2xl' : 'shadow-lg',
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Sound Toggle */}
                <button
                    onClick={onToggleSound}
                    className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        'transition-all duration-200',
                        'hover:bg-white/10 active:scale-90',
                        isSoundOn ? 'text-white/80' : 'text-white/40'
                    )}
                    title={isSoundOn ? 'Mute sounds' : 'Enable sounds'}
                >
                    <FontAwesomeIcon
                        icon={isSoundOn ? faVolumeHigh : faVolumeMute}
                        className="text-sm"
                    />
                </button>

                {/* Stats Toggle */}
                {onToggleStats && (
                    <button
                        onClick={onToggleStats}
                        className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            'transition-all duration-200',
                            'hover:bg-white/10 active:scale-90',
                            isStatsOpen ? 'text-emerald-400' : 'text-white/80'
                        )}
                        title="Real Time Result"
                    >
                        <FontAwesomeIcon icon={faChartBar} className="text-sm" />
                    </button>
                )}

                {/* Hand History Toggle */}
                {onToggleHistory && (
                    <button
                        onClick={onToggleHistory}
                        className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            'transition-all duration-200',
                            'hover:bg-white/10 active:scale-90',
                            isHistoryOpen ? 'text-amber-400' : 'text-white/80'
                        )}
                        title="Hand History"
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} className="text-sm" />
                    </button>
                )}

                {/* Chat Toggle */}
                <button
                    onClick={onToggleChat}
                    className={cn(
                        'relative w-10 h-10 rounded-full flex items-center justify-center',
                        'transition-all duration-200',
                        'hover:bg-white/10 active:scale-90',
                        isChatOpen ? 'text-accent-yellow' : 'text-white/80'
                    )}
                    title="Toggle chat"
                >
                    <FontAwesomeIcon
                        icon={isChatOpen ? faXmark : faComments}
                        className="text-sm"
                    />
                    {/* Unread badge */}
                    {unreadChatCount > 0 && !isChatOpen && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-bounce-subtle">
                            {unreadChatCount > 9 ? '9+' : unreadChatCount}
                        </span>
                    )}
                </button>

                {/* Table Skin Cycle */}
                <button
                    onClick={cycleSkin}
                    className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        'transition-all duration-200',
                        'hover:bg-white/10 active:scale-90 text-white/80'
                    )}
                    title={`Change Table felt color (Current: ${tableSkin})`}
                >
                    <FontAwesomeIcon
                        icon={faPalette}
                        className={cn(
                            "text-sm transition-colors duration-300",
                            tableSkin === 'green' && "text-emerald-400",
                            tableSkin === 'blue' && "text-blue-400",
                            tableSkin === 'red' && "text-red-400",
                            tableSkin === 'midnight' && "text-slate-400"
                        )}
                    />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10" />

                {/* Leave Button — always visible with text */}
                <button
                    onClick={onLeave}
                    className={cn(
                        'h-10 px-3 rounded-full flex items-center justify-center gap-2',
                        'transition-all duration-200',
                        'text-white/70 hover:text-white hover:bg-red-500/30 active:scale-90'
                    )}
                    title="Leave table"
                >
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
                </button>
            </div>
        </>
    );
};
