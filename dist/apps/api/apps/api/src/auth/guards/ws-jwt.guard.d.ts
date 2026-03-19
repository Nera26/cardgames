import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
export interface AuthenticatedSocket extends Socket {
    user: {
        id: string;
        email: string;
        username: string;
        role: string;
        avatarId: string;
    };
}
export declare class WsJwtGuard implements CanActivate {
    private jwtService;
    private prisma;
    private readonly logger;
    constructor(jwtService: JwtService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractToken;
}
