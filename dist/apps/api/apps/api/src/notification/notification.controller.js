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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../user/guards/roles.guard");
const roles_decorator_1 = require("../user/decorators/roles.decorator");
const common_2 = require("@nestjs/common");
const zod_validation_pipe_1 = require("../pipes/zod-validation.pipe");
const shared_1 = require("@poker/shared");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async getMyNotifications(req, limitGlobal, limitPersonal) {
        return this.notificationService.getNotifications(req.user.id, limitGlobal, limitPersonal);
    }
    async markAsRead(req, id) {
        return this.notificationService.markAsRead(id, req.user.id);
    }
    async markAllAsRead(req) {
        return this.notificationService.markAllAsRead(req.user.id);
    }
    async broadcast(dto) {
        return this.notificationService.sendGlobal(dto.title, dto.message, dto.type, dto.metadata);
    }
    async debugTournament() {
        return this.notificationService.sendGlobal('Tournament Starting', 'Sunday Million starts in 10 minutes!', shared_1.NotificationType.TOURNAMENT, { tournamentId: 'debug-1' });
    }
    async debugPersonal(userId) {
        return this.notificationService.sendPersonal(userId, 'Big Win!', 'You won 500 chips in a showdown!', shared_1.NotificationType.SYSTEM, { amount: 500 });
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limitGlobal')),
    __param(2, (0, common_1.Query)('limitPersonal')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getMyNotifications", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Post)('broadcast'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    (0, common_2.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.createNotificationSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "broadcast", null);
__decorate([
    (0, common_1.Post)('debug/tournament-alert'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "debugTournament", null);
__decorate([
    (0, common_1.Post)('debug/personal-win/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "debugPersonal", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map