import { AuthService } from './auth.service';
import { Request } from 'express';
import type { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '@poker/shared';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: Request): Promise<{
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
    login(dto: LoginDto, req: Request): Promise<{
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
    logout(req: AuthenticatedRequest, refreshToken: string): Promise<{
        message: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(req: AuthenticatedRequest): Promise<{
        id: string;
        username: string;
        createdAt: Date;
        email: string;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.Role;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
