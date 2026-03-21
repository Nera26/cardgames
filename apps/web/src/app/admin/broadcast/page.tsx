'use client';

import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGlobe,
    faEye,
    faBroadcastTower,
    faUsers,
    faCoins
} from '@fortawesome/free-solid-svg-icons';
import BroadcastForm from '@/components/admin/BroadcastForm';
import { useSystemSound } from '@/hooks/useSystemSound';
import type { BroadcastMessage, BroadcastPriority } from '@/types/broadcast';
import { INITIAL_BROADCAST_HISTORY, BroadcastHistoryItem } from '@/data/mocks/broadcastHistory';
import { formatTimeAgo } from '@/lib/dateUtils';

// Map priority to message types matching original HTML
const messageTypeConfig = {
    info: { emoji: '📢', color: 'text-accent-yellow', label: 'ANNOUNCEMENT' },
    critical: { emoji: '⚠️', color: 'text-danger-red', label: 'ALERT' },
    warning: { emoji: 'ℹ️', color: 'text-accent-blue', label: 'NOTICE' }
};

export default function BroadcastPage() {
    const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistoryItem[]>(INITIAL_BROADCAST_HISTORY);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { playPreview } = useSystemSound();

    const handleBroadcast = useCallback((content: string, priority: BroadcastPriority, isUrgent: boolean, playSound: boolean) => {
        setIsSubmitting(true);

        // Create new broadcast message
        const newMessage: BroadcastHistoryItem = {
            id: Date.now().toString(),
            priority,
            content,
            timestamp: new Date(),
            status: 'pending',
            seenCount: 0
        };

        // Add to history
        setBroadcastHistory(prev => [newMessage, ...prev]);

        // Play the alert sound if enabled
        if (playSound) {
            playPreview(priority);
        }

        // Simulate broadcast sending
        setTimeout(() => {
            setIsSubmitting(false);

            // Update status to delivered and add seen count
            setBroadcastHistory(prev =>
                prev.map(msg =>
                    msg.id === newMessage.id
                        ? { ...msg, status: 'delivered' as const, seenCount: 247 }
                        : msg
                )
            );
        }, 1500);
    }, [playPreview]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <section>
                <h2 className="text-2xl font-bold">Broadcast Tool</h2>
                <p className="text-text-secondary">Send global announcements to all players</p>
            </section>

            {/* Broadcast Form */}
            <section className="max-w-4xl">
                <BroadcastForm onBroadcast={handleBroadcast} isSubmitting={isSubmitting} />
            </section>

            {/* Recent Broadcasts */}
            <section className="mt-8">
                <h3 className="text-xl font-bold mb-4">Recent Broadcasts</h3>
                <div className="space-y-4">
                    {broadcastHistory.map((broadcast) => {
                        const config = messageTypeConfig[broadcast.priority];
                        return (
                            <div
                                key={broadcast.id}
                                className="bg-card-bg p-4 rounded-xl shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="text-xl">{config.emoji}</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`${config.color} font-semibold text-sm uppercase`}>
                                                    {config.label}
                                                </span>
                                                <span className="text-text-secondary text-xs">
                                                    • {formatTimeAgo(broadcast.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-text-primary">{broadcast.content}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-text-secondary text-sm flex-shrink-0">
                                        {broadcast.status === 'pending' ? (
                                            <>
                                                <FontAwesomeIcon icon={faBroadcastTower} className="text-accent-green animate-pulse" />
                                                <span>Broadcasting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faEye} />
                                                <span>{broadcast.seenCount} seen</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
