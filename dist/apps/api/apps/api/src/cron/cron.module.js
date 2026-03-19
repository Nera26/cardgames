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
var CronModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const cron_service_1 = require("./cron.service");
const audit_processor_1 = require("./processors/audit.processor");
const stats_processor_1 = require("./processors/stats.processor");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let CronModule = CronModule_1 = class CronModule {
    constructor(cronQueue) {
        this.cronQueue = cronQueue;
        this.logger = new common_1.Logger(CronModule_1.name);
    }
    async onModuleInit() {
        this.logger.log('Initializing System Cron repeatable jobs...');
        await this.cronQueue.add('financial-audit', {}, {
            repeat: {
                every: 10 * 60 * 1000,
            },
            removeOnComplete: true,
        });
        this.logger.log('Financial Audit scheduled (Every 10m)');
        await this.cronQueue.add('table-stats', {}, {
            repeat: {
                every: 60 * 1000,
            },
            removeOnComplete: true,
        });
        this.logger.log('Table Stats Worker scheduled (Every 1m) - Yellow Cable');
    }
};
exports.CronModule = CronModule;
exports.CronModule = CronModule = CronModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'system-cron',
            }),
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
        ],
        providers: [cron_service_1.CronService, audit_processor_1.AuditProcessor, stats_processor_1.StatsProcessor],
        exports: [cron_service_1.CronService],
    }),
    __param(0, (0, bullmq_1.InjectQueue)('system-cron')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], CronModule);
//# sourceMappingURL=cron.module.js.map