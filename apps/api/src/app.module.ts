import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { AuditModule } from './audit/audit.module';
import { GameModule } from './game/game.module';
import { BullModule } from '@nestjs/bullmq';
import { SchedulerModule } from './scheduler/scheduler.module';

import { NexusModule } from './nexus/nexus.module';
import { WorkerModule } from './worker/worker.module';
import { CommonModule } from './common/common.module';
import { CronModule } from './cron/cron.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { TournamentModule } from './tournament/tournament.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    EmailModule,
    PrismaModule,
    ConfigModule,
    UserModule,
    WalletModule,
    AuditModule,
    GameModule, // 🔴 Red Cable Engine
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://redis:6379',
      },
    }),
    SchedulerModule, // 🟡 Yellow Cable Manager
    NexusModule,     // 🟡 Yellow Cable (Async Pipeline)
    WorkerModule,    // 🟡 Yellow Cable (Background Tasks)
    CronModule,      // 🟡 Yellow Cable (Scheduled Tasks)
    ChatModule,
    NotificationModule,
    AdminModule,
    LeaderboardModule,  // 🔵 Blue Cable (Leaderboard)
    TournamentModule,   // 🔵 Blue Cable + 🟡 Yellow Cable (Tournament Ecosystem)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
