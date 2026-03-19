
import { Controller, Get, Post, Body, UseGuards, Query, Param, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import {
    AdminTransactionQueryDto,
    AdminBalanceAdjustmentDto,
    Role,
    TransactionStatus,
    adminTransactionQuerySchema,
    adminBalanceAdjustmentSchema
} from '@poker/shared';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
// Assuming RolesGuard and Roles decorator
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class WalletAdminController {
    constructor(private readonly walletService: WalletService) { }

    @Get('transactions')
    async getAllTransactions(@Query(new ZodValidationPipe(adminTransactionQuerySchema)) query: AdminTransactionQueryDto) {
        return this.walletService.adminGetTransactions(query);
    }

    @Post('adjustment')
    async adjustBalance(@Body(new ZodValidationPipe(adminBalanceAdjustmentSchema)) dto: AdminBalanceAdjustmentDto, @Request() req: AuthenticatedRequest) {
        return this.walletService.adminAdjustBalance(dto, req.user.id);
    }

    @Post('deposit/:id/approve')
    async approveDeposit(@Param('id') id: string, @Body() body: { finalAmount?: number }, @Request() req: AuthenticatedRequest) {
        return this.walletService.adminProcessTransaction(id, TransactionStatus.COMPLETED, body.finalAmount, undefined, req.user.id);
    }

    @Post('deposit/:id/reject')
    async rejectDeposit(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req: AuthenticatedRequest) {
        return this.walletService.adminProcessTransaction(id, TransactionStatus.REJECTED, undefined, body.reason, req.user.id);
    }

    @Post('withdraw/:id/approve')
    async approveWithdraw(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.walletService.adminProcessTransaction(id, TransactionStatus.COMPLETED, undefined, undefined, req.user.id);
    }

    @Post('withdraw/:id/reject')
    async rejectWithdraw(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req: AuthenticatedRequest) {
        return this.walletService.adminProcessTransaction(id, TransactionStatus.REJECTED, undefined, body.reason, req.user.id);
    }
}
