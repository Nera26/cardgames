"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAuditLogsQuerySchema = exports.CreateAuditLogSchema = exports.AuditAction = void 0;
const zod_1 = require("zod");
var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["WALLET_DEPOSIT"] = "WALLET_DEPOSIT";
    AuditAction["WALLET_WITHDRAW"] = "WALLET_WITHDRAW";
    AuditAction["WALLET_TRANSFER"] = "WALLET_TRANSFER";
    AuditAction["WALLET_ADJUSTMENT"] = "WALLET_ADJUSTMENT";
    AuditAction["SETTINGS_CHANGE"] = "SETTINGS_CHANGE";
    AuditAction["HAND_ARCHIVED"] = "HAND_ARCHIVED";
    AuditAction["PLAYER_TIMEOUT"] = "PLAYER_TIMEOUT";
    AuditAction["PLAYER_KICKED"] = "PLAYER_KICKED";
    AuditAction["PLAYER_DISCONNECT"] = "PLAYER_DISCONNECT";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
exports.CreateAuditLogSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid().or(zod_1.z.string().cuid()),
    action: zod_1.z.nativeEnum(AuditAction),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    ipAddress: zod_1.z.string().nullable().optional(),
});
exports.GetAuditLogsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    userId: zod_1.z.string().optional(),
    action: zod_1.z.nativeEnum(AuditAction).optional(),
});
//# sourceMappingURL=audit.js.map