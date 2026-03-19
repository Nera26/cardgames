import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard, AuthenticatedSocket } from '../auth/guards/ws-jwt.guard';
import { WsThrottlerGuard } from '../auth/guards/ws-throttler.guard';
import { RedisService } from '../common/redis.service';

@WebSocketGateway({
    namespace: '/chat',
    cors: {
        origin: '*',
    },
})
@UseGuards(WsThrottlerGuard)
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(private readonly redisService: RedisService) {}

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_room')
    handleJoinRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { tableId: string },
    ) {
        const room = `table:${data.tableId}`;
        client.join(room);
        this.logger.log(`User ${client.user.username} joined chat room ${room}`);
        return { event: 'joined', room };
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('send_message')
    async handleMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { tableId: string; text: string },
    ) {
        const { tableId, text } = data;

        if (!text || text.trim().length === 0) {
            return;
        }

        const redis = this.redisService.getClient();

        // Check if player is muted by admin
        const muteKey = `mute:${tableId}:${client.user.id}`;
        const isMuted = await redis.get(muteKey);
        if (isMuted) {
            return;
        }

        // Truncate to 200 chars
        const cleanText = text.trim().substring(0, 200);
        const room = `table:${tableId}`;
        const now = new Date();

        const payload = {
            sender: client.user.username,
            text: cleanText,
            type: 'PLAYER',
            timestamp: now,
            avatarId: client.user.avatarId,
            avatarUrl: client.user.avatarUrl,
        };

        // Broadcast to all connected players
        this.server.to(room).emit('new_message', payload);

        // Persist to Redis list for admin Inspector Drawer
        const chatEntry = JSON.stringify({
            message: cleanText,
            time: now.toISOString(),
            user: client.user.username,
            userId: client.user.id,
            avatarId: client.user.avatarId || 'avatar_1',
            avatarUrl: client.user.avatarUrl || null,
        });
        const chatKey = `table:${tableId}:chat`;
        await redis.lpush(chatKey, chatEntry);
        await redis.ltrim(chatKey, 0, 49); // Keep last 50 messages

        this.logger.debug(`Chat message in ${room} from ${client.user.username}: ${cleanText}`);
    }
}
