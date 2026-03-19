import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GameService } from './game.service';
import { AuthenticatedSocket } from '../auth/guards/ws-jwt.guard';
import { LuaRunnerService } from './lua-runner.service';
import { WalletService } from '../wallet/wallet.service';
import { HandEvaluatorService } from './hand-evaluator.service';
import { JoinTableEvent, LeaveTableEvent, BetAction, ToggleSitOutEvent, AddChipsEvent, SubscribeTableEvent } from '@poker/shared';
import { TimerService } from '../scheduler/timer.service';
interface SocketSession {
    tableId: string;
    seat: number;
    userId: string;
}
export declare class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    private readonly luaRunner;
    private readonly walletService;
    private readonly handEvaluator;
    private readonly timerService;
    private readonly jwtService;
    private readonly gameService;
    server: Server;
    private readonly logger;
    private sessions;
    private configSubscriber;
    private autoAdvanceTimers;
    private pendingStart;
    constructor(luaRunner: LuaRunnerService, walletService: WalletService, handEvaluator: HandEvaluatorService, timerService: TimerService, jwtService: JwtService, gameService: GameService);
    afterInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private clearTableTimer;
    private getDynamicTurnTime;
    handleConnection(client: Socket): Promise<void>;
    handleHeartbeat(client: AuthenticatedSocket): Promise<void>;
    getActiveSessions(): Map<string, SocketSession>;
    handleDisconnect(client: Socket): Promise<void>;
    handlePing(client: Socket): {
        event: string;
        data: string;
    };
    handleSubscribeTable(client: AuthenticatedSocket, data: SubscribeTableEvent): Promise<{
        success: boolean;
        message: string;
    }>;
    handleJoinTable(client: AuthenticatedSocket, data: JoinTableEvent): Promise<{
        success: boolean;
        message: string;
    }>;
    handleLeaveTable(client: AuthenticatedSocket, data: LeaveTableEvent): Promise<{
        success: boolean;
        message: string;
    }>;
    handleToggleSitOut(client: AuthenticatedSocket, data: ToggleSitOutEvent): Promise<{
        success: boolean;
        message: string;
        player?: any;
    }>;
    handleAddChips(client: AuthenticatedSocket, data: AddChipsEvent): Promise<{
        success: boolean;
        message: string;
        tableChips?: number;
        walletBalance?: number;
    }>;
    handleAction(client: AuthenticatedSocket, data: BetAction): Promise<{
        success: boolean;
        message: string;
    }>;
    startNewHand(tableId: string): Promise<void>;
    advanceStreet(tableId: string): Promise<void>;
    private handleShowdown;
    broadcastTableState(tableId: string, state: Record<string, unknown>): Promise<void>;
    private filterStateForPlayer;
    getSessionByUserId(userId: string, tableId: string): SocketSession;
}
export {};
