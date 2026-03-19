import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import {
    UpdateProfileDto,
    UpdateRoleDto,
    UserListQuery,
    UserResponse,
    TIER_CONFIG,
    TIER_ORDER,
    getNextTier,
    calculateTierFromRake,
    Tier,
    CreateUserDto,
    AdminUpdateUserDto
} from '@poker/shared';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    // ==================== PROFILE (Self) ====================
    async getProfile(userId: string): Promise<UserResponse> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.mapToUserResponse(user);
    }

    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserResponse> {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                bio: dto.bio,
                avatarUrl: dto.avatarUrl,
                avatarId: dto.avatarId,
                accountNumber: dto.accountNumber, // Map DTO 'accountNumber' to DB 'bankAccount'
                iban: dto.iban,
                bankName: dto.bankName,
                accountHolderName: dto.accountHolderName,
            },
            include: { wallet: true },
        });

        return this.mapToUserResponse(user);
    }

    // ==================== SELF-HEALING ====================
    async ensureWalletExists(userId: string): Promise<void> {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            console.warn(`[SELF-HEALING] Wallet missing for user ${userId}. Creating now.`);
            await this.prisma.wallet.create({
                data: {
                    userId,
                    realBalance: 0,
                    bonusBalance: 1000, // Default welcome bonus for existing users without wallet
                },
            });
        }
    }

    // ==================== ADMIN: User Management ====================
    async createUser(dto: CreateUserDto): Promise<UserResponse> {
        // 1. Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email },
                    { username: dto.username },
                ],
            },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email or username already exists');
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 3. Create User & Wallet
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password: hashedPassword,
                role: dto.role as Role,
                wallet: {
                    create: {
                        realBalance: dto.balance || 0,
                        bonusBalance: 0,
                    },
                },
            },
            include: { wallet: true },
        });

        console.log(`[AUDIT] User ${user.id} (${user.username}) created by ADMIN`);

        return this.mapToUserResponse(user);
    }

    async adminUpdateUser(adminId: string, targetUserId: string, dto: AdminUpdateUserDto): Promise<UserResponse> {
        // 1. Check if user exists
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        // 2. Check for duplicate email/username (if being updated)
        if (dto.email || dto.username) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        dto.email ? { email: dto.email } : {},
                        dto.username ? { username: dto.username } : {},
                    ],
                    NOT: { id: targetUserId }, // Ignore self
                },
            });

            if (existingUser) {
                throw new BadRequestException('Username or Email already taken by another user');
            }
        }

        // 3. Update User
        const updatedUser = await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                username: dto.username,
                email: dto.email,
                role: dto.role as Role,
                isBanned: dto.isBanned,
            },
            include: { wallet: true },
        });

        console.log(`[AUDIT] User ${targetUserId} updated by Admin ${adminId}. Banned: ${dto.isBanned ?? 'N/A'}`);

        return this.mapToUserResponse(updatedUser);
    }

    async getUserById(userId: string): Promise<UserResponse> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.mapToUserResponse(user);
    }

    async getAllUsers(query: UserListQuery) {
        const { page, limit, search, role, tier, isBanned, sortBy, order } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) where.role = role as Role;
        if (tier) where.tier = tier;
        if (isBanned !== undefined) where.isBanned = isBanned;

        // Determine sorting
        let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' }; // Default

        if (sortBy === 'balance') {
            orderBy = {
                wallet: {
                    realBalance: order || 'desc', // Default to richest first
                },
            };
        } else if (sortBy) {
            // calculated fields or other simple fields
            orderBy = { [sortBy]: order || 'desc' };
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: { wallet: true },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            users: users.map(u => this.mapToUserResponse(u)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async banUser(adminId: string, targetUserId: string, adminRole: string): Promise<{ message: string }> {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        if (adminRole === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPERADMIN')) {
            throw new ForbiddenException('Admins cannot ban other Admins or Superadmins');
        }

        if (adminRole === 'SUPERADMIN' && targetUser.role === 'SUPERADMIN' && adminId !== targetUserId) {
            throw new ForbiddenException('Superadmins cannot ban other Superadmins');
        }

        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { isBanned: true },
        });

        console.log(`[AUDIT] User ${targetUserId} banned by ${adminId}`);

        return { message: 'User banned successfully' };
    }

    async unbanUser(adminId: string, targetUserId: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { isBanned: false },
        });

        console.log(`[AUDIT] User ${targetUserId} unbanned by ${adminId}`);

        return { message: 'User unbanned successfully' };
    }

    async updateRole(adminId: string, targetUserId: string, dto: UpdateRoleDto): Promise<UserResponse> {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        const user = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { role: dto.role as Role },
            include: { wallet: true },
        });

        console.log(`[AUDIT] User ${targetUserId} role changed to ${dto.role} by ${adminId}`);

        return this.mapToUserResponse(user);
    }

    // ==================== INTERNAL: Rake & Tier ====================
    async addRake(userId: string, amount: number): Promise<{ newTier: Tier; upgraded: boolean }> {
        if (amount <= 0) {
            throw new BadRequestException('Rake amount must be positive');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const currentRake = Number(user.lifetimeRake);
            const newRake = currentRake + amount;
            const oldTier = user.tier as Tier;
            const newTier = calculateTierFromRake(newRake);
            const upgraded = newTier !== oldTier;

            await tx.user.update({
                where: { id: userId },
                data: {
                    lifetimeRake: newRake,
                    tier: newTier,
                },
            });

            if (upgraded) {
                console.log(`[TIER] User ${userId} upgraded from ${oldTier} to ${newTier}`);
            }

            return { newTier, upgraded };
        });

        return result;
    }

    // ==================== Avatar Upload ====================
    async uploadAvatar(userId: string, file: { buffer: Buffer; mimetype: string; size: number }): Promise<{ avatarUrl: string }> {
        // Ensure avatars directory exists
        const avatarsDir = path.join(process.cwd(), 'apps', 'api', 'public', 'avatars');
        if (!fs.existsSync(avatarsDir)) {
            fs.mkdirSync(avatarsDir, { recursive: true });
        }

        // Write file as {userId}.webp (overwrites any existing)
        const filename = `${userId}.webp`;
        const filePath = path.join(avatarsDir, filename);
        fs.writeFileSync(filePath, file.buffer);

        // Cache-busting URL
        const avatarUrl = `/api/avatars/${filename}?t=${Date.now()}`;

        // Update user record
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });

        return { avatarUrl };
    }



    // ==================== HELPERS ====================
    private mapToUserResponse(user: {
        id: string;
        email: string;
        username: string;
        bio?: string | null;
        avatarUrl?: string | null;
        // Handle Prisma vs DTO naming mismatch
        bankAccount?: string | null; // DB field
        accountNumber?: string | null; // DTO field
        bankName?: string | null;
        accountHolderName?: string | null;
        avatarId: string;
        iban?: string | null;
        role: Role;
        tier: string;
        lifetimeRake: any; // Prisma Decimal
        isVerified: boolean;
        isBanned: boolean;
        createdAt: Date;
        wallet?: { realBalance: any; bonusBalance: any } | null;
    }): UserResponse {
        const lifetimeRake = Number(user.lifetimeRake);
        const currentTier = user.tier as Tier;
        const nextTier = getNextTier(currentTier);

        let nextTierProgress = 100;
        let rakeToNextTier = 0;

        if (nextTier) {
            const currentTierMin = TIER_CONFIG[currentTier].minRake;
            const nextTierMin = TIER_CONFIG[nextTier].minRake;
            const progressInTier = lifetimeRake - currentTierMin;
            const tierRange = nextTierMin - currentTierMin;
            nextTierProgress = Math.min(100, Math.floor((progressInTier / tierRange) * 100));
            rakeToNextTier = nextTierMin - lifetimeRake;
        }

        const balance = user.wallet
            ? Number(user.wallet.realBalance) + Number(user.wallet.bonusBalance)
            : 0;

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            bio: user.bio || null,
            avatarUrl: user.avatarUrl || null,
            avatarId: user.avatarId,
            // Map DB bankAccount to DTO accountNumber if needed, or use existing
            accountNumber: user.accountNumber ?? user.bankAccount ?? null,
            bankName: user.bankName || null,
            accountHolderName: user.accountHolderName || null,
            iban: user.iban || null,
            role: user.role as 'USER' | 'ADMIN' | 'SUPERADMIN',
            tier: currentTier,
            lifetimeRake,
            balance,
            isVerified: user.isVerified,
            isBanned: user.isBanned,
            createdAt: user.createdAt.toISOString(),
            nextTier,
            nextTierProgress,
            rakeToNextTier,
        };
    };
}
