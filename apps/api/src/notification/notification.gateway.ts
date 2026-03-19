import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { GlobalAlertEvent } from '@poker/shared';

@WebSocketGateway({
    namespace: '/notifications',
    cors: { origin: '*' },
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(NotificationGateway.name);
    private subscriber: Redis;

    constructor(private readonly jwtService: JwtService) { }

    afterInit() {
        this.logger.log('Notification Gateway Initialized');
        this.setupRedisSubscriber();
    }

    private setupRedisSubscriber() {
        this.subscriber = new Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });

        // Subscribe to both channels
        this.subscriber.subscribe('global_alerts', (err) => {
            if (err) this.logger.error('Failed to subscribe to global_alerts', err);
        });

        this.subscriber.psubscribe('user_alerts:*', (err) => {
            if (err) this.logger.error('Failed to psubscribe to user_alerts', err);
        });

        this.subscriber.on('message', (channel, message) => {
            if (channel === 'global_alerts') {
                const event: GlobalAlertEvent = JSON.parse(message);
                this.logger.log('Broadcasting global alert from Redis');
                this.server.emit('global_alert', event.payload);
            }
        });

        this.subscriber.on('pmessage', (pattern, channel, message) => {
            if (pattern === 'user_alerts:*') {
                const event: GlobalAlertEvent = JSON.parse(message);
                const userId = channel.split(':')[1];
                this.logger.log(`Emitting personal alert to user room: user:${userId}`);
                this.server.to(`user:${userId}`).emit('personal_alert', event.payload);
            }
        });
    }

    // ════════════════════════════════════════════════════════
    // INLINE JWT AUTH — @UseGuards does NOT work on lifecycle
    // hooks in NestJS, only on @SubscribeMessage handlers.
    // Pattern borrowed from GameGateway.handleConnection.
    // ════════════════════════════════════════════════════════
    async handleConnection(client: Socket) {
        const token =
            client.handshake.auth?.token ||
            client.handshake.query?.token ||
            (client.handshake.headers.authorization?.startsWith('Bearer ')
                ? client.handshake.headers.authorization.substring(7)
                : null);

        if (!token || typeof token !== 'string') {
            this.logger.debug(`Unauthenticated notification connection: ${client.id}`);
            return;
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            });
            const userId = payload.sub;
            this.logger.log(`User ${userId} connected to notifications, joining room user:${userId}`);
            client.join(`user:${userId}`);
        } catch (err) {
            this.logger.warn(`Notification socket auth failed: ${client.id} — ${err instanceof Error ? err.message : 'Unknown'}`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log('Client disconnected from notifications');
    }
}

