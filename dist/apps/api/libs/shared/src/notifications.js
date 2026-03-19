"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationSchema = exports.notificationSchema = exports.NotificationType = void 0;
const zod_1 = require("zod");
var NotificationType;
(function (NotificationType) {
    NotificationType["SYSTEM"] = "SYSTEM";
    NotificationType["TOURNAMENT"] = "TOURNAMENT";
    NotificationType["PERSONAL"] = "PERSONAL";
    NotificationType["BONUS"] = "BONUS";
    NotificationType["ACHIEVEMENT"] = "ACHIEVEMENT";
    NotificationType["ANNOUNCEMENT"] = "ANNOUNCEMENT";
    NotificationType["ALERT"] = "ALERT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
exports.notificationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string().nullable(),
    type: zod_1.z.nativeEnum(NotificationType),
    title: zod_1.z.string(),
    message: zod_1.z.string(),
    isRead: zod_1.z.boolean(),
    metadata: zod_1.z.any().optional(),
    createdAt: zod_1.z.date(),
});
exports.createNotificationSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(NotificationType),
    title: zod_1.z.string(),
    message: zod_1.z.string(),
    metadata: zod_1.z.any().optional(),
});
//# sourceMappingURL=notifications.js.map