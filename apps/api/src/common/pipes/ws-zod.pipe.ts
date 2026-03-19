/**
 * WebSocket Zod Validation Pipe
 * 
 * Validates incoming socket event payloads against Zod schemas.
 * Part of the "Red-Blue Contract" security layer.
 * 
 * @see ARCHITECTURE.md Section 2.1 - The Gateway (Security)
 */

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class WsZodPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        // Only validate message body, not connection metadata
        if (metadata.type !== 'body') {
            return value;
        }

        const result = this.schema.safeParse(value);

        if (!result.success) {
            const formattedErrors = this.formatZodError(result.error);
            console.error(`[WsZodPipe] Validation failed. Raw value:`, JSON.stringify(value), `Errors:`, JSON.stringify(formattedErrors));
            throw new WsException({
                event: 'validation_error',
                data: {
                    message: 'Invalid request payload',
                    errors: formattedErrors,
                },
            });
        }

        return result.data;
    }

    /**
     * Format Zod errors into a user-friendly structure.
     */
    private formatZodError(error: ZodError): Record<string, string[]> {
        const formatted: Record<string, string[]> = {};

        for (const issue of error.issues) {
            const path = issue.path.join('.') || '_root';
            if (!formatted[path]) {
                formatted[path] = [];
            }
            formatted[path].push(issue.message);
        }

        return formatted;
    }
}
