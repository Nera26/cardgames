'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationPayload as Notification, NotificationType, WalletBalanceUpdatedPayload, TransactionType } from '@poker/shared';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSound } from './SoundContext';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { playSound } = useSound();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get<Notification[]>('/notifications');
            // Ensure dates are actual Date objects
            const data = res.data.map(n => ({
                ...n,
                createdAt: new Date(n.createdAt)
            }));
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    }, []);

    const handleNewNotification = useCallback((notification: Notification) => {
        const formatted = {
            ...notification,
            createdAt: new Date(notification.createdAt)
        };

        setNotifications(prev => [formatted, ...prev]);

        // Trigger UI cues
        playSound('alert'); // Using alert sound for now

        toast(formatted.title, {
            description: formatted.message,
            action: formatted.metadata?.link ? {
                label: 'View',
                onClick: () => window.location.href = formatted.metadata?.link
            } : undefined
        });
    }, [playSound]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        // Initial fetch
        fetchNotifications();

        const socketInstance = io(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/notifications`,
            {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            }
        );

        socketInstance.on('connect', () => {
            console.log('🟢 [NotificationSocket] Broadcast Socket Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('🔴 [NotificationSocket] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('🔴 [NotificationSocket] Socket Auth/Connection Error:', err.message);
        });

        socketInstance.on('global_alert', (data: Notification) => {
            console.log('[NotificationSocket] Global Alert Received:', data);

            // 🔒 Admin-Only Filter: system alerts (drift, lockdown, auto-heal)
            // should never be shown to regular players.
            const adminOnlyTypes = ['FINANCIAL_DRIFT', 'AUTO_HEAL_COMPLETE', 'LOCKDOWN'];
            const alertType = (data as any)?.type ?? (data as any)?.payload?.type;
            if (adminOnlyTypes.includes(alertType)) {
                // Only show to admins — check cached role from localStorage
                const userJson = localStorage.getItem('user');
                try {
                    const user = userJson ? JSON.parse(userJson) : null;
                    if (user?.role !== 'admin' && user?.role !== 'ADMIN') {
                        console.log('[NotificationSocket] Suppressed admin-only alert for non-admin user');
                        return;
                    }
                } catch { return; }
            }

            handleNewNotification(data);
        });

        socketInstance.on('personal_alert', (data: Notification) => {
            // ── 🔵 BLUE CABLE: WALLET_BALANCE_UPDATED ──
            // Dispatch DOM event for useUser balance refetch, then decide
            // whether to show a toast based on transaction type.
            if ((data as any)?.type === 'WALLET_BALANCE_UPDATED') {
                const walletData = data as unknown as WalletBalanceUpdatedPayload;
                console.log('[NotificationSocket] 💰 WALLET_BALANCE_UPDATED:', walletData);
                window.dispatchEvent(new CustomEvent('wallet:balance_updated', { detail: walletData }));

                // ── Silent Game Actions Filter (Prompt 3) ──
                // BUY_IN, CASH_OUT, RAKE are gameplay transactions — no toast spam.
                const silentTypes: string[] = [
                    TransactionType.BUY_IN,
                    TransactionType.CASH_OUT,
                    TransactionType.RAKE,
                ];
                if (silentTypes.includes(walletData.transactionType)) {
                    return; // Silently update balance, no toast
                }

                // ── 🟣 BROADCAST: Financial Toast (Prompt 2) ──
                // External financial events (DEPOSIT, WITHDRAW, BONUS) get
                // a premium Sonner toast + sound via Purple Cable.
                playSound('alert');
                toast.success(walletData.message, {
                    duration: 5000,
                });
                return;
            }
            console.log('[NotificationSocket] Personal Alert Received:', data);
            handleNewNotification(data);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [fetchNotifications, handleNewNotification]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isConnected,
                markAsRead,
                markAllAsRead,
                fetchNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
