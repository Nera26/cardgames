// Admin Mock Data - All static data for the admin dashboard

// =============================================================================
// TYPES
// =============================================================================

import { UserResponse, Role, Tier } from '@poker/shared';

// =============================================================================
// TYPES
// =============================================================================

// Mocking UserResponse for Admin Data
export interface MockUser extends UserResponse {
    // Add extra UI fields if absolutely necessary, or just stick to UserResponse
    country?: string;
    status?: 'active' | 'frozen' | 'banned'; // Legacy status, map to isBanned
}

export type User = MockUser; // Alias for backward compatibility if needed temporarily

export interface Withdrawal {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    date: string;
    status: 'pending' | 'completed' | 'failed';
    bankInfo: string;
}


export interface Tournament {
    id: string;
    name: string;
    gameType: string;
    format: string;
    startDate: string;
    startTime: string;
    buyIn: number;
    fee: number;
    prizePool: number;
    status: 'scheduled' | 'running' | 'finished';
    seatCap?: number;
    rebuyEnabled: boolean;
    addonEnabled: boolean;
}

export interface Bonus {
    id: string;
    name: string;
    type: 'welcome' | 'deposit' | 'rakeback' | 'freeroll' | 'loyalty';
    value: string;
    status: 'active' | 'paused' | 'expired';
    usageCount: number;
    totalClaimed: number;
    expiryDate: string;
}

export interface Transaction {
    id: string;
    date: string;
    action: string;
    amount: number;
    performedBy: 'User' | 'Admin' | 'System';
    notes: string;
    status: 'completed' | 'pending' | 'failed';
}

// =============================================================================
// USERS
// =============================================================================

export const users: User[] = [
    {
        id: '1247',
        username: 'Mike Peterson',
        email: 'mike.p@email.com',
        avatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
        avatarId: 'avatar_2',
        bio: 'Poker enthusiast',
        balance: 2847.50,
        isBanned: false,
        isVerified: true,
        role: 'USER',
        tier: 'GOLD',
        lifetimeRake: 1500000,
        createdAt: new Date('2024-10-15').toISOString(),
        country: 'USA',
        nextTier: 'PLATINUM',
        nextTierProgress: 65,
        rakeToNextTier: 3500000
    },
    {
        id: '1248',
        username: 'Sarah Kim',
        email: 'sarah.k@email.com',
        avatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
        avatarId: 'avatar_1',
        bio: null,
        balance: 1420.75,
        isBanned: false, // status was frozen
        isVerified: true,
        role: 'USER',
        tier: 'SILVER',
        lifetimeRake: 500000,
        createdAt: new Date('2024-11-02').toISOString(),
        country: 'Canada',
        nextTier: 'GOLD',
        nextTierProgress: 45,
        rakeToNextTier: 500000
    },
    {
        id: '1249',
        username: 'Alex Rodriguez',
        email: 'alex.r@email.com',
        avatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
        avatarId: 'avatar_3',
        bio: null,
        balance: 5692.25,
        isBanned: true, // status was banned
        isVerified: true,
        role: 'USER',
        tier: 'PLATINUM',
        lifetimeRake: 8000000,
        createdAt: new Date('2024-09-28').toISOString(),
        country: 'Spain',
        nextTier: 'DIAMOND',
        nextTierProgress: 20,
        rakeToNextTier: 12000000
    },
    {
        id: '1250',
        username: 'Emma Johnson',
        email: 'emma.j@email.com',
        avatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
        avatarId: 'avatar_5',
        bio: null,
        balance: 892.10,
        isBanned: false,
        isVerified: true,
        role: 'USER',
        tier: 'BRONZE',
        lifetimeRake: 100000,
        createdAt: new Date('2024-12-01').toISOString(),
        country: 'UK',
        nextTier: 'SILVER',
        nextTierProgress: 80,
        rakeToNextTier: 150000
    },
    {
        id: '1251',
        username: 'David Chen',
        email: 'david.c@email.com',
        avatarUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
        avatarId: 'avatar_4',
        bio: null,
        balance: 3247.80,
        isBanned: false,
        isVerified: true,
        role: 'USER',
        tier: 'GOLD',
        lifetimeRake: 2500000,
        createdAt: new Date('2024-11-18').toISOString(),
        country: 'China',
        nextTier: 'PLATINUM',
        nextTierProgress: 10,
        rakeToNextTier: 2500000
    },
];

// =============================================================================
// WITHDRAWALS
// =============================================================================

export const pendingWithdrawals: Withdrawal[] = [
    {
        id: 'W-001',
        userId: '#1247',
        userName: 'Mike Peterson',
        userAvatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
        amount: 200.00,
        date: 'Dec 13, 2024',
        status: 'pending',
        bankInfo: '****-****-****-1234',
    },
    {
        id: 'W-002',
        userId: '#1250',
        userName: 'Emma Johnson',
        userAvatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
        amount: 150.00,
        date: 'Dec 14, 2024',
        status: 'pending',
        bankInfo: '****-****-****-5678',
    },
];


