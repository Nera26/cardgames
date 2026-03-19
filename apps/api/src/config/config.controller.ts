import { Body, Controller, Get, Put, Post, Param, UseGuards, Request } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from './config.service';
import { BankConfigDto, bankConfigSchema } from '@poker/shared';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('config')
export class ConfigController {
    constructor(private configService: ConfigService) { }

    @Public()
    @Get('auth')
    getAuthConfig() {
        return this.configService.authConfig;
    }

    @Public()
    @Get('init')
    async getInitConfig() {
        return this.configService.getAllConfigs();
    }

    @Public()
    @Get('bank')
    async getBankConfig() {
        return this.configService.getBankConfig();
    }

    @Put('admin/bank')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async updateBankConfig(@Body(new ZodValidationPipe(bankConfigSchema)) dto: BankConfigDto, @Request() req) {
        return this.configService.updateBankConfig(dto, req.user?.username || 'Admin');
    }

    @Get('admin/bank/history')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async getBankHistory() {
        return this.configService.getBankHistory();
    }

    @Post('admin/bank/restore/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async restoreBankConfig(@Param('id') id: string, @Request() req) {
        return this.configService.restoreBankConfig(id, req.user?.username || 'Admin');
    }
}
