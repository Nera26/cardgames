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
var StreamConsumerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamConsumerService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const uuid_1 = require("uuid");
const os = require("os");
let StreamConsumerService = StreamConsumerService_1 = class StreamConsumerService {
    constructor(handPersistenceQueue) {
        this.handPersistenceQueue = handPersistenceQueue;
        this.logger = new common_1.Logger(StreamConsumerService_1.name);
        this.groupName = 'nexus_v1';
        this.consumerName = `worker_${os.hostname()}_${(0, uuid_1.v4)().substring(0, 8)}`;
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(this.getRedisPort(), 10),
            maxRetriesPerRequest: null,
        });
    }
    getRedisPort() {
        return process.env.REDIS_PORT || '6379';
    }
    async onModuleInit() {
        this.logger.log(`Starting StreamConsumer as ${this.consumerName}`);
        this.consumeLoop().catch(err => {
            this.logger.error('Fatal error in consumeLoop', err);
        });
    }
    async consumeLoop() {
        this.logger.log('Nexus loop initiated');
        while (true) {
            try {
                const streams = await this.redis.keys('stream:table:*');
                if (streams.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
                for (const stream of streams) {
                    try {
                        await this.redis.xgroup('CREATE', stream, this.groupName, '$', 'MKSTREAM');
                    }
                    catch (err) {
                        if (!err.message.includes('BUSYGROUP')) {
                            this.logger.error(`Error creating group for ${stream}: ${err.message}`);
                        }
                    }
                }
                const results = await this.redis.xreadgroup('GROUP', this.groupName, this.consumerName, 'COUNT', 1, 'BLOCK', 5000, 'STREAMS', ...streams, ...streams.map(() => '>'));
                if (results) {
                    for (const [stream, messages] of results) {
                        for (const [id, fieldPairs] of messages) {
                            const messageFields = {};
                            for (let i = 0; i < fieldPairs.length; i += 2) {
                                messageFields[fieldPairs[i]] = fieldPairs[i + 1];
                            }
                            if (messageFields.event === 'hand_ended') {
                                this.logger.log(`Received HAND_END for ${stream} (msg: ${id})`);
                                const tableId = stream.replace('stream:table:', '');
                                await this.handPersistenceQueue.add('archive-hand', {
                                    handId: id,
                                    tableId,
                                    winners: JSON.parse(messageFields.winners),
                                    pot: parseInt(messageFields.pot, 10),
                                    rake: parseInt(messageFields.rake || '0', 10),
                                    communityCards: JSON.parse(messageFields.communityCards || '[]'),
                                    participants: JSON.parse(messageFields.participants),
                                    timestamp: parseInt(messageFields.timestamp, 10),
                                }, {
                                    removeOnComplete: true,
                                    attempts: 3,
                                    backoff: {
                                        type: 'exponential',
                                        delay: 1000,
                                    },
                                });
                                await this.redis.xack(stream, this.groupName, id);
                                this.logger.debug(`Acked message ${id} from ${stream}`);
                            }
                        }
                    }
                }
            }
            catch (error) {
                this.logger.error(`Error in consumeLoop: ${error}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
};
exports.StreamConsumerService = StreamConsumerService;
exports.StreamConsumerService = StreamConsumerService = StreamConsumerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('hand-persistence')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], StreamConsumerService);
//# sourceMappingURL=stream-consumer.service.js.map