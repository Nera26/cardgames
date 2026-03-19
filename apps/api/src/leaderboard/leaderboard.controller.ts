import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
    LeaderboardQueryDto,
    leaderboardQuerySchema,
} from '@poker/shared';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) {}

    @Get()
    async getLeaderboard(
        @Query(new ZodValidationPipe(leaderboardQuerySchema)) query: LeaderboardQueryDto,
    ) {
        const data = await this.leaderboardService.getLeaderboard(query);
        return {
            message: 'Success',
            data,
        };
    }
}
