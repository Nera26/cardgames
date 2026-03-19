import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StreamConsumerService } from './stream-consumer.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'hand-persistence',
        }),
    ],
    providers: [StreamConsumerService],
})
export class NexusModule { }
