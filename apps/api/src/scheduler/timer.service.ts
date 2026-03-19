import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class TimerService {
    private readonly logger = new Logger(TimerService.name);
    private readonly redis: Redis;

    constructor(@InjectQueue('game-turn-timer') private readonly timerQueue: Queue) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new Redis(redisUrl);
    }

    /**
     * Schedule a timeout for a player's turn.
     * @param tableId The ID of the table
     * @param seat The seat number of the player
     * @param durationMs The timeout duration in milliseconds
     */
    async scheduleTimeout(tableId: string, seat: number, durationMs: number) {
        // First cancel any existing timeout for this table to be safe
        await this.cancelTimeout(tableId);

        this.logger.debug(`Scheduling turn timeout: Table ${tableId}, Seat ${seat}, Duration ${durationMs}ms`);

        const job = await this.timerQueue.add('turn-timeout',
            { tableId, seat },
            {
                delay: durationMs,
                removeOnComplete: true,
                removeOnFail: true,
                jobId: `timer:${tableId}:${Date.now()}` // Unique ID to track
            }
        );

        // Store the jobId in Redis so we can cancel it later
        await this.redis.set(`timer:job:${tableId}`, job.id!);

        return job.id;
    }

    /**
     * Cancel an existing timeout for a table.
     * @param tableId The ID of the table
     */
    async cancelTimeout(tableId: string) {
        const jobId = await this.redis.get(`timer:job:${tableId}`);
        if (jobId) {
            this.logger.debug(`Cancelling turn timeout: Table ${tableId}, JobID ${jobId}`);
            const job = await this.timerQueue.getJob(jobId);
            if (job) {
                try {
                    await job.remove();
                } catch (error) {
                    this.logger.warn(`Could not remove job ${jobId}: ${error.message}`);
                }
            }
            await this.redis.del(`timer:job:${tableId}`);
        }
    }
}
