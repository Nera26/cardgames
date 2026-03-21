'use client';

import { useNotifications } from '@/contexts/NotificationContext';
import { formatTimeAgo } from '@/lib/dateUtils';
import { NotificationType } from '@poker/shared';

export default function NotificationsPage() {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.TOURNAMENT: return 'fa-trophy text-accent-yellow';
            case NotificationType.PERSONAL: return 'fa-user text-accent-green';
            case NotificationType.BONUS: return 'fa-gift text-accent-yellow';
            case NotificationType.ACHIEVEMENT: return 'fa-medal text-orange-500';
            case NotificationType.SYSTEM:
            default: return 'fa-bell text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-primary-bg pt-10 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
                        <p className="text-text-secondary italic">Stay updated on the latest action in the Hub.</p>
                    </div>
                    <button
                        onClick={() => markAllAsRead()}
                        className="text-sm text-accent-yellow hover:underline font-semibold"
                    >
                        Mark all as read
                    </button>
                </div>

                <div className="space-y-4">
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => markAsRead(notif.id)}
                                className={`group p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${notif.isRead
                                    ? 'bg-[#1a1a1f]/40 border-[#2e2e32]/30'
                                    : 'bg-[#1a1a1f] border-accent-yellow/30 shadow-[0_0_20px_rgba(255,215,0,0.05)]'
                                    }`}
                            >
                                <div className="flex gap-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[#0e0e11] border border-[#2e2e32]`}>
                                        <i className={`fa-solid ${getIcon(notif.type)}`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold transition-colors ${notif.isRead ? 'text-white/80' : 'text-white group-hover:text-accent-yellow'}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="text-xs text-text-secondary font-medium">
                                                {formatTimeAgo(notif.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-text-secondary/70' : 'text-text-secondary'}`}>
                                            {notif.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-[#1a1a1f]/30 rounded-3xl border border-dashed border-[#2e2e32]">
                            <i className="fa-solid fa-bell-slash text-4xl text-[#2e2e32] mb-4"></i>
                            <p className="text-text-secondary">Your inbox is currently empty.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
