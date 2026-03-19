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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const lua_runner_service_1 = require("./lua-runner.service");
let ReconciliationService = class ReconciliationService {
    constructor(luaRunner) {
        this.luaRunner = luaRunner;
        this.logger = new common_1.Logger('🧹 Reconciliation');
    }
    async onModuleInit() {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
            await this.cleanupStaleTables();
        }
        catch (error) {
            this.logger.error(`Boot reconciliation failed: ${error}`);
        }
    }
    async cleanupStaleTables() {
        const redis = this.luaRunner.getClient();
        const tableIds = new Set();
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'table:*', 'COUNT', '100');
            cursor = nextCursor;
            for (const key of keys) {
                const match = key.match(/^table:([^:]+)/);
                if (match) {
                    const id = match[1];
                    tableIds.add(id);
                }
            }
        } while (cursor !== '0');
        if (tableIds.size === 0) {
            this.logger.log('No active tables found. Clean boot.');
            return;
        }
        this.logger.warn(`Found ${tableIds.size} table(s) in Redis. Starting cleanup...`);
        let totalPlayers = 0;
        let totalChips = 0;
        for (const tableId of tableIds) {
            try {
                const hasPlayers = await redis.exists(`table:${tableId}:players`);
                const result = await this.luaRunner.runScript('force_cleanup', [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                ], []);
                const parsed = JSON.parse(result);
                if (parsed.playersRefunded > 0) {
                    this.logger.warn(`  Table ${tableId}: ${parsed.playersRefunded} player(s) refunded, ` +
                        `${parsed.totalRefunded} chips returned to wallets`);
                    totalPlayers += parsed.playersRefunded;
                    totalChips += parsed.totalRefunded;
                }
                else {
                    this.logger.log(`  Table ${tableId}: already clean (no players)`);
                }
            }
            catch (error) {
                this.logger.error(`  Table ${tableId}: cleanup failed — ${error}`);
            }
        }
        if (totalPlayers > 0) {
            this.logger.warn(`✅ Reconciliation complete: ${totalPlayers} zombie player(s) evicted, ` +
                `${totalChips} total chips refunded across ${tableIds.size} table(s)`);
        }
        else {
            this.logger.log(`✅ Reconciliation complete: all ${tableIds.size} table(s) were already clean`);
        }
    }
};
exports.ReconciliationService = ReconciliationService;
exports.ReconciliationService = ReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lua_runner_service_1.LuaRunnerService])
], ReconciliationService);
//# sourceMappingURL=reconciliation.service.js.map