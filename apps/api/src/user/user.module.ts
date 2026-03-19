import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService], // Export for use by GameEngine, WalletService, etc.
})
export class UserModule { }
