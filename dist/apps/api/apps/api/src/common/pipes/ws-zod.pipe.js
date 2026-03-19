"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsZodPipe = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
let WsZodPipe = class WsZodPipe {
    constructor(schema) {
        this.schema = schema;
    }
    transform(value, metadata) {
        if (metadata.type !== 'body') {
            return value;
        }
        const result = this.schema.safeParse(value);
        if (!result.success) {
            const formattedErrors = this.formatZodError(result.error);
            throw new websockets_1.WsException({
                event: 'validation_error',
                data: {
                    message: 'Invalid request payload',
                    errors: formattedErrors,
                },
            });
        }
        return result.data;
    }
    formatZodError(error) {
        const formatted = {};
        for (const issue of error.issues) {
            const path = issue.path.join('.') || '_root';
            if (!formatted[path]) {
                formatted[path] = [];
            }
            formatted[path].push(issue.message);
        }
        return formatted;
    }
};
exports.WsZodPipe = WsZodPipe;
exports.WsZodPipe = WsZodPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], WsZodPipe);
//# sourceMappingURL=ws-zod.pipe.js.map