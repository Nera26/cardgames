/**
 * Public Tournament Controller (Phase 7 - Blue Cable)
 *
 * Lobby-facing endpoints for players.
 * GET / returns only public-facing tournament statuses.
 * POST /register handles ACID registration.
 * DELETE /unregister handles pre-start unregistration.
 */

import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
    TournamentListQueryDto,
    RegisterTournamentDto,
    tournamentListQuerySchema,
    registerTournamentSchema,
} from '@poker/shared';

@Controller('tournaments')
export class PublicTournamentController {
    constructor(private readonly tournamentService: TournamentService) {}

    /**
     * Lobby listing — returns only ANNOUNCED, REGISTERING, LATE_REG, RUNNING tournaments
     */
    @Get()
    async list(
        @Query(new ZodValidationPipe(tournamentListQuerySchema)) query: TournamentListQueryDto,
    ) {
        const data = await this.tournamentService.listForLobby(query);
        return { message: 'Success', data };
    }

    /**
     * ACID Registration — deducts buy-in, creates entry
     */
    @Post('register')
    @UseGuards(JwtAuthGuard)
    async register(
        @Body(new ZodValidationPipe(registerTournamentSchema)) dto: RegisterTournamentDto,
        @Req() req: any,
    ) {
        const userId = req.user.id;
        const data = await this.tournamentService.registerPlayer(userId, dto.tournamentId);
        return { message: 'Registration successful', data };
    }

    /**
     * Unregister — refunds buy-in before tournament starts
     */
    @Delete('unregister')
    @UseGuards(JwtAuthGuard)
    async unregister(
        @Body(new ZodValidationPipe(registerTournamentSchema)) dto: RegisterTournamentDto,
        @Req() req: any,
    ) {
        const userId = req.user.id;
        await this.tournamentService.unregisterPlayer(userId, dto.tournamentId);
        return { message: 'Unregistered successfully' };
    }
}
