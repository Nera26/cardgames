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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@poker/shared");
let AuditService = AuditService_1 = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async record(data, tx) {
        var _a;
        const validationResult = shared_1.CreateAuditLogSchema.safeParse(data);
        if (!validationResult.success) {
            this.logger.error(`Audit Log Validation Failed: ${JSON.stringify(validationResult.error.format())}`);
            throw new Error(`Audit Log Validation Failed: ${validationResult.error.message}`);
        }
        const validData = validationResult.data;
        const client = tx || this.prisma;
        try {
            await client.auditLog.create({
                data: {
                    userId: validData.userId,
                    action: validData.action,
                    payload: (_a = validData.payload) !== null && _a !== void 0 ? _a : {},
                    ipAddress: validData.ipAddress,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to create audit log`, error);
            throw error;
        }
    }
    async findAll(query) {
        const { page, limit, userId, action } = query;
        const skip = (page - 1) * limit;
        const where = Object.assign(Object.assign({}, (userId && { userId })), (action && { action }));
        const [total, logs] = await Promise.all([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            username: true,
                            email: true,
                        }
                    }
                }
            }),
        ]);
        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map