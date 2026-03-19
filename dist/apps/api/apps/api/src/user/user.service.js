"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@poker/shared");
const bcrypt = require("bcrypt");
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapToUserResponse(user);
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                bio: dto.bio,
                avatarUrl: dto.avatarUrl,
                avatarId: dto.avatarId,
                accountNumber: dto.accountNumber,
                iban: dto.iban,
                bankName: dto.bankName,
                accountHolderName: dto.accountHolderName,
            },
            include: { wallet: true },
        });
        return this.mapToUserResponse(user);
    }
    async ensureWalletExists(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            console.warn(`[SELF-HEALING] Wallet missing for user ${userId}. Creating now.`);
            await this.prisma.wallet.create({
                data: {
                    userId,
                    realBalance: 0,
                    bonusBalance: 1000,
                },
            });
        }
    }
    async createUser(dto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email },
                    { username: dto.username },
                ],
            },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email or username already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password: hashedPassword,
                role: dto.role,
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
    async adminUpdateUser(adminId, targetUserId, dto) {
        var _a;
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.email || dto.username) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        dto.email ? { email: dto.email } : {},
                        dto.username ? { username: dto.username } : {},
                    ],
                    NOT: { id: targetUserId },
                },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('Username or Email already taken by another user');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                username: dto.username,
                email: dto.email,
                role: dto.role,
                isBanned: dto.isBanned,
            },
            include: { wallet: true },
        });
        console.log(`[AUDIT] User ${targetUserId} updated by Admin ${adminId}. Banned: ${(_a = dto.isBanned) !== null && _a !== void 0 ? _a : 'N/A'}`);
        return this.mapToUserResponse(updatedUser);
    }
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapToUserResponse(user);
    }
    async getAllUsers(query) {
        const { page, limit, search, role, tier, isBanned, sortBy, order } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role)
            where.role = role;
        if (tier)
            where.tier = tier;
        if (isBanned !== undefined)
            where.isBanned = isBanned;
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'balance') {
            orderBy = {
                wallet: {
                    realBalance: order || 'desc',
                },
            };
        }
        else if (sortBy) {
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
    async banUser(adminId, targetUserId, adminRole) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        if (adminRole === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPERADMIN')) {
            throw new common_1.ForbiddenException('Admins cannot ban other Admins or Superadmins');
        }
        if (adminRole === 'SUPERADMIN' && targetUser.role === 'SUPERADMIN' && adminId !== targetUserId) {
            throw new common_1.ForbiddenException('Superadmins cannot ban other Superadmins');
        }
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { isBanned: true },
        });
        console.log(`[AUDIT] User ${targetUserId} banned by ${adminId}`);
        return { message: 'User banned successfully' };
    }
    async unbanUser(adminId, targetUserId) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { isBanned: false },
        });
        console.log(`[AUDIT] User ${targetUserId} unbanned by ${adminId}`);
        return { message: 'User unbanned successfully' };
    }
    async updateRole(adminId, targetUserId, dto) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const user = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { role: dto.role },
            include: { wallet: true },
        });
        console.log(`[AUDIT] User ${targetUserId} role changed to ${dto.role} by ${adminId}`);
        return this.mapToUserResponse(user);
    }
    async addRake(userId, amount) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Rake amount must be positive');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const currentRake = Number(user.lifetimeRake);
            const newRake = currentRake + amount;
            const oldTier = user.tier;
            const newTier = (0, shared_1.calculateTierFromRake)(newRake);
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
    mapToUserResponse(user) {
        var _a, _b;
        const lifetimeRake = Number(user.lifetimeRake);
        const currentTier = user.tier;
        const nextTier = (0, shared_1.getNextTier)(currentTier);
        let nextTierProgress = 100;
        let rakeToNextTier = 0;
        if (nextTier) {
            const currentTierMin = shared_1.TIER_CONFIG[currentTier].minRake;
            const nextTierMin = shared_1.TIER_CONFIG[nextTier].minRake;
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
            accountNumber: (_b = (_a = user.accountNumber) !== null && _a !== void 0 ? _a : user.bankAccount) !== null && _b !== void 0 ? _b : null,
            bankName: user.bankName || null,
            accountHolderName: user.accountHolderName || null,
            iban: user.iban || null,
            role: user.role,
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
    }
    ;
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map