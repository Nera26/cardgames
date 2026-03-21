'use client';

import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPaperPlane,
    faSpinner,
    faWrench,
    faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { useSystemSound } from '@/hooks/useSystemSound';
import type { BroadcastPriority } from '@/types/broadcast';

// Map to original HTML message types
type MessageType = 'announcement' | 'alert' | 'notice';

interface BroadcastFormProps {
    onBroadcast: (message: string, priority: BroadcastPriority, isUrgent: boolean, playSound: boolean) => void;
    isSubmitting?: boolean;
}

const typeConfig: Record<MessageType, { emoji: string; color: string; label: string; priority: BroadcastPriority }> = {
    announcement: { emoji: '📢', color: 'text-accent-yellow', label: 'ANNOUNCEMENT', priority: 'info' },
    alert: { emoji: '⚠️', color: 'text-danger-red', label: 'ALERT', priority: 'critical' },
    notice: { emoji: 'ℹ️', color: 'text-accent-blue', label: 'NOTICE', priority: 'warning' }
};

const templates = {
    maintenance: 'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
    tournament: 'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!'
};

export default function BroadcastForm({ onBroadcast, isSubmitting = false }: BroadcastFormProps) {
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<MessageType>('announcement');
    const [isUrgent, setIsUrgent] = useState(false);
    const [playSound, setPlaySound] = useState(true);
    const { playPreview } = useSystemSound();
    const MAX_CHARS = 500;

    const config = typeConfig[messageType];

    const handleSubmit = useCallback(() => {
        if (!message.trim() || isSubmitting) return;
        onBroadcast(message.trim(), config.priority, isUrgent, playSound);
        setMessage('');
        setIsUrgent(false);
    }, [message, config.priority, isUrgent, playSound, onBroadcast, isSubmitting]);

    const insertTemplate = useCallback((type: 'maintenance' | 'tournament') => {
        setMessage(templates[type]);
    }, []);

    return (
        <div className="bg-card-bg p-8 rounded-2xl shadow-lg">
            {/* Message Type Selector */}
            <div className="mb-6">
                <label className="block font-semibold mb-3">Message Type</label>
                <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as MessageType)}
                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:shadow-[0_0_20px_rgba(255,215,0,0.3)] outline-none transition-all"
                >
                    <option value="announcement">📢 Announcement</option>
                    <option value="alert">⚠️ Alert</option>
                    <option value="notice">ℹ️ Notice</option>
                </select>
            </div>

            {/* Message Content */}
            <div className="mb-8">
                <label className="block font-semibold mb-3">Message Content</label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Enter your broadcast message here..."
                    className="w-full h-40 bg-primary-bg border border-border-dark rounded-xl px-4 py-3 placeholder-text-secondary focus:border-accent-yellow focus:shadow-[0_0_20px_rgba(255,215,0,0.3)] outline-none resize-none transition-all"
                />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-text-secondary text-sm">
                        Character count: <span className="text-accent-yellow">{message.length}</span>/{MAX_CHARS}
                    </span>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => insertTemplate('maintenance')}
                            className="text-accent-blue text-sm hover:text-blue-400 flex items-center gap-1"
                        >
                            <FontAwesomeIcon icon={faWrench} />
                            Maintenance Template
                        </button>
                        <button
                            type="button"
                            onClick={() => insertTemplate('tournament')}
                            className="text-accent-blue text-sm hover:text-blue-400 flex items-center gap-1"
                        >
                            <FontAwesomeIcon icon={faTrophy} />
                            Tournament Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="mb-8">
                <h3 className="font-semibold mb-3">Preview</h3>
                <div className="bg-primary-bg border border-border-dark rounded-xl p-4 min-h-[80px]">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">{config.emoji}</div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`${config.color} font-semibold text-sm uppercase`}>
                                    {config.label}
                                </span>
                                <span className="text-text-secondary text-xs">• Admin</span>
                            </div>
                            <p className="text-text-secondary">
                                {message || 'Your message will appear here...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Options */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isUrgent}
                            onChange={(e) => setIsUrgent(e.target.checked)}
                            className="w-4 h-4 accent-danger-red rounded"
                        />
                        <span className="text-text-secondary">Mark as urgent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={playSound}
                            onChange={(e) => setPlaySound(e.target.checked)}
                            className="w-4 h-4 accent-accent-yellow rounded"
                        />
                        <span className="text-text-secondary">Play notification sound</span>
                    </label>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || isSubmitting}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${!message.trim() || isSubmitting
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-accent-green hover:shadow-[0_0_20px_rgba(28,139,76,0.3)]'
                        }`}
                >
                    <FontAwesomeIcon
                        icon={isSubmitting ? faSpinner : faPaperPlane}
                        className={isSubmitting ? 'animate-spin' : ''}
                    />
                    {isSubmitting ? 'SENDING...' : 'SEND BROADCAST'}
                </button>
            </div>
        </div>
    );
}
