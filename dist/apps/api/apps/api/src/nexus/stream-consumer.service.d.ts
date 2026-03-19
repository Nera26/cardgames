import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
export declare class StreamConsumerService implements OnModuleInit {
    private readonly handPersistenceQueue;
    private readonly logger;
    private redis;
    private readonly groupName;
    private readonly consumerName;
    constructor(handPersistenceQueue: Queue);
    private getRedisPort;
    onModuleInit(): Promise<void>;
    private consumeLoop;
}
