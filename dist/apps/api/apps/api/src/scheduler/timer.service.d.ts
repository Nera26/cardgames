import { Queue } from 'bullmq';
export declare class TimerService {
    private readonly timerQueue;
    private readonly logger;
    private readonly redis;
    constructor(timerQueue: Queue);
    scheduleTimeout(tableId: string, seat: number, durationMs: number): Promise<string>;
    cancelTimeout(tableId: string): Promise<void>;
}
