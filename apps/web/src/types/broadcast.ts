export type BroadcastPriority = 'info' | 'warning' | 'critical';

export interface BroadcastMessage {
    id: string;
    priority: BroadcastPriority;
    content: string;
    timestamp: Date;
    status: 'pending' | 'delivered';
}
