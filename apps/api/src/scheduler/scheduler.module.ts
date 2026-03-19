import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TimerService } from './timer.service';
import { TurnTimerProcessor } from './processors/turn-timer.processor';
import { GameModule } from '../game/game.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'game-turn-timer',
        }),
        forwardRef(() => GameModule),
    ],
    providers: [TimerService, TurnTimerProcessor],
    exports: [TimerService],
})
export class SchedulerModule { }

