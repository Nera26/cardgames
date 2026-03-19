import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private subscriber;
    afterInit(): void;
    private setupRedisSubscriber;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
}
