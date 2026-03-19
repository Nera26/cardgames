import { Controller, Get, UseGuards, Query, UsePipes } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetAuditLogsQueryDto, GetAuditLogsQuerySchema } from '@poker/shared';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe'; // Assuming this exists as seen in AuthController

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @UsePipes(new ZodValidationPipe(GetAuditLogsQuerySchema))
    async findAll(@Query() query: GetAuditLogsQueryDto) {
        return this.auditService.findAll(query);
    }
}
