import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
    sender: string;
    text: string;
    type: 'PLAYER' | 'SYSTEM';
    timestamp: Date;
    avatar?: string;
    avatarId?: string;
    avatarUrl?: string | null;
}

export const useGameChat = (tableId: string | undefined, token: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const isChatOpenRef = useRef(false);

    useEffect(() => {
        if (!tableId || !token) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Connect to /chat namespace
        const socket = io(`${API_URL}/chat`, {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join_room', { tableId });
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('new_message', (message: ChatMessage) => {
            setMessages((prev) => [...prev, message]);
            // Increment unread count if chat is currently closed
            if (!isChatOpenRef.current) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [tableId, token]);

    const sendMessage = useCallback((text: string) => {
        if (socketRef.current && isConnected && tableId) {
            socketRef.current.emit('send_message', { tableId, text });
        }
    }, [isConnected, tableId]);

    /** Call when chat panel opens to reset unread counter */
    const markAsRead = useCallback(() => {
        setUnreadCount(0);
        isChatOpenRef.current = true;
    }, []);

    /** Call when chat panel closes to start tracking unreads */
    const markAsClosed = useCallback(() => {
        isChatOpenRef.current = false;
    }, []);

    return { messages, sendMessage, isConnected, unreadCount, markAsRead, markAsClosed };
};
