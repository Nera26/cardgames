import { z } from 'zod';

// ==================== ENUMS (Mirror Prisma) ====================
export const Role = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Tier = {
    BRONZE: 'BRONZE',
    SILVER: 'SILVER',
    GOLD: 'GOLD',
    PLATINUM: 'PLATINUM',
    DIAMOND: 'DIAMOND',
} as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

// ==================== TIER CONFIG (Single Source of Truth) ====================
// Used by Backend for tier upgrades and Frontend for progress bars
export const TIER_CONFIG = {
    BRONZE: { minRake: 0, label: 'Bronze', color: '#CD7F32' },
    SILVER: { minRake: 250_000, label: 'Silver', color: '#C0C0C0' },
    GOLD: { minRake: 1_000_000, label: 'Gold', color: '#FFD700' },
    PLATINUM: { minRake: 5_000_000, label: 'Platinum', color: '#E5E4E2' },
    DIAMOND: { minRake: 20_000_000, label: 'Diamond', color: '#B9F2FF' },
} as const;

export const TIER_ORDER: Tier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

// Helper to get next tier
export function getNextTier(currentTier: Tier): Tier | null {
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex === TIER_ORDER.length - 1) return null;
    return TIER_ORDER[currentIndex + 1];
}

// Helper to calculate tier from rake amount
export function calculateTierFromRake(lifetimeRake: number): Tier {
    for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
        const tier = TIER_ORDER[i];
        if (lifetimeRake >= TIER_CONFIG[tier].minRake) {
            return tier;
        }
    }
    return 'BRONZE';
}

// ==================== USER RESPONSE DTO ====================
export const userResponseSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    username: z.string(),
    bio: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    avatarId: z.string().default('avatar_1'),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']),
    lifetimeRake: z.number(),
    balance: z.number().default(0), // Flattened from Wallet

    accountNumber: z.string().nullable().optional(),
    iban: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    accountHolderName: z.string().nullable().optional(),
    isVerified: z.boolean(),
    isBanned: z.boolean(),
    createdAt: z.string().or(z.date()),
    // Calculated fields (not stored in DB)
    nextTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).nullable(),
    nextTierProgress: z.number().min(0).max(100), // Percentage to next tier
    rakeToNextTier: z.number(), // MNT remaining to next tier
});

export type UserResponse = z.infer<typeof userResponseSchema>;

// ==================== UPDATE PROFILE DTO ====================
export const updateProfileSchema = z.object({
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().optional().or(z.literal('')),
    avatarId: z.string().optional(),
    accountNumber: z.string().optional(), // Renamed from bankAccount
    iban: z.string().min(8).max(34).optional(),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// ==================== ADMIN: UPDATE ROLE DTO ====================
export const updateRoleSchema = z.object({
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

// ==================== ADMIN: CREATE USER DTO ====================
export const createUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).default('USER'),
    balance: z.number().default(0),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// ==================== ADMIN: UPDATE USER DTO ====================
export const adminUpdateUserSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    role: z.string().optional(), // Relaxed from enum to allow easier admin updates
    isBanned: z.boolean().optional(),
});

export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;

// ==================== USER LIST (Admin) ====================
export const userListQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).optional(),
    isBanned: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'balance']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const userListResponseSchema = z.object({
    users: z.array(userResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
});

export type UserListResponse = z.infer<typeof userListResponseSchema>;
