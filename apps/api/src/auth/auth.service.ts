import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '../config/config.service';
import { RegisterDto, LoginDto, AuditAction } from '@poker/shared';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../user/user.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private email: EmailService,
        private jwt: JwtService,
        private config: ConfigService,
        private userService: UserService,
        private audit: AuditService,
    ) { }

    // ==================== REGISTER ====================
    async register(dto: RegisterDto, ip?: string) {
        if (!this.config.authConfig.allowRegistration) {
            throw new ForbiddenException('Registration is currently disabled.');
        }

        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { username: dto.username }],
            },
        });

        if (existing) {
            throw new ConflictException('Email or Username already taken');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Transaction: Create User + Wallet
        const { user } = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    username: dto.username,
                    password: hashedPassword,
                    isVerified: true, // Auto-verify for MVP
                },
            });

            await tx.wallet.create({
                data: {
                    userId: user.id,
                    realBalance: 0,
                    bonusBalance: 0,
                },
            });

            // Audit Log inside transaction?
            // "Decorate the method to ensure it runs within existing transactions if passed a Prisma client."
            // We can call audit.record passing 'tx'.
            await this.audit.record({
                userId: user.id,
                action: AuditAction.LOGIN, // Register is a form of login/entry.
                // Re-read prompt: "actions (e.g., 'WALLET_DEPOSIT')".
                // Shared schema had: LOGIN, LOGOUT, WALLET_DEPOSIT...
                // Let's us LOGIN for now as register logs you in. Or create a new action if needed.
                // But wait, the shared schema I wrote has limited enum.
                // Let's stick to LOGIN or update schema if I can.
                // I will use LOGIN for registration as it returns tokens.
                payload: { event: 'USER_REGISTERED' },
                ipAddress: ip,
            }, tx);

            return { user };
        });

        // Generate auto-login tokens
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

    // ==================== LOGIN ====================
    async login(dto: LoginDto, ip?: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.isBanned) {
            throw new ForbiddenException('Your account has been suspended. Contact support.');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Self-Healing: Ensure wallet exists before proceeding
        await this.userService.ensureWalletExists(user.id);

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);

        // Audit Log
        await this.audit.record({
            userId: user.id,
            action: AuditAction.LOGIN,
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

    // ==================== LOGOUT ====================
    async logout(userId: string, refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                token: refreshToken,
            },
        });

        return { message: 'Logged out successfully' };
    }

    // ==================== REFRESH TOKENS ====================
    async refresh(refreshToken: string) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (storedToken.expiresAt < new Date()) {
            await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw new UnauthorizedException('Refresh token expired');
        }

        // Delete old token (rotation)
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

        // Generate new tokens
        const accessToken = this.generateAccessToken(storedToken.user);
        const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    // ==================== GET CURRENT USER ====================
    async getMe(userId: string) {
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
            throw new NotFoundException('User not found');
        }

        return user;
    }



    // ==================== FORGOT PASSWORD ====================
    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if email exists
            return { message: 'If that email exists, a reset code has been sent.' };
        }

        // Generate 6-digit code
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExp = new Date(Date.now() + 600000); // 10 minutes

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

    // ==================== RESET PASSWORD ====================
    async resetPassword(code: string, newPassword: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: code,
                resetTokenExp: { gte: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
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

        // Invalidate all refresh tokens for security
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });

        return { message: 'Password reset successfully' };
    }

    // ==================== HELPERS ====================
    private generateAccessToken(user: { id: string; email: string; role: string }) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwt.sign(payload);
    }

    private async generateRefreshToken(userId: string): Promise<string> {
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });

        return token;
    }
}
