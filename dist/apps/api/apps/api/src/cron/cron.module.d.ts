import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
export declare class CronModule implements OnModuleInit {
    private readonly cronQueue;
    private readonly logger;
    constructor(cronQueue: Queue);
    onModuleInit(): Promise<void>;
}
