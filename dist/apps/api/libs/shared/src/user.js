"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userListResponseSchema = exports.userListQuerySchema = exports.adminUpdateUserSchema = exports.createUserSchema = exports.updateRoleSchema = exports.updateProfileSchema = exports.userResponseSchema = exports.TIER_ORDER = exports.TIER_CONFIG = exports.Tier = exports.Role = void 0;
exports.getNextTier = getNextTier;
exports.calculateTierFromRake = calculateTierFromRake;
const zod_1 = require("zod");
exports.Role = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN',
};
exports.Tier = {
    BRONZE: 'BRONZE',
    SILVER: 'SILVER',
    GOLD: 'GOLD',
    PLATINUM: 'PLATINUM',
    DIAMOND: 'DIAMOND',
};
exports.TIER_CONFIG = {
    BRONZE: { minRake: 0, label: 'Bronze', color: '#CD7F32' },
    SILVER: { minRake: 250000, label: 'Silver', color: '#C0C0C0' },
    GOLD: { minRake: 1000000, label: 'Gold', color: '#FFD700' },
    PLATINUM: { minRake: 5000000, label: 'Platinum', color: '#E5E4E2' },
    DIAMOND: { minRake: 20000000, label: 'Diamond', color: '#B9F2FF' },
};
exports.TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
function getNextTier(currentTier) {
    const currentIndex = exports.TIER_ORDER.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex === exports.TIER_ORDER.length - 1)
        return null;
    return exports.TIER_ORDER[currentIndex + 1];
}
function calculateTierFromRake(lifetimeRake) {
    for (let i = exports.TIER_ORDER.length - 1; i >= 0; i--) {
        const tier = exports.TIER_ORDER[i];
        if (lifetimeRake >= exports.TIER_CONFIG[tier].minRake) {
            return tier;
        }
    }
    return 'BRONZE';
}
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    username: zod_1.z.string(),
    bio: zod_1.z.string().nullable(),
    avatarUrl: zod_1.z.string().nullable(),
    avatarId: zod_1.z.string().default('avatar_1'),
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
    tier: zod_1.z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']),
    lifetimeRake: zod_1.z.number(),
    balance: zod_1.z.number().default(0),
    accountNumber: zod_1.z.string().nullable().optional(),
    iban: zod_1.z.string().nullable().optional(),
    bankName: zod_1.z.string().nullable().optional(),
    accountHolderName: zod_1.z.string().nullable().optional(),
    isVerified: zod_1.z.boolean(),
    isBanned: zod_1.z.boolean(),
    createdAt: zod_1.z.string().or(zod_1.z.date()),
    nextTier: zod_1.z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).nullable(),
    nextTierProgress: zod_1.z.number().min(0).max(100),
    rakeToNextTier: zod_1.z.number(),
});
exports.updateProfileSchema = zod_1.z.object({
    bio: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    avatarId: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
    iban: zod_1.z.string().min(8).max(34).optional(),
    bankName: zod_1.z.string().optional(),
    accountHolderName: zod_1.z.string().optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
});
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']).default('USER'),
    balance: zod_1.z.number().default(0),
});
exports.adminUpdateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.string().optional(),
    isBanned: zod_1.z.boolean().optional(),
});
exports.userListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    tier: zod_1.z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).optional(),
    isBanned: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'balance']).optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.userListResponseSchema = zod_1.z.object({
    users: zod_1.z.array(exports.userResponseSchema),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    limit: zod_1.z.number(),
    totalPages: zod_1.z.number(),
});
//# sourceMappingURL=user.js.map