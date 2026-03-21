'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useGameChat';
import { getAvatarUrl } from '@/config/avatars';

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (msg: string) => void;
    className?: string;
    showInput?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    messages,
    onSendMessage,
    className,
    showInput = true
}) => {
    const [inputValue, setInputValue] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn("flex flex-col h-full overflow-hidden", className)}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={`${msg.sender}-${idx}`} className="animate-fade-in">
                        {msg.type === 'SYSTEM' ? (
                            <div className="mx-2 my-1">
                                <div className="relative bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
                                    <div className="flex items-start gap-2.5">
                                        <span className="text-amber-400 text-base mt-0.5 shrink-0">⚡</span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest block mb-1">System Broadcast</span>
                                            <p className="text-sm text-white font-semibold leading-relaxed">{msg.text}</p>
                                        </div>
                                    </div>
                                    {/* Gold accent line */}
                                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                                </div>
                            </div>
                        ) : (
                            <div className="group flex gap-3">
                                {/* Avatar */}
                                <div className="shrink-0 mt-0.5">
                                    <img
                                        src={getAvatarUrl(msg.avatarId, msg.avatarUrl)}
                                        alt={msg.sender}
                                        className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(msg.avatarId); }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn('font-bold text-sm', 'text-cyan-400')}>
                                            {msg.sender}
                                        </span>
                                        <span className="text-xs text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5 hover:bg-white/10 transition-colors">
                                        <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {showInput && (
                <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 text-sm text-white placeholder-white/30 focus:border-yellow-500/50 focus:bg-white/10 outline-none transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className={cn(
                                'absolute right-3 top-1/2 -translate-y-1/2 p-2 transition-all',
                                inputValue.trim()
                                    ? 'text-yellow-500 hover:text-white hover:scale-110'
                                    : 'text-white/10'
                            )}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
