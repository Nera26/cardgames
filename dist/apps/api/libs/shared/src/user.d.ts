import { z } from 'zod';
export declare const Role: {
    readonly USER: "USER";
    readonly ADMIN: "ADMIN";
    readonly SUPERADMIN: "SUPERADMIN";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const Tier: {
    readonly BRONZE: "BRONZE";
    readonly SILVER: "SILVER";
    readonly GOLD: "GOLD";
    readonly PLATINUM: "PLATINUM";
    readonly DIAMOND: "DIAMOND";
};
export type Tier = (typeof Tier)[keyof typeof Tier];
export declare const TIER_CONFIG: {
    readonly BRONZE: {
        readonly minRake: 0;
        readonly label: "Bronze";
        readonly color: "#CD7F32";
    };
    readonly SILVER: {
        readonly minRake: 250000;
        readonly label: "Silver";
        readonly color: "#C0C0C0";
    };
    readonly GOLD: {
        readonly minRake: 1000000;
        readonly label: "Gold";
        readonly color: "#FFD700";
    };
    readonly PLATINUM: {
        readonly minRake: 5000000;
        readonly label: "Platinum";
        readonly color: "#E5E4E2";
    };
    readonly DIAMOND: {
        readonly minRake: 20000000;
        readonly label: "Diamond";
        readonly color: "#B9F2FF";
    };
};
export declare const TIER_ORDER: Tier[];
export declare function getNextTier(currentTier: Tier): Tier | null;
export declare function calculateTierFromRake(lifetimeRake: number): Tier;
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodString;
    bio: z.ZodNullable<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    avatarId: z.ZodDefault<z.ZodString>;
    role: z.ZodEnum<{
        USER: "USER";
        ADMIN: "ADMIN";
        SUPERADMIN: "SUPERADMIN";
    }>;
    tier: z.ZodEnum<{
        BRONZE: "BRONZE";
        SILVER: "SILVER";
        GOLD: "GOLD";
        PLATINUM: "PLATINUM";
        DIAMOND: "DIAMOND";
    }>;
    lifetimeRake: z.ZodNumber;
    balance: z.ZodDefault<z.ZodNumber>;
    accountNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    iban: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bankName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    accountHolderName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isVerified: z.ZodBoolean;
    isBanned: z.ZodBoolean;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    nextTier: z.ZodNullable<z.ZodEnum<{
        BRONZE: "BRONZE";
        SILVER: "SILVER";
        GOLD: "GOLD";
        PLATINUM: "PLATINUM";
        DIAMOND: "DIAMOND";
    }>>;
    nextTierProgress: z.ZodNumber;
    rakeToNextTier: z.ZodNumber;
}, z.core.$strip>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export declare const updateProfileSchema: z.ZodObject<{
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    avatarId: z.ZodOptional<z.ZodString>;
    accountNumber: z.ZodOptional<z.ZodString>;
    iban: z.ZodOptional<z.ZodString>;
    bankName: z.ZodOptional<z.ZodString>;
    accountHolderName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export declare const updateRoleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        USER: "USER";
        ADMIN: "ADMIN";
        SUPERADMIN: "SUPERADMIN";
    }>;
}, z.core.$strip>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        USER: "USER";
        ADMIN: "ADMIN";
        SUPERADMIN: "SUPERADMIN";
    }>>;
    balance: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export declare const adminUpdateUserSchema: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    isBanned: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;
export declare const userListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        USER: "USER";
        ADMIN: "ADMIN";
        SUPERADMIN: "SUPERADMIN";
    }>>;
    tier: z.ZodOptional<z.ZodEnum<{
        BRONZE: "BRONZE";
        SILVER: "SILVER";
        GOLD: "GOLD";
        PLATINUM: "PLATINUM";
        DIAMOND: "DIAMOND";
    }>>;
    isBanned: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    sortBy: z.ZodOptional<z.ZodEnum<{
        balance: "balance";
        createdAt: "createdAt";
    }>>;
    order: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export declare const userListResponseSchema: z.ZodObject<{
    users: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        username: z.ZodString;
        bio: z.ZodNullable<z.ZodString>;
        avatarUrl: z.ZodNullable<z.ZodString>;
        avatarId: z.ZodDefault<z.ZodString>;
        role: z.ZodEnum<{
            USER: "USER";
            ADMIN: "ADMIN";
            SUPERADMIN: "SUPERADMIN";
        }>;
        tier: z.ZodEnum<{
            BRONZE: "BRONZE";
            SILVER: "SILVER";
            GOLD: "GOLD";
            PLATINUM: "PLATINUM";
            DIAMOND: "DIAMOND";
        }>;
        lifetimeRake: z.ZodNumber;
        balance: z.ZodDefault<z.ZodNumber>;
        accountNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        iban: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bankName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        accountHolderName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isVerified: z.ZodBoolean;
        isBanned: z.ZodBoolean;
        createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        nextTier: z.ZodNullable<z.ZodEnum<{
            BRONZE: "BRONZE";
            SILVER: "SILVER";
            GOLD: "GOLD";
            PLATINUM: "PLATINUM";
            DIAMOND: "DIAMOND";
        }>>;
        nextTierProgress: z.ZodNumber;
        rakeToNextTier: z.ZodNumber;
    }, z.core.$strip>>;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
}, z.core.$strip>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
