"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TimerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const ioredis_1 = require("ioredis");
let TimerService = TimerService_1 = class TimerService {
    constructor(timerQueue) {
        this.timerQueue = timerQueue;
        this.logger = new common_1.Logger(TimerService_1.name);
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl);
    }
    async scheduleTimeout(tableId, seat, durationMs) {
        await this.cancelTimeout(tableId);
        this.logger.debug(`Scheduling turn timeout: Table ${tableId}, Seat ${seat}, Duration ${durationMs}ms`);
        const job = await this.timerQueue.add('turn-timeout', { tableId, seat }, {
            delay: durationMs,
            removeOnComplete: true,
            removeOnFail: true,
            jobId: `timer:${tableId}:${Date.now()}`
        });
        await this.redis.set(`timer:job:${tableId}`, job.id);
        return job.id;
    }
    async cancelTimeout(tableId) {
        const jobId = await this.redis.get(`timer:job:${tableId}`);
        if (jobId) {
            this.logger.debug(`Cancelling turn timeout: Table ${tableId}, JobID ${jobId}`);
            const job = await this.timerQueue.getJob(jobId);
            if (job) {
                try {
                    await job.remove();
                }
                catch (error) {
                    this.logger.warn(`Could not remove job ${jobId}: ${error.message}`);
                }
            }
            await this.redis.del(`timer:job:${tableId}`);
        }
    }
};
exports.TimerService = TimerService;
exports.TimerService = TimerService = TimerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('game-turn-timer')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], TimerService);
//# sourceMappingURL=timer.service.js.map