// =============================================================================
// TOURNAMENTS
// =============================================================================

export const tournaments: Tournament[] = [
    {
        id: 'TRN-001',
        name: 'Sunday Million',
        gameType: "Texas Hold'em",
        format: 'No Limit',
        startDate: 'Dec 15, 2024',
        startTime: '8:00 PM EST',
        buyIn: 215,
        fee: 15,
        prizePool: 1000000,
        status: 'running',
        rebuyEnabled: false,
        addonEnabled: true,
    },
    {
        id: 'TRN-002',
        name: 'Daily Deepstack',
        gameType: "Texas Hold'em",
        format: 'No Limit',
        startDate: 'Dec 16, 2024',
        startTime: '3:00 PM EST',
        buyIn: 55,
        fee: 5,
        prizePool: 50000,
        status: 'scheduled',
        seatCap: 1000,
        rebuyEnabled: true,
        addonEnabled: true,
    },
    {
        id: 'TRN-003',
        name: 'Turbo Knockout',
        gameType: "Texas Hold'em",
        format: 'Progressive KO',
        startDate: 'Dec 16, 2024',
        startTime: '6:30 PM EST',
        buyIn: 22,
        fee: 2,
        prizePool: 15000,
        status: 'scheduled',
        rebuyEnabled: false,
        addonEnabled: false,
    },
    {
        id: 'TRN-004',
        name: 'Omaha High Roller',
        gameType: 'Pot Limit Omaha',
        format: 'PLO',
        startDate: 'Dec 17, 2024',
        startTime: '7:00 PM EST',
        buyIn: 530,
        fee: 20,
        prizePool: 250000,
        status: 'scheduled',
        seatCap: 500,
        rebuyEnabled: true,
        addonEnabled: true,
    },
    {
        id: 'TRN-005',
        name: 'Micro Stakes MTT',
        gameType: "Texas Hold'em",
        format: 'No Limit',
        startDate: 'Dec 16, 2024',
        startTime: '9:15 PM EST',
        buyIn: 5.50,
        fee: 0.50,
        prizePool: 2500,
        status: 'running',
        rebuyEnabled: true,
        addonEnabled: false,
    },
    {
        id: 'TRN-006',
        name: 'Freeroll Championship',
        gameType: "Texas Hold'em",
        format: 'No Limit',
        startDate: 'Dec 18, 2024',
        startTime: '12:00 PM EST',
        buyIn: 0,
        fee: 0,
        prizePool: 5000,
        status: 'scheduled',
        seatCap: 2000,
        rebuyEnabled: false,
        addonEnabled: false,
    },
];

// =============================================================================
// BONUSES
// =============================================================================

export const bonuses: Bonus[] = [
    {
        id: 'BNS-001',
        name: 'Welcome Bonus',
        type: 'welcome',
        value: '100% up to $500',
        status: 'active',
        usageCount: 1247,
        totalClaimed: 312500,
        expiryDate: 'Dec 31, 2024',
    },
    {
        id: 'BNS-002',
        name: 'Weekly Reload',
        type: 'deposit',
        value: '50% up to $100',
        status: 'active',
        usageCount: 892,
        totalClaimed: 44600,
        expiryDate: 'Ongoing',
    },
    {
        id: 'BNS-003',
        name: 'VIP Rakeback',
        type: 'rakeback',
        value: '25% Rakeback',
        status: 'active',
        usageCount: 156,
        totalClaimed: 78000,
        expiryDate: 'Ongoing',
    },
    {
        id: 'BNS-004',
        name: 'Holiday Freeroll',
        type: 'freeroll',
        value: '$5,000 GTD',
        status: 'paused',
        usageCount: 0,
        totalClaimed: 0,
        expiryDate: 'Dec 25, 2024',
    },
];

// =============================================================================
// SAMPLE TRANSACTIONS (for user history modal)
// =============================================================================

