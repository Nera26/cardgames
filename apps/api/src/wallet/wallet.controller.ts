
import { Controller, Get, Post, Body, UseGuards, Request, UsePipes } from '@nestjs/common';
import { WalletService } from './wallet.service';
import {
    DepositDto,
    WithdrawDto,
    LockFundsDto,
    depositSchema,
    withdrawSchema,
    lockFundsSchema
} from '@poker/shared';
// Assuming JwtAuthGuard is available in auth module or shared
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('balance')
    async getBalance(@Request() req: AuthenticatedRequest) {
        return this.walletService.getBalance(req.user.id);
    }

    @Get('transactions')
    async getTransactions(@Request() req: AuthenticatedRequest) {
        // Basic user transaction list (simplified for now, can add query params later)
        return this.walletService.getTransactions(req.user.id, { limit: 20, page: 1 });
    }

    @Post('deposit')
    @UsePipes(new ZodValidationPipe(depositSchema))
    async deposit(@Request() req: AuthenticatedRequest, @Body() dto: DepositDto) {
        return this.walletService.createDepositRequest(req.user.id, dto);
    }

    @Post('withdraw')
    @UsePipes(new ZodValidationPipe(withdrawSchema))
    async withdraw(@Request() req: AuthenticatedRequest, @Body() dto: WithdrawDto) {
        return this.walletService.createWithdrawalRequest(req.user.id, dto);
    }

    @Post('lock')
    @UsePipes(new ZodValidationPipe(lockFundsSchema))
    async lockFunds(@Request() req: AuthenticatedRequest, @Body() dto: LockFundsDto) {
        // In real world, this might be internal only or guarded by specific game service permissions
        // For now, we allow it for testing/game simulation from client if needed, or strictly internal.
        // Keeping it exposed but maybe restricted in future.
        return this.walletService.lockFunds(req.user.id, dto);
    }
}
