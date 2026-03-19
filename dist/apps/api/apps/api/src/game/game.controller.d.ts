import { GameService } from './game.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateTableDto, GameVariant, RebuyDto } from '@poker/shared';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    getTables(variant?: GameVariant, isActive?: string): Promise<{
        id: string;
        name: string;
        variant: "TEXAS_HOLDEM" | "OMAHA" | "ALL_IN_OR_FOLD";
        stakes: string;
        players: number;
        maxSeats: number;
        minBuyIn: number;
        maxBuyIn: number;
        isActive: boolean;
        status: string;
        isPrivate: boolean;
        holeCardsCount?: number;
        rakePercent?: number;
    }[]>;
    getTableById(id: string): Promise<{
        id: string;
        name: string;
        variant: "TEXAS_HOLDEM" | "OMAHA" | "ALL_IN_OR_FOLD";
        stakes: string;
        players: number;
        maxSeats: number;
        minBuyIn: number;
        maxBuyIn: number;
        isActive: boolean;
        status: string;
        isPrivate: boolean;
        holeCardsCount?: number;
        rakePercent?: number;
    }>;
    createTable(data: CreateTableDto): Promise<{
        id: string;
        name: string;
        variant: "TEXAS_HOLDEM" | "OMAHA" | "ALL_IN_OR_FOLD";
        stakes: string;
        players: number;
        maxSeats: number;
        minBuyIn: number;
        maxBuyIn: number;
        isActive: boolean;
        status: string;
        isPrivate: boolean;
        holeCardsCount?: number;
        rakePercent?: number;
    }>;
    rebuy(req: AuthenticatedRequest, body: RebuyDto): Promise<{
        success: boolean;
        message: string;
        tableState: any;
    }>;
}