export const sampleTransactions: Record<string, Transaction[]> = {
    'Mike Peterson': [
        { id: 'TXN-001', date: 'Dec 15, 2024 14:32', action: 'Deposit', amount: 500, performedBy: 'User', notes: 'Credit card deposit', status: 'completed' },
        { id: 'TXN-002', date: 'Dec 14, 2024 20:15', action: 'Game Buy-in', amount: -100, performedBy: 'User', notes: "Texas Hold'em - Table #247", status: 'completed' },
        { id: 'TXN-003', date: 'Dec 14, 2024 21:45', action: 'Winnings', amount: 347.50, performedBy: 'System', notes: 'Tournament payout - Event #12', status: 'completed' },
        { id: 'TXN-004', date: 'Dec 13, 2024 16:22', action: 'Withdrawal', amount: -200, performedBy: 'User', notes: 'Bank transfer withdrawal', status: 'pending' },
        { id: 'TXN-005', date: 'Dec 12, 2024 12:10', action: 'Bonus', amount: 50, performedBy: 'Admin', notes: 'Welcome bonus activation', status: 'completed' },
    ],
    'Sarah Kim': [
        { id: 'TXN-006', date: 'Dec 15, 2024 10:00', action: 'Deposit', amount: 300, performedBy: 'User', notes: 'PayPal deposit', status: 'completed' },
    ],
    'Alex Rodriguez': [
        { id: 'TXN-007', date: 'Dec 14, 2024 09:30', action: 'Winnings', amount: 692.25, performedBy: 'System', notes: 'Tournament win', status: 'completed' },
    ],
    'Emma Johnson': [
        { id: 'TXN-008', date: 'Dec 14, 2024 15:00', action: 'Withdrawal', amount: -150, performedBy: 'User', notes: 'Bank transfer withdrawal', status: 'pending' },
    ],
    'David Chen': [
        { id: 'TXN-009', date: 'Dec 13, 2024 11:45', action: 'Admin Add', amount: 200, performedBy: 'Admin', notes: 'Manual adjustment', status: 'completed' },
    ],
};

// =============================================================================
// AUDIT LOGS
// =============================================================================

export interface AuditLog {
    id: string;
    timestamp: string;
    admin: string;
    adminRole: 'admin' | 'superadmin' | 'system';
    affectedUser: string | null;
    actionType: 'add-balance' | 'remove-balance' | 'withdrawal' | 'ban' | 'unban' | 'table-created' | 'settings-change' | 'iban-update' | 'bonus-toggle';
    description: string;
    ipAddress: string;
    status: 'success' | 'warning' | 'failed';
}

export const auditLogs: AuditLog[] = [
    {
        id: 'AUD-001',
        timestamp: '2024-01-15 18:45:32',
        admin: 'SuperAdmin',
        adminRole: 'superadmin',
        affectedUser: 'Mike_P',
        actionType: 'add-balance',
        description: 'Added $500 to user account - Deposit approval',
        ipAddress: '192.168.1.100',
        status: 'success',
    },
    {
        id: 'AUD-002',
        timestamp: '2024-01-15 17:30:15',
        admin: 'Admin_2',
        adminRole: 'admin',
        affectedUser: 'Alex_R',
        actionType: 'withdrawal',
        description: 'Approved withdrawal of $750 to Chase Bank ****1234',
        ipAddress: '10.0.0.50',
        status: 'success',
    },
    {
        id: 'AUD-003',
        timestamp: '2024-01-15 16:20:44',
        admin: 'System',
        adminRole: 'system',
        affectedUser: null,
        actionType: 'table-created',
        description: "Auto-created Table #45823 - NL Hold'em $1/$2",
        ipAddress: 'SYSTEM',
        status: 'success',
    },
    {
        id: 'AUD-004',
        timestamp: '2024-01-15 15:10:22',
        admin: 'SuperAdmin',
        adminRole: 'superadmin',
        affectedUser: 'BadPlayer_X',
        actionType: 'ban',
        description: 'Permanent ban - Multiple violations of ToS',
        ipAddress: '192.168.1.100',
        status: 'success',
    },
    {
        id: 'AUD-005',
        timestamp: '2024-01-15 14:55:18',
        admin: 'Admin_2',
        adminRole: 'admin',
        affectedUser: null,
        actionType: 'settings-change',
        description: 'Max Buy-in changed from $1000 to $2000',
        ipAddress: '10.0.0.50',
        status: 'warning',
    },
    {
        id: 'AUD-006',
        timestamp: '2024-01-15 13:22:07',
        admin: 'System',
        adminRole: 'system',
        affectedUser: 'Sarah_K',
        actionType: 'remove-balance',
        description: 'Failed withdrawal attempt - Insufficient funds',
        ipAddress: 'SYSTEM',
        status: 'failed',
    },
    {
        id: 'AUD-007',
        timestamp: '2024-01-15 12:00:00',
        admin: 'SuperAdmin',
        adminRole: 'superadmin',
        affectedUser: null,
        actionType: 'iban-update',
        description: 'Updated deposit IBAN to DE02 **** 5678',
        ipAddress: '192.168.1.100',
        status: 'success',
    },
    {
        id: 'AUD-008',
        timestamp: '2024-01-14 20:30:45',
        admin: 'Admin_2',
        adminRole: 'admin',
        affectedUser: null,
        actionType: 'bonus-toggle',
        description: 'Paused Holiday Freeroll bonus',
        ipAddress: '10.0.0.50',
        status: 'success',
    },
];

