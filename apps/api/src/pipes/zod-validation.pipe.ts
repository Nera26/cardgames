import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        try {
            return this.schema.parse(value);
        } catch (error: any) {
            // If it's a ZodError, flatten it to get readable messages
            if (error && typeof error.flatten === 'function') {
                const fieldErrors = error.flatten().fieldErrors;
                const message = Object.entries(fieldErrors)
                    .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
                    .join('; ');
                throw new BadRequestException(message || 'Validation failed');
            }
            throw new BadRequestException('Validation failed');
        }
    }
}
