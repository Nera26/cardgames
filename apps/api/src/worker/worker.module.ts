import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HandHistoryProcessor } from './processors/hand-history.processor';
import { CashOutProcessor } from './processors/cashout.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'hand-persistence',
        }),
        BullModule.registerQueue({
            name: 'cashout-settlement',
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        }),
        PrismaModule,
        AuditModule,
        WalletModule,
    ],
    providers: [HandHistoryProcessor, CashOutProcessor],
    exports: [BullModule],
})
export class WorkerModule { }
