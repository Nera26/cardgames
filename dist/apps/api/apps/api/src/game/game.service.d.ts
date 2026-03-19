import { WalletService } from '../wallet/wallet.service';
import { LuaRunnerService } from './lua-runner.service';
import { GameGateway } from './game.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto, LobbyTableDto, TableFiltersDto } from '@poker/shared';
export declare class GameService {
    private readonly walletService;
    private readonly luaRunner;
    private readonly gameGateway;
    private readonly prisma;
    private readonly logger;
    constructor(walletService: WalletService, luaRunner: LuaRunnerService, gameGateway: GameGateway, prisma: PrismaService);
    createTable(data: CreateTableDto): Promise<LobbyTableDto>;
    getTables(filters?: TableFiltersDto): Promise<LobbyTableDto[]>;
    getTableById(id: string): Promise<LobbyTableDto>;
    private getPlayerCount;
    private mapToLobbyTable;
    initializeTableRedis(tableId: string): Promise<void>;
    rebuy(userId: string, tableId: string, amount: number): Promise<{
        success: boolean;
        message: string;
        tableState: any;
    }>;
}
