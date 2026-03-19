import { ThrottlerGuard } from '@nestjs/throttler';
export declare class WsThrottlerGuard extends ThrottlerGuard {
    handleRequest(requestProps: any): Promise<boolean>;
}
