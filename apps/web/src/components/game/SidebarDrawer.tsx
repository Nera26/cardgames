'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVolumeHigh,
    faPause,
    faDoorOpen,
    faXmark,
    faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

import { ChatPanel } from './ChatPanel';
import { useGameChat } from '@/hooks/useGameChat';

interface SidebarDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSitOut: () => void;
    onLeave: () => void;
    onToggleSound: () => void;
    isSoundOn: boolean;
    tableId: string;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
    isOpen,
    onClose,
    onSitOut,
    onLeave,
    onToggleSound,
    isSoundOn,
    tableId,
}) => {
    const { token } = {
        token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    };
    const { messages, sendMessage } = useGameChat(tableId, token);

    const handleSendMessage = (text: string) => {
        sendMessage(text);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/50 backdrop-blur-sm z-[50] transition-opacity duration-300 lg:hidden',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    'fixed right-0 top-0 h-full w-80 bg-card-bg border-l border-border-color z-[60] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-border-color flex items-center justify-between">
                    <h3 className="font-bold text-lg">Table Menu</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-hover-bg rounded-lg transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xl" />
                    </button>
                </div>

                {/* Chat Section */}
                <div className="flex-1 flex flex-col overflow-hidden border-b border-border-color">
                    <h4 className="font-bold px-4 pt-4 mb-1 text-sm text-text-secondary uppercase tracking-wider">Table Chat</h4>
                    <ChatPanel
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        className="flex-1"
                    />
                </div>

                {/* Quick Actions */}
                <div className="p-4 space-y-3">
                    <h4 className="font-bold mb-1 text-sm text-text-secondary uppercase tracking-wider">Quick Actions</h4>
                    <button
                        onClick={onToggleSound}
                        className="w-full bg-dark-bg hover:bg-hover-bg border border-border-color text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-all active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faVolumeHigh} className={isSoundOn ? 'text-accent-yellow' : 'text-text-secondary'} />
                            <span>Sound {isSoundOn ? 'On' : 'Off'}</span>
                        </div>
                    </button>

                    <button
                        onClick={onSitOut}
                        className="w-full bg-dark-bg hover:bg-hover-bg border border-border-color text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all active:scale-95"
                    >
                        <FontAwesomeIcon icon={faPause} className="text-text-secondary" />
                        <span>Sit Out Next Hand</span>
                    </button>

                    <button
                        onClick={onLeave}
                        className="w-full bg-danger-red/10 hover:bg-danger-red/20 border border-danger-red/30 text-danger-red px-4 py-3 rounded-xl text-sm flex items-center gap-3 font-bold transition-all active:scale-95 mt-4"
                    >
                        <FontAwesomeIcon icon={faDoorOpen} />
                        <span>Leave Table</span>
                    </button>
                </div>
            </div>
        </>
    );
};
