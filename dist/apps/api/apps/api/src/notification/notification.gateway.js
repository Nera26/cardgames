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
var NotificationGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const ws_jwt_guard_1 = require("../auth/guards/ws-jwt.guard");
let NotificationGateway = NotificationGateway_1 = class NotificationGateway {
    constructor() {
        this.logger = new common_1.Logger(NotificationGateway_1.name);
    }
    afterInit() {
        this.logger.log('Notification Gateway Initialized');
        this.setupRedisSubscriber();
    }
    setupRedisSubscriber() {
        this.subscriber = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
        this.subscriber.subscribe('global_alerts', (err) => {
            if (err)
                this.logger.error('Failed to subscribe to global_alerts', err);
        });
        this.subscriber.psubscribe('user_alerts:*', (err) => {
            if (err)
                this.logger.error('Failed to psubscribe to user_alerts', err);
        });
        this.subscriber.on('message', (channel, message) => {
            if (channel === 'global_alerts') {
                const event = JSON.parse(message);
                this.logger.log('Broadcasting global alert from Redis');
                this.server.emit('global_alert', event.payload);
            }
        });
        this.subscriber.on('pmessage', (pattern, channel, message) => {
            if (pattern === 'user_alerts:*') {
                const event = JSON.parse(message);
                const userId = channel.split(':')[1];
                this.logger.log(`Emitting personal alert to user room: user:${userId}`);
                this.server.to(`user:${userId}`).emit('personal_alert', event.payload);
            }
        });
    }
    handleConnection(client) {
        const user = client.user;
        if (user) {
            this.logger.log(`User ${user.id} connected to notifications`);
            client.join(`user:${user.id}`);
        }
    }
    handleDisconnect(client) {
        this.logger.log('Client disconnected from notifications');
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationGateway.prototype, "handleConnection", null);
exports.NotificationGateway = NotificationGateway = NotificationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/notifications',
        cors: { origin: '*' },
    })
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map