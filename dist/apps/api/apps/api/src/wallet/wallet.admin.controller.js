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
exports.WalletAdminController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const shared_1 = require("@poker/shared");
const zod_validation_pipe_1 = require("../pipes/zod-validation.pipe");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let WalletAdminController = class WalletAdminController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getAllTransactions(query) {
        return this.walletService.adminGetTransactions(query);
    }
    async adjustBalance(dto, req) {
        return this.walletService.adminAdjustBalance(dto, req.user.id);
    }
    async approveDeposit(id, body, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.COMPLETED, body.finalAmount, undefined, req.user.id);
    }
    async rejectDeposit(id, body, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.REJECTED, undefined, body.reason, req.user.id);
    }
    async approveWithdraw(id, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.COMPLETED, undefined, undefined, req.user.id);
    }
    async rejectWithdraw(id, body, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.REJECTED, undefined, body.reason, req.user.id);
    }
};
exports.WalletAdminController = WalletAdminController;
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.adminTransactionQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.Post)('adjustment'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.adminBalanceAdjustmentSchema))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "adjustBalance", null);
__decorate([
    (0, common_1.Post)('deposit/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "approveDeposit", null);
__decorate([
    (0, common_1.Post)('deposit/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "rejectDeposit", null);
__decorate([
    (0, common_1.Post)('withdraw/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "approveWithdraw", null);
__decorate([
    (0, common_1.Post)('withdraw/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "rejectWithdraw", null);
exports.WalletAdminController = WalletAdminController = __decorate([
    (0, common_1.Controller)('admin/wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletAdminController);
//# sourceMappingURL=wallet.admin.controller.js.map