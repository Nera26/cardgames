import { Controller, Post, Get, Body, Query, UseGuards, Req, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import type { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '@poker/shared';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@poker/shared';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // ==================== REGISTER ====================
    @Post('register')
    @UsePipes(new ZodValidationPipe(registerSchema))
    async register(@Body() dto: RegisterDto, @Req() req: Request) {
        return this.authService.register(dto, req.ip);
    }

    // ==================== LOGIN ====================
    @Post('login')
    @UsePipes(new ZodValidationPipe(loginSchema))
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login(dto, req.ip);
    }

    // ==================== LOGOUT ====================
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: AuthenticatedRequest, @Body('refreshToken') refreshToken: string) {
        return this.authService.logout(req.user.id, refreshToken);
    }

    // ==================== REFRESH TOKENS ====================
    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }

    // ==================== GET CURRENT USER ====================
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@Req() req: AuthenticatedRequest) {
        return this.authService.getMe(req.user.id);
    }



    // ==================== FORGOT PASSWORD ====================
    @Post('forgot-password')
    @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    // ==================== RESET PASSWORD ====================
    @Post('reset-password')
    @UsePipes(new ZodValidationPipe(resetPasswordSchema))
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }
}
