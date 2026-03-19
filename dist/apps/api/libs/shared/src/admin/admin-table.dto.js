"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTableConfigSchema = exports.AdminTableActionSchema = void 0;
const zod_1 = require("zod");
exports.AdminTableActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['OPEN', 'CLOSE', 'PAUSE']),
});
exports.UpdateTableConfigSchema = zod_1.z.object({
    password: zod_1.z.string().nullable().optional(),
    rakePercent: zod_1.z.number().min(0).max(10).optional(),
    rakeCap: zod_1.z.number().min(0).optional(),
    turnTime: zod_1.z.number().min(10).max(120).optional(),
    timeBank: zod_1.z.number().min(0).max(300).optional(),
    status: zod_1.z.enum(['PAUSED', 'RUNNING']).optional(),
});
//# sourceMappingURL=admin-table.dto.js.map