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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const config_service_1 = require("../config/config.service");
const shared_1 = require("@poker/shared");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const user_service_1 = require("../user/user.service");
const audit_service_1 = require("../audit/audit.service");
let AuthService = class AuthService {
    constructor(prisma, email, jwt, config, userService, audit) {
        this.prisma = prisma;
        this.email = email;
        this.jwt = jwt;
        this.config = config;
        this.userService = userService;
        this.audit = audit;
    }
    async register(dto, ip) {
        if (!this.config.authConfig.allowRegistration) {
            throw new common_1.ForbiddenException('Registration is currently disabled.');
        }
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { username: dto.username }],
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Email or Username already taken');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const { user } = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    username: dto.username,
                    password: hashedPassword,
                    isVerified: true,
                },
            });
            await tx.wallet.create({
                data: {
                    userId: user.id,
                    realBalance: 0,
                    bonusBalance: 1000,
                },
            });
            await this.audit.record({
                userId: user.id,
                action: shared_1.AuditAction.LOGIN,
                payload: { event: 'USER_REGISTERED' },
                ipAddress: ip,
            }, tx);
            return { user };
        });
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                isVerified: user.isVerified,
            }
        };
    }
    async login(dto, ip) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isBanned) {
            throw new common_1.ForbiddenException('Your account has been suspended. Contact support.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.userService.ensureWalletExists(user.id);
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);
        await this.audit.record({
            userId: user.id,
            action: shared_1.AuditAction.LOGIN,
            payload: {},
            ipAddress: ip,
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                isVerified: user.isVerified,
            },
        };
    }
    async logout(userId, refreshToken) {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                token: refreshToken,
            },
        });
        return { message: 'Logged out successfully' };
    }
    async refresh(refreshToken) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (storedToken.expiresAt < new Date()) {
            await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        const accessToken = this.generateAccessToken(storedToken.user);
        const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { message: 'If that email exists, a reset code has been sent.' };
        }
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExp = new Date(Date.now() + 600000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExp,
            },
        });
        await this.email.sendPasswordResetEmail(user.email, resetToken);
        return { message: 'If that email exists, a reset code has been sent.' };
    }
    async resetPassword(code, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: code,
                resetTokenExp: { gte: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExp: null,
            },
        });
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });
        return { message: 'Password reset successfully' };
    }
    generateAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwt.sign(payload);
    }
    async generateRefreshToken(userId) {
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
        return token;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        jwt_1.JwtService,
        config_service_1.ConfigService,
        user_service_1.UserService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map