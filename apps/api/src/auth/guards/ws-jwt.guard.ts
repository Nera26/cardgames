/**
 * WebSocket JWT Guard
 * 
 * Validates JWT tokens from Socket.io handshake for authentication.
 * Used by GameGateway to protect all socket connections.
 */

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../strategies/jwt.strategy';

export interface AuthenticatedSocket extends Socket {
    user: {
        id: string;
        email: string;
        username: string;
        role: string;
        avatarId: string;
        avatarUrl: string | null;
    };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient<Socket>();

        try {
            const token = this.extractToken(client);

            if (!token) {
                throw new WsException('No authentication token provided');
            }

            const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
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
                    avatarUrl: true,
                },
            });

            if (!user) {
                throw new WsException('User not found');
            }

            if (user.isBanned) {
                throw new WsException('Account suspended');
            }

            // Attach user to socket for use in gateway handlers
            (client as AuthenticatedSocket).user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                avatarId: user.avatarId,
                avatarUrl: user.avatarUrl,
            };

            return true;
        } catch (error) {
            this.logger.warn(`WebSocket auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new WsException('Unauthorized');
        }
    }

    private extractToken(client: Socket): string | null {
        // Try auth header first (preferred)
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Fall back to query param (for browser clients)
        const token = client.handshake.auth?.token || client.handshake.query?.token;
        return typeof token === 'string' ? token : null;
    }
}