// =============================================================================
// IBAN CONFIGURATION
// =============================================================================

export interface IbanConfig {
    id: string;
    iban: string;
    ibanMasked: string;
    accountHolder: string;
    bankName: string;
    swiftCode: string;
    depositInstructions: string;
    isActive: boolean;
    lastUpdated: string;
    updatedBy: string;
}

export interface IbanHistoryEntry {
    id: string;
    date: string;
    oldIban: string;
    newIban: string;
    updatedBy: string;
    notes: string;
}

export const currentIbanConfig: IbanConfig = {
    id: 'IBAN-001',
    iban: 'DE02500105175407410072',
    ibanMasked: 'DE02 5001 **** **** 0072',
    accountHolder: 'PokerPro Gaming Ltd.',
    bankName: 'Deutsche Bank',
    swiftCode: 'DEUTDEFF',
    depositInstructions: 'Transfer within 15 minutes and upload receipt immediately. Use your username as reference.',
    isActive: true,
    lastUpdated: '2024-01-15 14:30',
    updatedBy: 'Admin_John',
};

export const ibanHistory: IbanHistoryEntry[] = [
    {
        id: 'IBAN-H-001',
        date: '2024-01-15 14:30',
        oldIban: 'DE02 ****1234',
        newIban: 'DE02 ****0072',
        updatedBy: 'Admin_John',
        notes: 'Bank maintenance update',
    },
    {
        id: 'IBAN-H-002',
        date: '2024-01-14 09:15',
        oldIban: 'DE02 ****9876',
        newIban: 'DE02 ****1234',
        updatedBy: 'Admin_Sarah',
        notes: 'Crypto bank cap limit reached',
    },
    {
        id: 'IBAN-H-003',
        date: '2024-01-10 11:00',
        oldIban: 'GB82 ****4321',
        newIban: 'DE02 ****9876',
        updatedBy: 'SuperAdmin',
        notes: 'Switched to German bank for EU compliance',
    },
];

// =============================================================================
// ENHANCED BONUS DATA
// =============================================================================

export interface BonusDetailed {
    id: string;
    name: string;
    type: 'deposit' | 'rakeback' | 'ticket' | 'rebate' | 'first-deposit';
    description: string;
    bonusPercent: number | null;
    maxBonus: number | null;
    wagerRequirement: number;
    expiryDate: string;
    eligibility: 'all' | 'new' | 'vip' | 'active';
    status: 'active' | 'paused' | 'expired';
    totalClaims: number;
    totalPayout: number;
}

export const detailedBonuses: BonusDetailed[] = [
    {
        id: 'BNS-D-001',
        name: 'Welcome Deposit Bonus',
        type: 'deposit',
        description: '100% match bonus up to $500 for new players on their first deposit',
        bonusPercent: 100,
        maxBonus: 500,
        wagerRequirement: 20,
        expiryDate: '2024-12-31',
        eligibility: 'new',
        status: 'active',
        totalClaims: 347,
        totalPayout: 85000,
    },
    {
        id: 'BNS-D-002',
        name: 'Weekly Rakeback',
        type: 'rakeback',
        description: '15% rakeback every Monday for VIP players',
        bonusPercent: 15,
        maxBonus: null,
        wagerRequirement: 0,
        expiryDate: 'Ongoing',
        eligibility: 'vip',
        status: 'active',
        totalClaims: 89,
        totalPayout: 12450,
    },
    {
        id: 'BNS-D-003',
        name: 'Tournament Tickets',
        type: 'ticket',
        description: 'Free $50 tournament entry for completing daily challenges',
        bonusPercent: null,
        maxBonus: 50,
        wagerRequirement: 0,
        expiryDate: '2025-01-15',
        eligibility: 'all',
        status: 'active',
        totalClaims: 156,
        totalPayout: 7800,
    },
    {
        id: 'BNS-D-004',
        name: 'Loyalty Rewards',
        type: 'rebate',
        description: 'Monthly bonus based on total hands played',
        bonusPercent: null,
        maxBonus: 1000,
        wagerRequirement: 10,
        expiryDate: '2025-03-30',
        eligibility: 'active',
        status: 'paused',
        totalClaims: 234,
        totalPayout: 42000,
    },
    {
        id: 'BNS-D-005',
        name: 'First Time Depositor',
        type: 'first-deposit',
        description: '50% bonus on first deposit up to $200',
        bonusPercent: 50,
        maxBonus: 200,
        wagerRequirement: 15,
        expiryDate: '2025-02-28',
        eligibility: 'new',
        status: 'active',
        totalClaims: 421,
        totalPayout: 32100,
    },
];

// Bonus statistics
export const bonusStats = {
    totalActive: 4,
    claimsThisWeek: 89,
    totalPayout: 179350,
    conversionRate: 23.4,
};

