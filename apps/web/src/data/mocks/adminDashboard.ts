export type FilterPeriod = 'today' | 'week' | 'month' | 'all';

export interface RevenueData {
    name: string;
    value: number;
    amount: string;
    fill: string;
    [key: string]: string | number;
}

export const REVENUE_CHART_DATA: Record<FilterPeriod, { data: RevenueData[]; total: string; net: string }> = {
    today: {
        data: [
            { name: 'Cash Game Rake', value: 55, amount: '$4,920', fill: '#1c8b4c' },
            { name: 'Tournament Fees', value: 30, amount: '$2,685', fill: '#FFD700' },
            { name: 'Promotions', value: 15, amount: '-$1,342', fill: '#FF4D4F' },
        ],
        total: '$8,947',
        net: '$6,263',
    },
    week: {
        data: [
            { name: 'Cash Game Rake', value: 52, amount: '$17,738', fill: '#1c8b4c' },
            { name: 'Tournament Fees', value: 32, amount: '$10,916', fill: '#FFD700' },
            { name: 'Promotions', value: 16, amount: '-$5,458', fill: '#FF4D4F' },
        ],
        total: '$34,112',
        net: '$23,196',
    },
    month: {
        data: [
            { name: 'Cash Game Rake', value: 58, amount: '$68,617', fill: '#1c8b4c' },
            { name: 'Tournament Fees', value: 28, amount: '$33,125', fill: '#FFD700' },
            { name: 'Promotions', value: 14, amount: '-$16,563', fill: '#FF4D4F' },
        ],
        total: '$118,305',
        net: '$85,179',
    },
    all: {
        data: [
            { name: 'Cash Game Rake', value: 56, amount: '$200,592', fill: '#1c8b4c' },
            { name: 'Tournament Fees', value: 29, amount: '$103,878', fill: '#FFD700' },
            { name: 'Promotions', value: 15, amount: '-$53,730', fill: '#FF4D4F' },
        ],
        total: '$358,200',
        net: '$250,740',
    },
};

export interface ActivityItem {
    id: string;
    type: 'user' | 'table' | 'message';
    title: string;
    subtitle: string;
    status: 'online' | 'pending' | 'completed';
    time: string; // ISO date string or raw mockup string (refactoring to ISO is better but we'll keep it simple first)
}

export const RECENT_ACTIVITIES: ActivityItem[] = [
    {
        id: '1',
        type: 'user',
        title: 'Mike_P',
        subtitle: 'Deposited $500 via QPay',
        status: 'completed',
        time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
    },
    {
        id: '2',
        type: 'message',
        title: 'Sarah_K',
        subtitle: 'Tournament question...',
        status: 'pending',
        time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    },
    {
        id: '3',
        type: 'table',
        title: 'Table #45821',
        subtitle: 'NL Hold\'em • $1/$2 • 9/9 players',
        status: 'online',
        time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
    },
    {
        id: '4',
        type: 'user',
        title: 'Alex_R',
        subtitle: 'Requested withdrawal $750',
        status: 'pending',
        time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    },
    {
        id: '5',
        type: 'table',
        title: 'Table #45822',
        subtitle: 'NL Hold\'em • $2/$5 • 6/9 players',
        status: 'online',
        time: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 min ago
    },
];
