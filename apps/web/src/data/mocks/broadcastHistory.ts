import { BroadcastMessage } from '@/types/broadcast';

export interface BroadcastHistoryItem extends BroadcastMessage {
    seenCount?: number;
}

export const INITIAL_BROADCAST_HISTORY: BroadcastHistoryItem[] = [
    {
        id: '3',
        priority: 'critical',
        content: 'Server maintenance scheduled for tonight at 2:00 AM EST. Expected downtime: 30 minutes.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'delivered',
        seenCount: 247
    },
    {
        id: '2',
        priority: 'info',
        content: 'New tournament series starting this weekend! $50K guaranteed prize pool. Register now!',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'delivered',
        seenCount: 189
    },
    {
        id: '1',
        priority: 'warning',
        content: 'New rake structure implemented for micro stakes tables. Check the updated rake chart in settings.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'delivered',
        seenCount: 156
    }
];
