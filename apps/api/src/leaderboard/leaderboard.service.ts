import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    LeaderboardQueryDto,
    LeaderboardPlayerDto,
    LeaderboardResponseDto,
} from '@poker/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LeaderboardService {
    private readonly logger = new Logger(LeaderboardService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardResponseDto> {
        const { timeframe, gameMode, page, limit } = query;
        const skip = (page - 1) * limit;

        // Count total entries for this bucket
        const total = await this.prisma.leaderboardStat.count({
            where: { timeframe, gameMode },
        });

        // Fetch ranked players with joined User data
        const stats = await this.prisma.leaderboardStat.findMany({
            where: { timeframe, gameMode },
            orderBy: { totalWinnings: 'desc' },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        avatarId: true,
                        tier: true,
                    },
                },
            },
        });

        // Map to DTOs with positional rank (offset-aware)
        const players: LeaderboardPlayerDto[] = stats.map((stat, index) => ({
            rank: skip + index + 1,
            userId: stat.user.id,
            username: stat.user.username,
            avatarUrl: stat.user.avatarUrl,
            avatarId: stat.user.avatarId,
            tier: stat.user.tier,
            totalWinnings: stat.totalWinnings instanceof Decimal
                ? stat.totalWinnings.toNumber()
                : Number(stat.totalWinnings),
            gamesPlayed: stat.gamesPlayed,
            gamesWon: stat.gamesWon,
            winRate: stat.winRate instanceof Decimal
                ? stat.winRate.toNumber()
                : Number(stat.winRate),
            timeframe: stat.timeframe,
            gameMode: stat.gameMode,
        }));

        const totalPages = Math.ceil(total / limit);

        this.logger.log(
            `Leaderboard query: ${timeframe}/${gameMode} — page ${page}/${totalPages} (${players.length} players)`,
        );

        return {
            players,
            total,
            page,
            limit,
            totalPages,
            timeframe,
            gameMode,
        };
    }
}
