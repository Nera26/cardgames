'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faXmark, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'admin';
    timestamp: Date;
}

interface CustomerServiceChatProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const CustomerServiceChat: React.FC<CustomerServiceChatProps> = ({ isOpen, onToggle }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Welcome to PokerHub Premium Support. How can we assist you today?",
            sender: 'admin',
            timestamp: new Date(Date.now() - 1000 * 60)
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMsg: Message = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue("");
        setIsTyping(true);

        // Simulate admin reply
        setTimeout(() => {
            setIsTyping(false);
            const adminMsg: Message = {
                id: Date.now() + 1,
                text: "I understand. Let me check that for you right away.",
                sender: 'admin',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, adminMsg]);
        }, 2000);
    };

    return (
        <>
            {/* MINI BUTTON (Visible when Closed) */}
            <button
                onClick={onToggle}
                className={cn(
                    "fixed z-[100]",
                    "bottom-28 right-4", // Positioned slightly differently to verify update
                    "sm:bottom-8 sm:right-8",
                    "w-14 h-14 rounded-full",
                    "bg-blue-600 hover:bg-blue-500", // Bright blue for visibility
                    "text-white shadow-lg shadow-blue-900/50",
                    "flex items-center justify-center text-xl",
                    "transition-all duration-300 hover:scale-105",
                    "border-2 border-white/20",
                    isOpen ? "opacity-0 pointer-events-none scale-0" : "opacity-100 scale-100"
                )}
            >
                <FontAwesomeIcon icon={faHeadset} />
            </button>

            {/* FLOATING CARD WIDGET */}
            <div
                className={cn(
                    "fixed inset-0 z-[100]",
                    "w-full h-full",
                    "bg-slate-900/98 backdrop-blur-xl",
                    "flex flex-col overflow-hidden",
                    "transition-all duration-300 ease-out",
                    "sm:inset-auto sm:right-4 sm:top-[unset] sm:bottom-24",
                    "sm:w-[360px] sm:h-[500px]",
                    "sm:rounded-t-xl sm:rounded-b-none sm:border sm:border-slate-700 sm:shadow-2xl",
                    isOpen
                        ? "translate-y-0 opacity-100"
                        : "translate-y-[20px] opacity-0 pointer-events-none sm:translate-y-[20px]"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                <FontAwesomeIcon icon={faHeadset} className="text-blue-400" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-800 rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-sm">Priority Support</h3>
                            <p className="text-[10px] text-slate-400 font-mono">LIVE AGENT CONNECTED</p>
                        </div>
                    </div>
                    <button
                        onClick={onToggle}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                msg.sender === 'user'
                                    ? "ml-auto bg-blue-600 text-white rounded-tr-sm"
                                    : "mr-auto bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm"
                            )}
                        >
                            <p>{msg.text}</p>
                            <span className="text-[10px] opacity-60 mt-1 block text-right" suppressHydrationWarning>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="mr-auto bg-slate-800 text-slate-400 px-4 py-3 rounded-2xl rounded-tl-sm text-xs flex items-center gap-1 w-16">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 bg-slate-900">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};
