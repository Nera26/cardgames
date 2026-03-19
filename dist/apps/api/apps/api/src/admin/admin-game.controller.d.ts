import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { AdminTableDto, AdminTableActionDto, GodModeDashboardResponse, UpdateTableConfigDto, TableConfigDetails } from '@poker/shared';
import { GameGateway } from '../game/game.gateway';
export declare class AdminGameController {
    private readonly prisma;
    private readonly redisService;
    private readonly gameGateway;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService, gameGateway: GameGateway);
    getDashboard(): Promise<GodModeDashboardResponse>;
    getInspectorDetails(tableId: string): Promise<{
        tableId: string;
        phase: string;
        handNumber: number;
        pot: number;
        players: any[];
        liveLog: any[];
        chat: any[];
        maxSeats: number;
    }>;
    getTableConfig(tableId: string): Promise<TableConfigDetails>;
    updateTableConfig(tableId: string, dto: UpdateTableConfigDto): Promise<{
        success: boolean;
        updated: any;
    }>;
    forceSave(tableId: string): Promise<{
        success: boolean;
        snapshot: {
            phase: string;
            playerCount: number;
            handNumber: string;
        };
    }>;
    getTables(): Promise<AdminTableDto[]>;
    updateStatus(id: string, dto: AdminTableActionDto): Promise<{
        success: boolean;
        status: string;
    }>;
    mutePlayer(tableId: string, playerId: string, body: {
        durationMinutes?: number;
    }): Promise<{
        success: boolean;
        mutedFor: number;
    }>;
    forceStand(tableId: string, seat: string): Promise<{
        success: boolean;
        message: string;
        removedPlayer?: undefined;
    } | {
        success: boolean;
        removedPlayer: any;
        message?: undefined;
    }>;
    forceSit(tableId: string, body: {
        userId: string;
        seat: number;
        chips?: number;
    }): Promise<{
        success: boolean;
        message: string;
        seat?: undefined;
        chips?: undefined;
    } | {
        success: boolean;
        seat: number;
        chips: number;
        message?: undefined;
    }>;
    broadcast(tableId: string, body: {
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
}
