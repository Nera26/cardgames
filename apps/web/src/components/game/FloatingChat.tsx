'use client';

import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faXmark } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { ChatPanel } from './ChatPanel';
import { useGameChat } from '@/hooks/useGameChat';

interface FloatingChatProps {
    isOpen: boolean;
    onToggle: () => void;
    tableId: string;
    onUnreadCountChange?: (count: number) => void;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, onToggle, tableId, onUnreadCountChange }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const { messages, sendMessage, unreadCount, markAsRead, markAsClosed } = useGameChat(tableId, token);

    // Sync open/close state with unread tracking
    useEffect(() => {
        if (isOpen) {
            markAsRead();
        } else {
            markAsClosed();
        }
    }, [isOpen, markAsRead, markAsClosed]);

    // Bubble unread count up to parent
    useEffect(() => {
        onUnreadCountChange?.(unreadCount);
    }, [unreadCount, onUnreadCountChange]);

    return (
        <>
            {/* MINI BUTTON — Glowing FAB with unread badge + pulse */}
            <button
                onClick={onToggle}
                className={cn(
                    // Position: Fixed, floats above action bar
                    "fixed z-[100]",
                    // Mobile: bottom-52 (208px) clears the ~180px action bar
                    "bottom-52 right-4",
                    // Desktop: adjust position
                    "sm:bottom-8 sm:right-8",
                    // Sizing and shape
                    "w-14 h-14 rounded-full",
                    // Styling
                    "bg-gradient-to-tr from-accent-yellow to-yellow-400",
                    "text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]",
                    "flex items-center justify-center text-xl",
                    "transition-all duration-300 hover:scale-110",
                    "border-2 border-white/20",
                    // Pulse when unread
                    unreadCount > 0 && "animate-pulse shadow-[0_0_30px_rgba(250,204,21,0.6)]",
                    // Toggle visibility
                    isOpen ? "opacity-0 pointer-events-none scale-0" : "opacity-100 scale-100"
                )}
            >
                <FontAwesomeIcon icon={faMessage} />
                {/* Unread Badge */}
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-[11px] font-bold text-white flex items-center justify-center ring-2 ring-black shadow-lg animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* FLOATING CARD WIDGET */}
            <div
                className={cn(
                    // Base: Full Screen on Mobile
                    "fixed inset-0 z-[100]",
                    "w-full h-full",
                    "bg-black/80 backdrop-blur-xl", // Darker on mobile for readability
                    "flex flex-col overflow-hidden",
                    // Transition: Slide In from Right
                    "transition-all duration-300 ease-out",

                    // Desktop Overrides (Floating Card)
                    "sm:inset-auto sm:right-4 sm:top-1/2 sm:-translate-y-1/2",
                    "sm:w-[400px] sm:h-[70vh] sm:min-h-[500px]",
                    "sm:rounded-2xl sm:bg-black/60 sm:backdrop-blur-md sm:border sm:border-white/10 sm:shadow-2xl",

                    isOpen
                        ? "translate-x-0 opacity-100"
                        : "translate-x-[120%] opacity-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-white/5 shrink-0">
                    <h3 className="font-bold text-base text-white/90 flex items-center gap-2">
                        <span className="text-yellow-400">●</span>
                        <span>Table Chat</span>
                    </h3>
                    <button
                        onClick={onToggle}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xl" />
                    </button>
                </div>

                {/* Messages Panel */}
                <ChatPanel
                    messages={messages}
                    onSendMessage={sendMessage}
                    className="flex-1"
                />
            </div>
        </>
    );
};
