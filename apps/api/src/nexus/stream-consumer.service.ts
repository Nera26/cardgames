import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

@Injectable()
export class StreamConsumerService implements OnModuleInit {
    private readonly logger = new Logger(StreamConsumerService.name);
    private redis: Redis;
    private readonly groupName = 'nexus_v1';
    private readonly consumerName = `worker_${os.hostname()}_${uuidv4().substring(0, 8)}`;

    constructor(
        @InjectQueue('hand-persistence') private readonly handPersistenceQueue: Queue,
    ) {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(this.getRedisPort(), 10),
            maxRetriesPerRequest: null, // Required for blocking XREADGROUP
        });
    }

    private getRedisPort(): string {
        return process.env.REDIS_PORT || '6379';
    }

    async onModuleInit() {
        this.logger.log(`Starting StreamConsumer as ${this.consumerName}`);
        // Start the loop without blocking the bootstrap process
        this.consumeLoop().catch(err => {
            this.logger.error('Fatal error in consumeLoop', err);
        });
    }

    private async consumeLoop() {
        this.logger.log('Nexus loop initiated');

        while (true) {
            try {
                // Discovery: Find all table streams
                const streams = await this.redis.keys('stream:table:*');

                if (streams.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                // Ensure group exists for each stream
                for (const stream of streams) {
                    try {
                        await this.redis.xgroup('CREATE', stream, this.groupName, '$', 'MKSTREAM');
                    } catch (err: any) {
                        // BUSYGROUP means it already exists, which is fine
                        if (!err.message.includes('BUSYGROUP')) {
                            this.logger.error(`Error creating group for ${stream}: ${err.message}`);
                        }
                    }
                }

                // Read from streams
                // We use '>' to read only new messages for the group
                const results = await this.redis.xreadgroup(
                    'GROUP', this.groupName, this.consumerName,
                    'COUNT', 1,
                    'BLOCK', 5000,
                    'STREAMS', ...streams, ...streams.map(() => '>')
                ) as any[];

                if (results) {
                    for (const [stream, messages] of results) {
                        for (const [id, fieldPairs] of messages) {
                            const messageFields: Record<string, string> = {};
                            for (let i = 0; i < fieldPairs.length; i += 2) {
                                messageFields[fieldPairs[i]] = fieldPairs[i + 1];
                            }

                            if (messageFields.event === 'hand_ended') {
                                this.logger.log(`Received HAND_END for ${stream} (msg: ${id})`);

                                const tableId = stream.replace('stream:table:', '');

                                // Add to BullMQ
                                await this.handPersistenceQueue.add('archive-hand', {
                                    handId: id, // Hand uniquely identified by Redis Stream ID
                                    tableId,
                                    winners: JSON.parse(messageFields.winners),
                                    pot: parseInt(messageFields.pot, 10),
                                    rake: parseInt(messageFields.rake || '0', 10),
                                    communityCards: JSON.parse(messageFields.communityCards || '[]'),
                                    participants: JSON.parse(messageFields.participants),
                                    actionLog: JSON.parse(messageFields.actionLog || '[]'),
                                    timestamp: parseInt(messageFields.timestamp, 10),
                                }, {
                                    removeOnComplete: true,
                                    attempts: 3,
                                    backoff: {
                                        type: 'exponential',
                                        delay: 1000,
                                    },
                                });

                                // Acknowledge after adding to queue
                                await this.redis.xack(stream, this.groupName, id);
                                this.logger.debug(`Acked message ${id} from ${stream}`);
                            }
                        }
                    }
                }
            } catch (error) {
                this.logger.error(`Error in consumeLoop: ${error}`);
                // Back off on error to avoid tight loops if Redis is down
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
}
