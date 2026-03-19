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
var WsJwtGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const prisma_service_1 = require("../../prisma/prisma.service");
let WsJwtGuard = WsJwtGuard_1 = class WsJwtGuard {
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WsJwtGuard_1.name);
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        try {
            const token = this.extractToken(client);
            if (!token) {
                throw new websockets_1.WsException('No authentication token provided');
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    isBanned: true,
                    avatarId: true,
                },
            });
            if (!user) {
                throw new websockets_1.WsException('User not found');
            }
            if (user.isBanned) {
                throw new websockets_1.WsException('Account suspended');
            }
            client.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                avatarId: user.avatarId,
            };
            return true;
        }
        catch (error) {
            this.logger.warn(`WebSocket auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new websockets_1.WsException('Unauthorized');
        }
    }
    extractToken(client) {
        var _a, _b;
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        const token = ((_a = client.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) || ((_b = client.handshake.query) === null || _b === void 0 ? void 0 : _b.token);
        return typeof token === 'string' ? token : null;
    }
};
exports.WsJwtGuard = WsJwtGuard;
exports.WsJwtGuard = WsJwtGuard = WsJwtGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], WsJwtGuard);
//# sourceMappingURL=ws-jwt.guard.js.map