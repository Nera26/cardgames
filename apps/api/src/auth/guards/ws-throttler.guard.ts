import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
    async handleRequest(
        requestProps: any
    ): Promise<boolean> {
        const { context, limit, ttl, throttler } = requestProps;
        const client = context.switchToWs().getClient();

        // Extract IP or ID
        const tracker = client.handshake.address || client.id;

        // Generate the unique key
        const key = this.generateKey(context, tracker, throttler.name);

        const { totalHits } = await this.storageService.increment(
            key,
            ttl,
            limit,
            throttler.blockDuration || 60,
            throttler.name || 'default'
        );

        if (totalHits > limit) {
            throw new WsException('Rate limit exceeded');
        }

        return true;
    }
}
