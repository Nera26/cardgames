/**
 * Admin Tournament Controller (Phase 7 - Blue Cable)
 *
 * CRUD endpoints for the Admin Command Center.
 * Secured with JwtAuthGuard + RolesGuard (ADMIN/SUPERADMIN only).
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
    CreateTournamentDto,
    UpdateTournamentDto,
    TournamentListQueryDto,
    createTournamentSchema,
    updateTournamentSchema,
    tournamentListQuerySchema,
} from '@poker/shared';

@Controller('admin/tournaments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminTournamentController {
    constructor(private readonly tournamentService: TournamentService) {}

    @Post()
    async create(
        @Body(new ZodValidationPipe(createTournamentSchema)) dto: CreateTournamentDto,
        @Req() req: any,
    ) {
        const adminId = req.user.id;
        const data = await this.tournamentService.create(dto, adminId);
        return { message: 'Tournament created successfully', data };
    }

    @Get()
    async list(
        @Query(new ZodValidationPipe(tournamentListQuerySchema)) query: TournamentListQueryDto,
    ) {
        const data = await this.tournamentService.listForAdmin(query);
        return { message: 'Success', data };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.tournamentService.findById(id);
        return { message: 'Success', data };
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(updateTournamentSchema)) dto: UpdateTournamentDto,
    ) {
        const data = await this.tournamentService.update(id, dto);
        return { message: 'Tournament updated successfully', data };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.tournamentService.delete(id);
        return { message: 'Tournament deleted successfully' };
    }
}
