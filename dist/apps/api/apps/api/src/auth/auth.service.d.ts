import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '../config/config.service';
import { RegisterDto, LoginDto } from '@poker/shared';
import { UserService } from '../user/user.service';
import { AuditService } from '../audit/audit.service';
export declare class AuthService {
    private prisma;
    private email;
    private jwt;
    private config;
    private userService;
    private audit;
    constructor(prisma: PrismaService, email: EmailService, jwt: JwtService, config: ConfigService, userService: UserService, audit: AuditService);
    register(dto: RegisterDto, ip?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            username: string;
            role: import(".prisma/client").$Enums.Role;
            isVerified: boolean;
        };
    }>;
    login(dto: LoginDto, ip?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            username: string;
            role: import(".prisma/client").$Enums.Role;
            isVerified: boolean;
        };
    }>;
    logout(userId: string, refreshToken: string): Promise<{
        message: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        username: string;
        createdAt: Date;
        email: string;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.Role;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(code: string, newPassword: string): Promise<{
        message: string;
    }>;
    private generateAccessToken;
    private generateRefreshToken;
}
