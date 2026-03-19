import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [AuthModule, PrismaModule, CommonModule],
    providers: [ChatGateway],
    exports: [ChatGateway],
})
export class ChatModule { }
