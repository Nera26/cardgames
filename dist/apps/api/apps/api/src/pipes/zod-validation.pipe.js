"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodValidationPipe = void 0;
const common_1 = require("@nestjs/common");
class ZodValidationPipe {
    constructor(schema) {
        this.schema = schema;
    }
    transform(value, metadata) {
        try {
            return this.schema.parse(value);
        }
        catch (error) {
            if (error && typeof error.flatten === 'function') {
                const fieldErrors = error.flatten().fieldErrors;
                const message = Object.entries(fieldErrors)
                    .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                    .join('; ');
                throw new common_1.BadRequestException(message || 'Validation failed');
            }
            throw new common_1.BadRequestException('Validation failed');
        }
    }
}
exports.ZodValidationPipe = ZodValidationPipe;
//# sourceMappingURL=zod-validation.pipe.js.map