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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const zod_validation_pipe_1 = require("../pipes/zod-validation.pipe");
const shared_1 = require("@poker/shared");
let GameController = class GameController {
    constructor(gameService) {
        this.gameService = gameService;
    }
    async getTables(variant, isActive) {
        const filters = {
            variant,
            isActive: isActive === 'false' ? false : true,
        };
        return this.gameService.getTables(filters);
    }
    async getTableById(id) {
        return this.gameService.getTableById(id);
    }
    async createTable(data) {
        return this.gameService.createTable(data);
    }
    async rebuy(req, body) {
        const userId = req.user.id;
        return this.gameService.rebuy(userId, body.tableId, body.amount);
    }
};
exports.GameController = GameController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tables'),
    __param(0, (0, common_1.Query)('variant')),
    __param(1, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getTables", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tables/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getTableById", null);
__decorate([
    (0, common_1.Post)('tables'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.CreateTableSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createTable", null);
__decorate([
    (0, common_1.Post)('rebuy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.RebuySchema)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "rebuy", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)('game'),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameController);
//# sourceMappingURL=game.controller.js.map