import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { LuaRunnerService } from './lua-runner.service';
import { HandEvaluatorService } from './hand-evaluator.service';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { ReconciliationService } from './reconciliation.service';
import { PlayerReaperService } from './player-reaper.service';
import { GameController } from './game.controller';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
    imports: [
        PrismaModule,
        WalletModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            signOptions: { expiresIn: '7d' },
        }),
        SchedulerModule,
        BullModule.registerQueue({
            name: 'cashout-settlement',
        }),
    ],
    controllers: [GameController],
    providers: [LuaRunnerService, HandEvaluatorService, GameGateway, WsJwtGuard, GameService, ReconciliationService, PlayerReaperService],
    exports: [LuaRunnerService, GameGateway, GameService],
})
export class GameModule { }

