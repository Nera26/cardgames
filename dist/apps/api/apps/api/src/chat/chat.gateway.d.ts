import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../auth/guards/ws-jwt.guard';
export declare class ChatGateway {
    server: Server;
    private readonly logger;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        tableId: string;
    }): {
        event: string;
        room: string;
    };
    handleMessage(client: AuthenticatedSocket, data: {
        tableId: string;
        text: string;
    }): void;
}
