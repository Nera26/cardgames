import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis.service';

/**
 * Yellow Cable: Stats Processor
 * 
 * Runs every 1 minute to calculate table telemetry metrics.
 * Caches results in Redis for instant Blue Cable retrieval.
 * 
 * This prevents heavy aggregations from blocking the API thread.
 */
@Processor('system-cron')
export class StatsProcessor extends WorkerHost {
    private readonly logger = new Logger(StatsProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        if (job.name !== 'table-stats') {
            return; // Not our job
        }

        this.logger.debug('Running table stats calculation (Yellow Cable)...');
        const startTime = Date.now();

        try {
            const redis = this.redisService.getClient();

            // Get all active tables from Postgres
            const tables = await this.prisma.gameTable.findMany({
                where: { isActive: true },
                select: { id: true, rakePercent: true, rakeCap: true, bigBlind: true },
            });

            for (const table of tables) {
                try {
                    // Calculate metrics from Redis game state
                    const stats = await this.calculateTableStats(table.id, redis);

                    // Cache in Redis with 2-minute TTL (job runs every 1 min)
                    const cacheKey = `admin:table_stats:${table.id}`;
                    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 120);

                    this.logger.debug(`Cached stats for table ${table.id}: ${stats.handsPerHour} H/hr`);
                } catch (error) {
                    this.logger.error(`Failed to calculate stats for table ${table.id}: ${error.message}`);
                }
            }

            const elapsed = Date.now() - startTime;
            this.logger.log(`Table stats calculated for ${tables.length} tables in ${elapsed}ms`);
        } catch (error) {
            this.logger.error(`Stats calculation failed: ${error.message}`);
        }
    }

    private async calculateTableStats(tableId: string, redis: any): Promise<TableStats> {
        // Get table state from Redis
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);

        // Get hand count from Redis (tracked by game engine)
        const handCount = parseInt(tableData?.handNumber || '0', 10);

        // Calculate hands per hour based on table uptime
        // Use firstHandAt (set by next_hand.lua on first hand) for accurate timing
        const firstHandAt = tableData?.firstHandAt
            ? parseInt(tableData.firstHandAt, 10) * 1000 // Redis TIME returns seconds
            : null;

        let handsPerHour = 0;
        if (firstHandAt && handCount > 0) {
            const uptimeHours = Math.max(0.016, (Date.now() - firstHandAt) / (1000 * 60 * 60)); // Min ~1 min
            handsPerHour = Math.round(handCount / uptimeHours);
        }

        // Calculate total rake from Redis counter (accumulated by showdown.lua)
        const totalRake = parseFloat(tableData?.totalRake || '0');

        // Calculate real average pot from accumulated pot history
        const totalPotHistory = parseFloat(tableData?.totalPotHistory || '0');
        const avgPot = handCount > 0 ? Math.round(totalPotHistory / handCount) : 0;

        // Count active players
        let activePlayers = 0;
        const ipAddresses: Record<string, string[]> = {};

        Object.entries(playerData || {}).forEach(([seat, data]) => {
            try {
                const player = JSON.parse(data as string);
                if (player && player.status !== 'empty' && player.userId) {
                    activePlayers++;
                    if (player.ipAddress) {
                        if (!ipAddresses[player.ipAddress]) {
                            ipAddresses[player.ipAddress] = [];
                        }
                        ipAddresses[player.ipAddress].push(player.userId);
                    }
                }
            } catch { }
        });

        // Check for duplicate IPs (potential collusion)
        let securityAlert = false;
        let alertReason: string | undefined;
        for (const [ip, users] of Object.entries(ipAddresses)) {
            if (users.length >= 2) {
                securityAlert = true;
                alertReason = `Duplicate IP: ${ip} (${users.length} players)`;
                break;
            }
        }

        return {
            handsPerHour,
            totalRake,
            avgPot,
            activePlayers,
            totalHands: handCount,
            securityAlert,
            alertReason,
            calculatedAt: new Date().toISOString(),
        };
    }
}

interface TableStats {
    handsPerHour: number;
    totalRake: number;
    avgPot: number;
    activePlayers: number;
    totalHands: number;
    securityAlert: boolean;
    alertReason?: string;
    calculatedAt: string;
}
