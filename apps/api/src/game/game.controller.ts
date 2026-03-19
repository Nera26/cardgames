/**
 * Game Controller - Blue Cable (REST API)
 * 
 * Table management endpoints for Admin CMS and Lobby.
 * 
 * @see ARCHITECTURE.md Section 2.2 - The Blue Cable
 */

import { Controller, Post, Get, Body, Query, Param, UseGuards, Req, UsePipes } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import {
    CreateTableSchema,
    CreateTableDto,
    TableFiltersSchema,
    TableFiltersDto,
    GameVariant,
    RebuySchema,
    RebuyDto,
} from '@poker/shared';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) { }

    // ============================================================
    // Blue Cable: Table Management (Public + Admin)
    // ============================================================

    /**
     * GET /game/tables - Get all active tables (Public)
     * Used by Lobby to display available games.
     */
    @Public()
    @Get('tables')
    async getTables(
        @Query('variant') variant?: GameVariant,
        @Query('isActive') isActive?: string,
    ) {
        const filters: TableFiltersDto = {
            variant,
            isActive: isActive === 'false' ? false : true,
        };
        return this.gameService.getTables(filters);
    }

    /**
     * GET /game/tables/:id - Get a single table (Public)
     */
    @Public()
    @Get('tables/:id')
    async getTableById(@Param('id') id: string) {
        return this.gameService.getTableById(id);
    }

    /**
     * POST /game/tables/:id/verify-password — Password gate check (no state mutation)
     * Returns { valid: true } if password matches, { valid: false } otherwise.
     * Used by the frontend to validate before routing to the game page.
     */
    @Public()
    @Post('tables/:id/verify-password')
    async verifyPassword(
        @Param('id') id: string,
        @Body() body: { password: string },
    ) {
        const tablePassword = await this.gameService.getTablePassword(id);
        if (!tablePassword) {
            // Public table — no password needed
            return { valid: true };
        }
        return { valid: body.password === tablePassword };
    }

    /**
     * POST /game/tables - Create a new table (Admin only)
     * Protected by JWT + Roles guard.
     */
    @Post('tables')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @UsePipes(new ZodValidationPipe(CreateTableSchema))
    async createTable(@Body() data: CreateTableDto) {
        return this.gameService.createTable(data);
    }

    // ============================================================
    // Red Cable: Rebuy (Authenticated)
    // ============================================================

    @Post('rebuy')
    @UseGuards(JwtAuthGuard)
    @UsePipes(new ZodValidationPipe(RebuySchema))
    async rebuy(
        @Req() req: AuthenticatedRequest,
        @Body() body: RebuyDto,
    ) {
        const userId = req.user.id;
        return this.gameService.rebuy(userId, body.tableId, body.amount);
    }

    // ============================================================
    // Blue Cable: Hand History (Authenticated)
    // ============================================================

    /**
     * GET /game/tables/:tableId/history - Get last 20 hands for this table
     * Protected by JWT. Returns hero-only results (no opponent cards).
     */
    @Get('tables/:tableId/history')
    @UseGuards(JwtAuthGuard)
    async getHandHistory(
        @Param('tableId') tableId: string,
        @Req() req: AuthenticatedRequest,
    ) {
        const userId = req.user.id;
        return this.gameService.getHandHistory(tableId, userId);
    }

    /**
     * GET /game/tables/:tableId/history/:handId - Detailed hand replay
     * Protected by JWT. Returns action log + hero-only results.
     */
    @Get('tables/:tableId/history/:handId')
    @UseGuards(JwtAuthGuard)
    async getHandDetail(
        @Param('handId') handId: string,
        @Req() req: AuthenticatedRequest,
    ) {
        const userId = req.user.id;
        return this.gameService.getHandDetail(handId, userId);
    }

    /**
     * GET /game/my-history - Get user's hand history across ALL tables (PAGINATED)
     * Protected by JWT. Used by Profile page Game History tab.
     * Query: ?page=1&limit=20
     */
    @Get('my-history')
    @UseGuards(JwtAuthGuard)
    async getMyHandHistory(
        @Req() req: AuthenticatedRequest,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.gameService.getMyHandHistory(
            req.user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    /**
     * GET /game/my-stats - Get user's pre-aggregated game stats
     * Protected by JWT. Returns handsPlayed, winRate, tournamentsPlayed, top3Rate.
     */
    @Get('my-stats')
    @UseGuards(JwtAuthGuard)
    async getMyStats(@Req() req: AuthenticatedRequest) {
        return this.gameService.getMyStats(req.user.id);
    }
}

