"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bankHistorySchema = exports.bankConfigSchema = void 0;
const zod_1 = require("zod");
exports.bankConfigSchema = zod_1.z.object({
    iban: zod_1.z.string().min(10, "IBAN is too short").max(34, "IBAN is too long"),
    bic: zod_1.z.string().optional(),
    bankName: zod_1.z.string().min(1, "Bank Name is required"),
    holderName: zod_1.z.string().min(1, "Account Holder Name is required"),
    instructions: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.bankHistorySchema = zod_1.z.object({
    id: zod_1.z.string(),
    date: zod_1.z.string(),
    oldIban: zod_1.z.string(),
    newIban: zod_1.z.string(),
    updatedBy: zod_1.z.string(),
    adminAvatar: zod_1.z.string().optional(),
    notes: zod_1.z.string(),
});
//# sourceMappingURL=config.js.map