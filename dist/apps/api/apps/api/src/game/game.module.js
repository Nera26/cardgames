"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const lua_runner_service_1 = require("./lua-runner.service");
const hand_evaluator_service_1 = require("./hand-evaluator.service");
const game_gateway_1 = require("./game.gateway");
const game_service_1 = require("./game.service");
const reconciliation_service_1 = require("./reconciliation.service");
const player_reaper_service_1 = require("./player-reaper.service");
const game_controller_1 = require("./game.controller");
const ws_jwt_guard_1 = require("../auth/guards/ws-jwt.guard");
const prisma_module_1 = require("../prisma/prisma.module");
const wallet_module_1 = require("../wallet/wallet.module");
const scheduler_module_1 = require("../scheduler/scheduler.module");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            wallet_module_1.WalletModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
                signOptions: { expiresIn: '7d' },
            }),
            scheduler_module_1.SchedulerModule,
        ],
        controllers: [game_controller_1.GameController],
        providers: [lua_runner_service_1.LuaRunnerService, hand_evaluator_service_1.HandEvaluatorService, game_gateway_1.GameGateway, ws_jwt_guard_1.WsJwtGuard, game_service_1.GameService, reconciliation_service_1.ReconciliationService, player_reaper_service_1.PlayerReaperService],
        exports: [lua_runner_service_1.LuaRunnerService, game_gateway_1.GameGateway, game_service_1.GameService],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map