import { Module } from '@nestjs/common';
import { AdminGameController } from './admin-game.controller';
import { AdminSystemController } from './admin-system.controller';
import { GameModule } from '../game/game.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { CronModule } from '../cron/cron.module';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [GameModule, PrismaModule, AuthModule, CommonModule, CronModule, ChatModule],
    controllers: [AdminGameController, AdminSystemController],
})
export class AdminModule { }
