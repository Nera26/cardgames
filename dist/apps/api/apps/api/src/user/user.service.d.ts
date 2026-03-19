import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UpdateRoleDto, UserListQuery, UserResponse, Tier, CreateUserDto, AdminUpdateUserDto } from '@poker/shared';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<UserResponse>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserResponse>;
    ensureWalletExists(userId: string): Promise<void>;
    createUser(dto: CreateUserDto): Promise<UserResponse>;
    adminUpdateUser(adminId: string, targetUserId: string, dto: AdminUpdateUserDto): Promise<UserResponse>;
    getUserById(userId: string): Promise<UserResponse>;
    getAllUsers(query: UserListQuery): Promise<{
        users: {
            id: string;
            email: string;
            username: string;
            avatarId: string;
            role: "USER" | "ADMIN" | "SUPERADMIN";
            tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
            lifetimeRake: number;
            balance: number;
            isVerified: boolean;
            isBanned: boolean;
            nextTierProgress: number;
            rakeToNextTier: number;
            bio?: string;
            avatarUrl?: string;
            accountNumber?: string;
            iban?: string;
            bankName?: string;
            accountHolderName?: string;
            createdAt?: string | Date;
            nextTier?: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    banUser(adminId: string, targetUserId: string, adminRole: string): Promise<{
        message: string;
    }>;
    unbanUser(adminId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    updateRole(adminId: string, targetUserId: string, dto: UpdateRoleDto): Promise<UserResponse>;
    addRake(userId: string, amount: number): Promise<{
        newTier: Tier;
        upgraded: boolean;
    }>;
    private mapToUserResponse;
}
