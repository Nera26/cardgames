
import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletAdminController } from './wallet.admin.controller';
import { WalletService } from './wallet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [PrismaModule, ConfigModule, CommonModule],
    controllers: [WalletController, WalletAdminController],
    providers: [WalletService],
    exports: [WalletService],
})
export class WalletModule { }
