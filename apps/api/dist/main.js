/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(3);
const app_controller_1 = __webpack_require__(4);
const app_service_1 = __webpack_require__(5);
const auth_module_1 = __webpack_require__(7);
const email_module_1 = __webpack_require__(42);
const prisma_module_1 = __webpack_require__(41);
const config_module_1 = __webpack_require__(49);
const user_module_1 = __webpack_require__(43);
const wallet_module_1 = __webpack_require__(53);
const audit_module_1 = __webpack_require__(58);
const game_module_1 = __webpack_require__(60);
const bullmq_1 = __webpack_require__(76);
const scheduler_module_1 = __webpack_require__(82);
const nexus_module_1 = __webpack_require__(84);
const worker_module_1 = __webpack_require__(87);
const common_module_1 = __webpack_require__(89);
const cron_module_1 = __webpack_require__(91);
const chat_module_1 = __webpack_require__(95);
const notification_module_1 = __webpack_require__(97);
const throttler_1 = __webpack_require__(70);
const admin_module_1 = __webpack_require__(101);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            email_module_1.EmailModule,
            prisma_module_1.PrismaModule,
            config_module_1.ConfigModule,
            user_module_1.UserModule,
            wallet_module_1.WalletModule,
            audit_module_1.AuditModule,
            game_module_1.GameModule,
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            bullmq_1.BullModule.forRoot({
                connection: {
                    url: process.env.REDIS_URL || 'redis://redis:6379',
                },
            }),
            scheduler_module_1.SchedulerModule,
            nexus_module_1.NexusModule,
            worker_module_1.WorkerModule,
            cron_module_1.CronModule,
            chat_module_1.ChatModule,
            notification_module_1.NotificationModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const common_1 = __webpack_require__(3);
const app_service_1 = __webpack_require__(5);
const public_decorator_1 = __webpack_require__(6);
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
exports.AppController = AppController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const common_1 = __webpack_require__(3);
let AppService = class AppService {
    getHello() {
        return 'Hello World!';
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = __webpack_require__(3);
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;


/***/ }),
/* 7 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const common_1 = __webpack_require__(3);
const jwt_1 = __webpack_require__(8);
const passport_1 = __webpack_require__(9);
const auth_service_1 = __webpack_require__(10);
const auth_controller_1 = __webpack_require__(36);
const prisma_module_1 = __webpack_require__(41);
const email_module_1 = __webpack_require__(42);
const user_module_1 = __webpack_require__(43);
const jwt_strategy_1 = __webpack_require__(47);
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            email_module_1.EmailModule,
            user_module_1.UserModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
                signOptions: { expiresIn: '15m' },
            }),
        ],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule],
    })
], AuthModule);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("@nestjs/passport");

/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const common_1 = __webpack_require__(3);
const jwt_1 = __webpack_require__(8);
const prisma_service_1 = __webpack_require__(11);
const email_service_1 = __webpack_require__(17);
const config_service_1 = __webpack_require__(18);
const shared_1 = __webpack_require__(19);
const bcrypt = __webpack_require__(32);
const uuid_1 = __webpack_require__(33);
const user_service_1 = __webpack_require__(34);
const audit_service_1 = __webpack_require__(35);
let AuthService = class AuthService {
    constructor(prisma, email, jwt, config, userService, audit) {
        this.prisma = prisma;
        this.email = email;
        this.jwt = jwt;
        this.config = config;
        this.userService = userService;
        this.audit = audit;
    }
    async register(dto, ip) {
        if (!this.config.authConfig.allowRegistration) {
            throw new common_1.ForbiddenException('Registration is currently disabled.');
        }
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { username: dto.username }],
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Email or Username already taken');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const { user } = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    username: dto.username,
                    password: hashedPassword,
                    isVerified: true,
                },
            });
            await tx.wallet.create({
                data: {
                    userId: user.id,
                    realBalance: 0,
                    bonusBalance: 1000,
                },
            });
            await this.audit.record({
                userId: user.id,
                action: shared_1.AuditAction.LOGIN,
                payload: { event: 'USER_REGISTERED' },
                ipAddress: ip,
            }, tx);
            return { user };
        });
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                isVerified: user.isVerified,
            }
        };
    }
    async login(dto, ip) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isBanned) {
            throw new common_1.ForbiddenException('Your account has been suspended. Contact support.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.userService.ensureWalletExists(user.id);
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);
        await this.audit.record({
            userId: user.id,
            action: shared_1.AuditAction.LOGIN,
            payload: {},
            ipAddress: ip,
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                isVerified: user.isVerified,
            },
        };
    }
    async logout(userId, refreshToken) {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                token: refreshToken,
            },
        });
        return { message: 'Logged out successfully' };
    }
    async refresh(refreshToken) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (storedToken.expiresAt < new Date()) {
            await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        const accessToken = this.generateAccessToken(storedToken.user);
        const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { message: 'If that email exists, a reset code has been sent.' };
        }
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExp = new Date(Date.now() + 600000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExp,
            },
        });
        await this.email.sendPasswordResetEmail(user.email, resetToken);
        return { message: 'If that email exists, a reset code has been sent.' };
    }
    async resetPassword(code, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: code,
                resetTokenExp: { gte: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExp: null,
            },
        });
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });
        return { message: 'Password reset successfully' };
    }
    generateAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwt.sign(payload);
    }
    async generateRefreshToken(userId) {
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
        return token;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _b : Object, typeof (_c = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _c : Object, typeof (_d = typeof config_service_1.ConfigService !== "undefined" && config_service_1.ConfigService) === "function" ? _d : Object, typeof (_e = typeof user_service_1.UserService !== "undefined" && user_service_1.UserService) === "function" ? _e : Object, typeof (_f = typeof audit_service_1.AuditService !== "undefined" && audit_service_1.AuditService) === "function" ? _f : Object])
], AuthService);


/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const common_1 = __webpack_require__(3);
const client_1 = __webpack_require__(12);
const adapter_pg_1 = __webpack_require__(13);
const pg_1 = __webpack_require__(15);
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const connectionString = process.env.DATABASE_URL;
        const pool = new pg_1.Pool({ connectionString });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        super({ adapter });
        this.pool = pool;
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 13 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PrismaPg: () => (/* binding */ PrismaPg)
/* harmony export */ });
/* harmony import */ var _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(15);
/* harmony import */ var postgres_array__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
// src/pg.ts



// src/conversion.ts



var { types } = pg__WEBPACK_IMPORTED_MODULE_1__;
var { builtins: ScalarColumnType, getTypeParser, setTypeParser } = types;
var ArrayColumnType = {
  BIT_ARRAY: 1561,
  BOOL_ARRAY: 1e3,
  BYTEA_ARRAY: 1001,
  BPCHAR_ARRAY: 1014,
  CHAR_ARRAY: 1002,
  CIDR_ARRAY: 651,
  DATE_ARRAY: 1182,
  FLOAT4_ARRAY: 1021,
  FLOAT8_ARRAY: 1022,
  INET_ARRAY: 1041,
  INT2_ARRAY: 1005,
  INT4_ARRAY: 1007,
  INT8_ARRAY: 1016,
  JSONB_ARRAY: 3807,
  JSON_ARRAY: 199,
  MONEY_ARRAY: 791,
  NUMERIC_ARRAY: 1231,
  OID_ARRAY: 1028,
  TEXT_ARRAY: 1009,
  TIMESTAMP_ARRAY: 1115,
  TIME_ARRAY: 1183,
  UUID_ARRAY: 2951,
  VARBIT_ARRAY: 1563,
  VARCHAR_ARRAY: 1015,
  XML_ARRAY: 143
};
var _UnsupportedNativeDataType = class _UnsupportedNativeDataType extends Error {
  constructor(code) {
    super();
    this.type = _UnsupportedNativeDataType.typeNames[code] || "Unknown";
    this.message = `Unsupported column type ${this.type}`;
  }
};
// map of type codes to type names
_UnsupportedNativeDataType.typeNames = {
  16: "bool",
  17: "bytea",
  18: "char",
  19: "name",
  20: "int8",
  21: "int2",
  22: "int2vector",
  23: "int4",
  24: "regproc",
  25: "text",
  26: "oid",
  27: "tid",
  28: "xid",
  29: "cid",
  30: "oidvector",
  32: "pg_ddl_command",
  71: "pg_type",
  75: "pg_attribute",
  81: "pg_proc",
  83: "pg_class",
  114: "json",
  142: "xml",
  194: "pg_node_tree",
  269: "table_am_handler",
  325: "index_am_handler",
  600: "point",
  601: "lseg",
  602: "path",
  603: "box",
  604: "polygon",
  628: "line",
  650: "cidr",
  700: "float4",
  701: "float8",
  705: "unknown",
  718: "circle",
  774: "macaddr8",
  790: "money",
  829: "macaddr",
  869: "inet",
  1033: "aclitem",
  1042: "bpchar",
  1043: "varchar",
  1082: "date",
  1083: "time",
  1114: "timestamp",
  1184: "timestamptz",
  1186: "interval",
  1266: "timetz",
  1560: "bit",
  1562: "varbit",
  1700: "numeric",
  1790: "refcursor",
  2202: "regprocedure",
  2203: "regoper",
  2204: "regoperator",
  2205: "regclass",
  2206: "regtype",
  2249: "record",
  2275: "cstring",
  2276: "any",
  2277: "anyarray",
  2278: "void",
  2279: "trigger",
  2280: "language_handler",
  2281: "internal",
  2283: "anyelement",
  2287: "_record",
  2776: "anynonarray",
  2950: "uuid",
  2970: "txid_snapshot",
  3115: "fdw_handler",
  3220: "pg_lsn",
  3310: "tsm_handler",
  3361: "pg_ndistinct",
  3402: "pg_dependencies",
  3500: "anyenum",
  3614: "tsvector",
  3615: "tsquery",
  3642: "gtsvector",
  3734: "regconfig",
  3769: "regdictionary",
  3802: "jsonb",
  3831: "anyrange",
  3838: "event_trigger",
  3904: "int4range",
  3906: "numrange",
  3908: "tsrange",
  3910: "tstzrange",
  3912: "daterange",
  3926: "int8range",
  4072: "jsonpath",
  4089: "regnamespace",
  4096: "regrole",
  4191: "regcollation",
  4451: "int4multirange",
  4532: "nummultirange",
  4533: "tsmultirange",
  4534: "tstzmultirange",
  4535: "datemultirange",
  4536: "int8multirange",
  4537: "anymultirange",
  4538: "anycompatiblemultirange",
  4600: "pg_brin_bloom_summary",
  4601: "pg_brin_minmax_multi_summary",
  5017: "pg_mcv_list",
  5038: "pg_snapshot",
  5069: "xid8",
  5077: "anycompatible",
  5078: "anycompatiblearray",
  5079: "anycompatiblenonarray",
  5080: "anycompatiblerange"
};
var UnsupportedNativeDataType = _UnsupportedNativeDataType;
function fieldToColumnType(fieldTypeId) {
  switch (fieldTypeId) {
    case ScalarColumnType["INT2"]:
    case ScalarColumnType["INT4"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Int32;
    case ScalarColumnType["INT8"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Int64;
    case ScalarColumnType["FLOAT4"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Float;
    case ScalarColumnType["FLOAT8"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Double;
    case ScalarColumnType["BOOL"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Boolean;
    case ScalarColumnType["DATE"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Date;
    case ScalarColumnType["TIME"]:
    case ScalarColumnType["TIMETZ"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Time;
    case ScalarColumnType["TIMESTAMP"]:
    case ScalarColumnType["TIMESTAMPTZ"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.DateTime;
    case ScalarColumnType["NUMERIC"]:
    case ScalarColumnType["MONEY"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Numeric;
    case ScalarColumnType["JSON"]:
    case ScalarColumnType["JSONB"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Json;
    case ScalarColumnType["UUID"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Uuid;
    case ScalarColumnType["OID"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Int64;
    case ScalarColumnType["BPCHAR"]:
    case ScalarColumnType["TEXT"]:
    case ScalarColumnType["VARCHAR"]:
    case ScalarColumnType["BIT"]:
    case ScalarColumnType["VARBIT"]:
    case ScalarColumnType["INET"]:
    case ScalarColumnType["CIDR"]:
    case ScalarColumnType["XML"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Text;
    case ScalarColumnType["BYTEA"]:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Bytes;
    case ArrayColumnType.INT2_ARRAY:
    case ArrayColumnType.INT4_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Int32Array;
    case ArrayColumnType.FLOAT4_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.FloatArray;
    case ArrayColumnType.FLOAT8_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.DoubleArray;
    case ArrayColumnType.NUMERIC_ARRAY:
    case ArrayColumnType.MONEY_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.NumericArray;
    case ArrayColumnType.BOOL_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.BooleanArray;
    case ArrayColumnType.CHAR_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.CharacterArray;
    case ArrayColumnType.BPCHAR_ARRAY:
    case ArrayColumnType.TEXT_ARRAY:
    case ArrayColumnType.VARCHAR_ARRAY:
    case ArrayColumnType.VARBIT_ARRAY:
    case ArrayColumnType.BIT_ARRAY:
    case ArrayColumnType.INET_ARRAY:
    case ArrayColumnType.CIDR_ARRAY:
    case ArrayColumnType.XML_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.TextArray;
    case ArrayColumnType.DATE_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.DateArray;
    case ArrayColumnType.TIME_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.TimeArray;
    case ArrayColumnType.TIMESTAMP_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.DateTimeArray;
    case ArrayColumnType.JSON_ARRAY:
    case ArrayColumnType.JSONB_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.JsonArray;
    case ArrayColumnType.BYTEA_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.BytesArray;
    case ArrayColumnType.UUID_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.UuidArray;
    case ArrayColumnType.INT8_ARRAY:
    case ArrayColumnType.OID_ARRAY:
      return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Int64Array;
    default:
      if (fieldTypeId >= 1e4) {
        return _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ColumnTypeEnum.Text;
      }
      throw new UnsupportedNativeDataType(fieldTypeId);
  }
}
function normalize_array(element_normalizer) {
  return (str) => (0,postgres_array__WEBPACK_IMPORTED_MODULE_2__.parse)(str, element_normalizer);
}
function normalize_numeric(numeric) {
  return numeric;
}
setTypeParser(ScalarColumnType.NUMERIC, normalize_numeric);
setTypeParser(ArrayColumnType.NUMERIC_ARRAY, normalize_array(normalize_numeric));
function normalize_date(date) {
  return date;
}
function normalize_timestamp(time) {
  return time;
}
function normalize_timestampz(time) {
  return time.split("+")[0];
}
function normalize_time(time) {
  return time;
}
function normalize_timez(time) {
  return time.split("+")[0];
}
setTypeParser(ScalarColumnType.TIME, normalize_time);
setTypeParser(ArrayColumnType.TIME_ARRAY, normalize_array(normalize_time));
setTypeParser(ScalarColumnType.TIMETZ, normalize_timez);
setTypeParser(ScalarColumnType.DATE, normalize_date);
setTypeParser(ArrayColumnType.DATE_ARRAY, normalize_array(normalize_date));
setTypeParser(ScalarColumnType.TIMESTAMP, normalize_timestamp);
setTypeParser(ArrayColumnType.TIMESTAMP_ARRAY, normalize_array(normalize_timestamp));
setTypeParser(ScalarColumnType.TIMESTAMPTZ, normalize_timestampz);
function normalize_money(money) {
  return money.slice(1);
}
setTypeParser(ScalarColumnType.MONEY, normalize_money);
setTypeParser(ArrayColumnType.MONEY_ARRAY, normalize_array(normalize_money));
function toJson(json) {
  return json === "null" ? _prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.JsonNullMarker : JSON.parse(json);
}
setTypeParser(ScalarColumnType.JSONB, toJson);
setTypeParser(ScalarColumnType.JSON, toJson);
function encodeBuffer(buffer) {
  return Array.from(new Uint8Array(buffer));
}
var parsePgBytes = getTypeParser(ScalarColumnType.BYTEA);
function convertBytes(serializedBytes) {
  const buffer = parsePgBytes(serializedBytes);
  return encodeBuffer(buffer);
}
setTypeParser(ScalarColumnType.BYTEA, convertBytes);
var parseBytesArray = getTypeParser(ArrayColumnType.BYTEA_ARRAY);
setTypeParser(ArrayColumnType.BYTEA_ARRAY, (serializedBytesArray) => {
  const buffers = parseBytesArray(serializedBytesArray);
  return buffers.map((buf) => buf ? encodeBuffer(buf) : null);
});
function normalizeBit(bit) {
  return bit;
}
setTypeParser(ArrayColumnType.BIT_ARRAY, normalize_array(normalizeBit));
setTypeParser(ArrayColumnType.VARBIT_ARRAY, normalize_array(normalizeBit));
function fixArrayBufferValues(values) {
  for (let i = 0; i < values.length; i++) {
    const list = values[i];
    if (!Array.isArray(list)) {
      continue;
    }
    for (let j = 0; j < list.length; j++) {
      const listItem = list[j];
      if (ArrayBuffer.isView(listItem)) {
        list[j] = Buffer.from(listItem.buffer, listItem.byteOffset, listItem.byteLength);
      }
    }
  }
  return values;
}

// src/pg.ts
var debug = (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.Debug)("prisma:driver-adapter:pg");
var PgQueryable = class {
  constructor(client) {
    this.client = client;
    this.provider = "postgres";
  }
  /**
   * Execute a query given as SQL, interpolating the given parameters.
   */
  async queryRaw(query) {
    const tag = "[js::query_raw]";
    debug(`${tag} %O`, query);
    const res = await this.performIO(query);
    if (!res.ok) {
      return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.err)(res.error);
    }
    const { fields, rows } = res.value;
    const columnNames = fields.map((field) => field.name);
    let columnTypes = [];
    try {
      columnTypes = fields.map((field) => fieldToColumnType(field.dataTypeID));
    } catch (e) {
      if (e instanceof UnsupportedNativeDataType) {
        return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.err)({
          kind: "UnsupportedNativeDataType",
          type: e.type
        });
      }
      throw e;
    }
    return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ok)({
      columnNames,
      columnTypes,
      rows
    });
  }
  /**
   * Execute a query given as SQL, interpolating the given parameters and
   * returning the number of affected rows.
   * Note: Queryable expects a u64, but napi.rs only supports u32.
   */
  async executeRaw(query) {
    const tag = "[js::execute_raw]";
    debug(`${tag} %O`, query);
    return (await this.performIO(query)).map(({ rowCount: rowsAffected }) => rowsAffected ?? 0);
  }
  /**
   * Run a query against the database, returning the result set.
   * Should the query fail due to a connection error, the connection is
   * marked as unhealthy.
   */
  async performIO(query) {
    const { sql, args: values } = query;
    try {
      const result = await this.client.query({ text: sql, values: fixArrayBufferValues(values), rowMode: "array" });
      return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ok)(result);
    } catch (e) {
      const error = e;
      debug("Error in performIO: %O", error);
      if (e && e.code) {
        return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.err)({
          kind: "Postgres",
          code: e.code,
          severity: e.severity,
          message: e.message,
          detail: e.detail,
          column: e.column,
          hint: e.hint
        });
      }
      throw error;
    }
  }
};
var PgTransaction = class extends PgQueryable {
  constructor(client, options) {
    super(client);
    this.options = options;
  }
  async commit() {
    debug(`[js::commit]`);
    this.client.release();
    return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ok)(void 0);
  }
  async rollback() {
    debug(`[js::rollback]`);
    this.client.release();
    return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ok)(void 0);
  }
};
var PrismaPg = class extends PgQueryable {
  constructor(client, options) {
    if (!(client instanceof pg__WEBPACK_IMPORTED_MODULE_1__.Pool)) {
      throw new TypeError(`PrismaPg must be initialized with an instance of Pool:
import { Pool } from 'pg'
const pool = new Pool({ connectionString: url })
const adapter = new PrismaPg(pool)
`);
    }
    super(client);
    this.options = options;
  }
  getConnectionInfo() {
    return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ok)({
      schemaName: this.options?.schema
    });
  }
  async startTransaction() {
    const options = {
      usePhantomQuery: false
    };
    const tag = "[js::startTransaction]";
    debug(`${tag} options: %O`, options);
    const connection = await this.client.connect();
    return (0,_prisma_driver_adapter_utils__WEBPACK_IMPORTED_MODULE_0__.ok)(new PgTransaction(connection, options));
  }
};



/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("@prisma/driver-adapter-utils");

/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("postgres-array");

/***/ }),
/* 17 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailService = void 0;
const common_1 = __webpack_require__(3);
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async sendPasswordResetEmail(email, code) {
        this.logger.log(`\n\n====================================================`);
        this.logger.log(`🔑  PASSWORD RESET CODE`);
        this.logger.log(`To: ${email}`);
        this.logger.log(`Code: ${code}`);
        this.logger.log(`(Valid for 10 minutes)`);
        this.logger.log(`====================================================\n`);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)()
], EmailService);


/***/ }),
/* 18 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigService = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const shared_1 = __webpack_require__(19);
let ConfigService = class ConfigService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    get authConfig() {
        return {
            allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
            googleEnabled: !!process.env.GOOGLE_CLIENT_ID,
        };
    }
    get isProduction() {
        return process.env.NODE_ENV === 'production';
    }
    async getBankConfig() {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key: 'BANK_CONFIG' },
        });
        if (!config) {
            return {
                iban: '',
                bic: '',
                bankName: '',
                holderName: '',
                instructions: '',
                isActive: false,
            };
        }
        return config.value;
    }
    async updateBankConfig(dto, adminName) {
        const validated = shared_1.bankConfigSchema.parse(dto);
        await this.prisma.$transaction(async (tx) => {
            const currentConfig = await tx.systemConfig.findUnique({
                where: { key: 'BANK_CONFIG' },
            });
            if (currentConfig) {
                const currentData = currentConfig.value;
                await tx.bankConfigHistory.create({
                    data: {
                        adminName,
                        iban: currentData.iban,
                        bankName: currentData.bankName || 'Unknown Bank',
                        holderName: currentData.holderName,
                        instructions: currentData.instructions,
                        note: 'Manual Update',
                    },
                });
            }
            await tx.systemConfig.upsert({
                where: { key: 'BANK_CONFIG' },
                update: {
                    value: validated,
                    updatedBy: adminName,
                },
                create: {
                    key: 'BANK_CONFIG',
                    value: validated,
                    updatedBy: adminName,
                },
            });
        });
        return validated;
    }
    async getBankHistory() {
        const history = await this.prisma.bankConfigHistory.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                admin: {
                    select: {
                        avatarUrl: true
                    }
                }
            }
        });
        return history.map(h => {
            var _a;
            return (Object.assign(Object.assign({}, h), { updatedBy: h.adminName, adminAvatar: ((_a = h.admin) === null || _a === void 0 ? void 0 : _a.avatarUrl) || undefined }));
        });
    }
    async getAllConfigs() {
        const configs = await this.prisma.systemConfig.findMany();
        const systemMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        return {
            system: {
                maintenance: systemMap.MAINTENANCE_MODE === true,
                version: '1.0.0',
            },
            auth: this.authConfig,
            bank: systemMap.BANK_CONFIG || await this.getBankConfig(),
            features: {
                chat: true,
                leaderboard: true,
            }
        };
    }
    async restoreBankConfig(historyId, adminName) {
        const historyItem = await this.prisma.bankConfigHistory.findUnique({
            where: { id: historyId },
        });
        if (!historyItem) {
            throw new common_1.NotFoundException('History item not found');
        }
        const restoredDto = {
            iban: historyItem.iban,
            bankName: historyItem.bankName,
            holderName: historyItem.holderName,
            instructions: historyItem.instructions || undefined,
            bic: '',
            isActive: true,
        };
        await this.prisma.$transaction(async (tx) => {
            const currentConfig = await tx.systemConfig.findUnique({
                where: { key: 'BANK_CONFIG' },
            });
            if (currentConfig) {
                const currentData = currentConfig.value;
                await tx.bankConfigHistory.create({
                    data: {
                        adminName,
                        iban: currentData.iban,
                        bankName: currentData.bankName || 'Unknown Bank',
                        holderName: currentData.holderName,
                        instructions: currentData.instructions,
                        note: `Restored from history ID: ${historyId.slice(0, 8)}`,
                    },
                });
            }
            await tx.systemConfig.upsert({
                where: { key: 'BANK_CONFIG' },
                update: {
                    value: restoredDto,
                    updatedBy: adminName,
                },
                create: {
                    key: 'BANK_CONFIG',
                    value: restoredDto,
                    updatedBy: adminName,
                },
            });
        });
        return restoredDto;
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ConfigService);


/***/ }),
/* 19 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(20), exports);
__exportStar(__webpack_require__(22), exports);
__exportStar(__webpack_require__(23), exports);
__exportStar(__webpack_require__(24), exports);
__exportStar(__webpack_require__(25), exports);
__exportStar(__webpack_require__(26), exports);
__exportStar(__webpack_require__(27), exports);
__exportStar(__webpack_require__(28), exports);
__exportStar(__webpack_require__(30), exports);
__exportStar(__webpack_require__(31), exports);


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = __webpack_require__(21);
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(8),
    confirmPassword: zod_1.z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8),
});


/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("zod");

/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bankHistorySchema = exports.bankConfigSchema = void 0;
const zod_1 = __webpack_require__(21);
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


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.userListResponseSchema = exports.userListQuerySchema = exports.adminUpdateUserSchema = exports.createUserSchema = exports.updateRoleSchema = exports.updateProfileSchema = exports.userResponseSchema = exports.TIER_ORDER = exports.TIER_CONFIG = exports.Tier = exports.Role = void 0;
exports.getNextTier = getNextTier;
exports.calculateTierFromRake = calculateTierFromRake;
const zod_1 = __webpack_require__(21);
exports.Role = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN',
};
exports.Tier = {
    BRONZE: 'BRONZE',
    SILVER: 'SILVER',
    GOLD: 'GOLD',
    PLATINUM: 'PLATINUM',
    DIAMOND: 'DIAMOND',
};
exports.TIER_CONFIG = {
    BRONZE: { minRake: 0, label: 'Bronze', color: '#CD7F32' },
    SILVER: { minRake: 250000, label: 'Silver', color: '#C0C0C0' },
    GOLD: { minRake: 1000000, label: 'Gold', color: '#FFD700' },
    PLATINUM: { minRake: 5000000, label: 'Platinum', color: '#E5E4E2' },
    DIAMOND: { minRake: 20000000, label: 'Diamond', color: '#B9F2FF' },
};
exports.TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
function getNextTier(currentTier) {
    const currentIndex = exports.TIER_ORDER.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex === exports.TIER_ORDER.length - 1)
        return null;
    return exports.TIER_ORDER[currentIndex + 1];
}
function calculateTierFromRake(lifetimeRake) {
    for (let i = exports.TIER_ORDER.length - 1; i >= 0; i--) {
        const tier = exports.TIER_ORDER[i];
        if (lifetimeRake >= exports.TIER_CONFIG[tier].minRake) {
            return tier;
        }
    }
    return 'BRONZE';
}
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    username: zod_1.z.string(),
    bio: zod_1.z.string().nullable(),
    avatarUrl: zod_1.z.string().nullable(),
    avatarId: zod_1.z.string().default('avatar_1'),
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
    tier: zod_1.z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']),
    lifetimeRake: zod_1.z.number(),
    balance: zod_1.z.number().default(0),
    accountNumber: zod_1.z.string().nullable().optional(),
    iban: zod_1.z.string().nullable().optional(),
    bankName: zod_1.z.string().nullable().optional(),
    accountHolderName: zod_1.z.string().nullable().optional(),
    isVerified: zod_1.z.boolean(),
    isBanned: zod_1.z.boolean(),
    createdAt: zod_1.z.string().or(zod_1.z.date()),
    nextTier: zod_1.z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).nullable(),
    nextTierProgress: zod_1.z.number().min(0).max(100),
    rakeToNextTier: zod_1.z.number(),
});
exports.updateProfileSchema = zod_1.z.object({
    bio: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    avatarId: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
    iban: zod_1.z.string().min(8).max(34).optional(),
    bankName: zod_1.z.string().optional(),
    accountHolderName: zod_1.z.string().optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
});
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']).default('USER'),
    balance: zod_1.z.number().default(0),
});
exports.adminUpdateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.string().optional(),
    isBanned: zod_1.z.boolean().optional(),
});
exports.userListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    role: zod_1.z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    tier: zod_1.z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).optional(),
    isBanned: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'balance']).optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.userListResponseSchema = zod_1.z.object({
    users: zod_1.z.array(exports.userResponseSchema),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    limit: zod_1.z.number(),
    totalPages: zod_1.z.number(),
});


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.adminBalanceAdjustmentSchema = exports.adminTransactionQuerySchema = exports.lockFundsSchema = exports.withdrawSchema = exports.depositSchema = exports.transactionResponseSchema = exports.walletResponseSchema = exports.TransactionStatus = exports.TransactionType = void 0;
const zod_1 = __webpack_require__(21);
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAW"] = "WITHDRAW";
    TransactionType["BUY_IN"] = "BUY_IN";
    TransactionType["CASH_OUT"] = "CASH_OUT";
    TransactionType["BONUS"] = "BONUS";
    TransactionType["RAKE"] = "RAKE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["APPROVED"] = "APPROVED";
    TransactionStatus["REJECTED"] = "REJECTED";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
exports.walletResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    realBalance: zod_1.z.number(),
    bonusBalance: zod_1.z.number(),
});
exports.transactionResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    walletId: zod_1.z.string(),
    type: zod_1.z.nativeEnum(TransactionType),
    amount: zod_1.z.number(),
    status: zod_1.z.nativeEnum(TransactionStatus),
    description: zod_1.z.string().nullable(),
    rejectionReason: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.date(),
});
exports.depositSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0, "Amount must be positive").optional(),
    method: zod_1.z.string().optional(),
});
exports.withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().min(20, "Minimum withdrawal is 20"),
    bankAccount: zod_1.z.string().optional(),
    comment: zod_1.z.string().optional(),
});
exports.lockFundsSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    tableId: zod_1.z.string(),
});
exports.adminTransactionQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(TransactionType).optional(),
    status: zod_1.z.nativeEnum(TransactionStatus).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    page: zod_1.z.coerce.number().min(1).default(1),
});
exports.adminBalanceAdjustmentSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    amount: zod_1.z.number(),
    type: zod_1.z.enum(['ADJUSTMENT', 'BONUS', 'PENALTY']),
    reason: zod_1.z.string().min(3),
});


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetAuditLogsQuerySchema = exports.CreateAuditLogSchema = exports.AuditAction = void 0;
const zod_1 = __webpack_require__(21);
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


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createNotificationSchema = exports.notificationSchema = exports.NotificationType = void 0;
const zod_1 = __webpack_require__(21);
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


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UncalledBetReturnedEventSchema = exports.PlayerStatusUpdateEventSchema = exports.PlayerGameStatusSchema = exports.PlayerJoinedEventSchema = exports.PlayerConnectionStatusEventSchema = exports.PlayerConnectionSchema = exports.LeaveWaitlistEventSchema = exports.JoinWaitlistEventSchema = exports.SubscribeTableEventSchema = exports.RebuySchema = exports.AddChipsEventSchema = exports.ToggleAutoRebuyEventSchema = exports.ToggleLNBBEventSchema = exports.ToggleSitOutEventSchema = exports.BetActionSchema = exports.LeaveTableEventSchema = exports.JoinTableEventSchema = exports.TableSnapshotSchema = exports.TableStateSchema = exports.TablePhaseSchema = exports.PlayerStateSchema = exports.PlayerStatusSchema = void 0;
const zod_1 = __webpack_require__(21);
exports.PlayerStatusSchema = zod_1.z.enum([
    'waiting',
    'active',
    'folded',
    'all-in',
    'sitting-out'
]);
exports.PlayerStateSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    username: zod_1.z.string(),
    chips: zod_1.z.number().int().nonnegative(),
    totalBuyIn: zod_1.z.number().int().nonnegative().optional().default(0),
    status: exports.PlayerStatusSchema,
    cards: zod_1.z.array(zod_1.z.string()).max(2),
    currentBet: zod_1.z.number().int().nonnegative(),
    totalContribution: zod_1.z.number().int().nonnegative().default(0),
    seatNumber: zod_1.z.number().int().min(0).max(9),
    avatarId: zod_1.z.string().optional().default('avatar_1'),
});
exports.TablePhaseSchema = zod_1.z.enum([
    'waiting',
    'preflop',
    'flop',
    'turn',
    'river',
    'showdown'
]);
exports.TableStateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    phase: exports.TablePhaseSchema,
    pot: zod_1.z.number().int().nonnegative(),
    currentBet: zod_1.z.number().int().nonnegative(),
    turnSeat: zod_1.z.number().int().min(-1).max(9),
    dealerSeat: zod_1.z.number().int().min(0).max(9),
    smallBlindSeat: zod_1.z.number().int().min(0).max(9),
    bigBlindSeat: zod_1.z.number().int().min(0).max(9),
    communityCards: zod_1.z.array(zod_1.z.string()).max(5),
    smallBlind: zod_1.z.number().int().positive(),
    bigBlind: zod_1.z.number().int().positive(),
    minPlayers: zod_1.z.number().int().min(2).default(2),
    maxPlayers: zod_1.z.number().int().min(2).max(10).default(9),
});
exports.TableSnapshotSchema = zod_1.z.object({
    table: exports.TableStateSchema,
    players: zod_1.z.array(exports.PlayerStateSchema),
    myCards: zod_1.z.array(zod_1.z.string()).max(2).optional(),
});
exports.JoinTableEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    seatNumber: zod_1.z.number().int().min(0).max(9),
    buyIn: zod_1.z.number().int().positive(),
});
exports.LeaveTableEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.BetActionSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    action: zod_1.z.enum(['fold', 'check', 'call', 'raise', 'all-in']),
    amount: zod_1.z.number().int().nonnegative().optional(),
});
exports.ToggleSitOutEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.ToggleLNBBEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    value: zod_1.z.boolean(),
});
exports.ToggleAutoRebuyEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    value: zod_1.z.boolean(),
});
exports.AddChipsEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().int().positive(),
});
exports.RebuySchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().int().positive(),
});
exports.SubscribeTableEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.JoinWaitlistEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.LeaveWaitlistEventSchema = zod_1.z.object({
    tableId: zod_1.z.string().uuid(),
});
exports.PlayerConnectionSchema = zod_1.z.enum(['online', 'offline']);
exports.PlayerConnectionStatusEventSchema = zod_1.z.object({
    seat: zod_1.z.number().int().min(0).max(9),
    status: exports.PlayerConnectionSchema,
    username: zod_1.z.string().optional(),
});
exports.PlayerJoinedEventSchema = zod_1.z.object({
    player: zod_1.z.object({
        id: zod_1.z.string(),
        username: zod_1.z.string(),
        chips: zod_1.z.number(),
        status: zod_1.z.string(),
        cards: zod_1.z.array(zod_1.z.string()),
        currentBet: zod_1.z.number(),
        seatNumber: zod_1.z.number().int().min(0).max(9),
        avatarId: zod_1.z.string().optional(),
        totalContribution: zod_1.z.number().optional(),
        time_bank: zod_1.z.number().optional(),
    }),
});
exports.PlayerGameStatusSchema = zod_1.z.enum([
    'active',
    'sitting_out',
    'timed_out',
    'waiting',
]);
exports.PlayerStatusUpdateEventSchema = zod_1.z.object({
    seat: zod_1.z.number().int().min(0).max(9),
    status: exports.PlayerGameStatusSchema,
});
exports.UncalledBetReturnedEventSchema = zod_1.z.object({
    seat: zod_1.z.number().int().min(0).max(9),
    amount: zod_1.z.number().int().positive(),
});


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cryptoShuffle = cryptoShuffle;
exports.createDeck = createDeck;
exports.createShuffledDeck = createShuffledDeck;
const crypto_1 = __webpack_require__(29);
function cryptoShuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = (0, crypto_1.randomInt)(0, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
const SUITS = ['s', 'h', 'd', 'c'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
function createDeck() {
    return SUITS.flatMap(suit => RANKS.map(rank => `${rank}${suit}`));
}
function createShuffledDeck() {
    return cryptoShuffle(createDeck());
}


/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TableFiltersSchema = exports.LobbyTableSchema = exports.CreateTableSchema = exports.BettingLimitDisplayNames = exports.BettingLimitEnum = exports.TurnTimeDisplayNames = exports.TurnTimeEnum = exports.GameVariantDisplayNames = exports.GameVariantEnum = void 0;
const zod_1 = __webpack_require__(21);
exports.GameVariantEnum = zod_1.z.enum(['TEXAS_HOLDEM', 'OMAHA', 'ALL_IN_OR_FOLD']);
exports.GameVariantDisplayNames = {
    TEXAS_HOLDEM: "Texas Hold'em",
    OMAHA: 'Omaha',
    ALL_IN_OR_FOLD: 'All-in or Fold',
};
exports.TurnTimeEnum = zod_1.z.enum(['15', '30', '60']);
exports.TurnTimeDisplayNames = {
    '15': 'Turbo (15s)',
    '30': 'Regular (30s)',
    '60': 'Slow (60s)',
};
exports.BettingLimitEnum = zod_1.z.enum(['NO_LIMIT', 'POT_LIMIT', 'FIXED_LIMIT']);
exports.BettingLimitDisplayNames = {
    NO_LIMIT: 'No Limit',
    POT_LIMIT: 'Pot Limit',
    FIXED_LIMIT: 'Fixed Limit',
};
exports.CreateTableSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Name must be at most 50 characters'),
    variant: exports.GameVariantEnum,
    maxSeats: zod_1.z.coerce.number().refine((val) => [4, 6, 9].includes(val), { message: 'Seats must be 4, 6, or 9' }),
    smallBlind: zod_1.z.coerce.number().positive('Small blind must be positive'),
    bigBlind: zod_1.z.coerce.number().positive('Big blind must be positive'),
    minBuyIn: zod_1.z.coerce.number().positive('Min buy-in must be positive'),
    maxBuyIn: zod_1.z.coerce.number().positive('Max buy-in must be positive'),
    ante: zod_1.z.coerce.number().nonnegative('Ante must be non-negative').default(0),
    turnTime: zod_1.z.coerce.number().refine((val) => [15, 30, 60].includes(val), { message: 'Turn time must be 15, 30, or 60 seconds' }).default(30),
    timeBank: zod_1.z.coerce.number().nonnegative().default(60),
    isStraddleAllowed: zod_1.z.boolean().default(false),
    password: zod_1.z.string().optional().nullable(),
    rakePercent: zod_1.z.coerce.number()
        .min(0, 'Rake must be at least 0%')
        .max(10, 'Rake cannot exceed 10%')
        .default(0),
    rakeCap: zod_1.z.coerce.number().nonnegative('Rake cap must be non-negative').default(0),
    holeCardsCount: zod_1.z.coerce.number().refine((val) => [2, 4, 5, 6].includes(val), { message: 'Hole cards must be 2 (Texas) or 4, 5, 6 (Omaha)' }).default(2),
    bettingLimit: exports.BettingLimitEnum.default('NO_LIMIT'),
}).refine((data) => data.bigBlind >= data.smallBlind, { message: 'Big blind must be >= small blind', path: ['bigBlind'] }).refine((data) => data.maxBuyIn >= data.minBuyIn, { message: 'Max buy-in must be >= min buy-in', path: ['maxBuyIn'] }).refine((data) => data.minBuyIn >= data.bigBlind * 20, { message: 'Min buy-in must be at least 20 big blinds', path: ['minBuyIn'] });
exports.LobbyTableSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    variant: exports.GameVariantEnum,
    stakes: zod_1.z.string(),
    players: zod_1.z.number(),
    maxSeats: zod_1.z.number(),
    minBuyIn: zod_1.z.number(),
    maxBuyIn: zod_1.z.number(),
    holeCardsCount: zod_1.z.number().optional(),
    isActive: zod_1.z.boolean(),
    status: zod_1.z.string(),
    isPrivate: zod_1.z.boolean(),
    rakePercent: zod_1.z.number().optional(),
    handsPerHour: zod_1.z.number().optional(),
    avgPot: zod_1.z.string().optional(),
});
exports.TableFiltersSchema = zod_1.z.object({
    variant: exports.GameVariantEnum.optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
});


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateTableConfigSchema = exports.AdminTableActionSchema = void 0;
const zod_1 = __webpack_require__(21);
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


/***/ }),
/* 32 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 33 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 34 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserService = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const shared_1 = __webpack_require__(19);
const bcrypt = __webpack_require__(32);
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapToUserResponse(user);
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                bio: dto.bio,
                avatarUrl: dto.avatarUrl,
                avatarId: dto.avatarId,
                accountNumber: dto.accountNumber,
                iban: dto.iban,
                bankName: dto.bankName,
                accountHolderName: dto.accountHolderName,
            },
            include: { wallet: true },
        });
        return this.mapToUserResponse(user);
    }
    async ensureWalletExists(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            console.warn(`[SELF-HEALING] Wallet missing for user ${userId}. Creating now.`);
            await this.prisma.wallet.create({
                data: {
                    userId,
                    realBalance: 0,
                    bonusBalance: 1000,
                },
            });
        }
    }
    async createUser(dto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email },
                    { username: dto.username },
                ],
            },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email or username already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password: hashedPassword,
                role: dto.role,
                wallet: {
                    create: {
                        realBalance: dto.balance || 0,
                        bonusBalance: 0,
                    },
                },
            },
            include: { wallet: true },
        });
        console.log(`[AUDIT] User ${user.id} (${user.username}) created by ADMIN`);
        return this.mapToUserResponse(user);
    }
    async adminUpdateUser(adminId, targetUserId, dto) {
        var _a;
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.email || dto.username) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        dto.email ? { email: dto.email } : {},
                        dto.username ? { username: dto.username } : {},
                    ],
                    NOT: { id: targetUserId },
                },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('Username or Email already taken by another user');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                username: dto.username,
                email: dto.email,
                role: dto.role,
                isBanned: dto.isBanned,
            },
            include: { wallet: true },
        });
        console.log(`[AUDIT] User ${targetUserId} updated by Admin ${adminId}. Banned: ${(_a = dto.isBanned) !== null && _a !== void 0 ? _a : 'N/A'}`);
        return this.mapToUserResponse(updatedUser);
    }
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapToUserResponse(user);
    }
    async getAllUsers(query) {
        const { page, limit, search, role, tier, isBanned, sortBy, order } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role)
            where.role = role;
        if (tier)
            where.tier = tier;
        if (isBanned !== undefined)
            where.isBanned = isBanned;
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'balance') {
            orderBy = {
                wallet: {
                    realBalance: order || 'desc',
                },
            };
        }
        else if (sortBy) {
            orderBy = { [sortBy]: order || 'desc' };
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: { wallet: true },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            users: users.map(u => this.mapToUserResponse(u)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async banUser(adminId, targetUserId, adminRole) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        if (adminRole === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPERADMIN')) {
            throw new common_1.ForbiddenException('Admins cannot ban other Admins or Superadmins');
        }
        if (adminRole === 'SUPERADMIN' && targetUser.role === 'SUPERADMIN' && adminId !== targetUserId) {
            throw new common_1.ForbiddenException('Superadmins cannot ban other Superadmins');
        }
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { isBanned: true },
        });
        console.log(`[AUDIT] User ${targetUserId} banned by ${adminId}`);
        return { message: 'User banned successfully' };
    }
    async unbanUser(adminId, targetUserId) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { isBanned: false },
        });
        console.log(`[AUDIT] User ${targetUserId} unbanned by ${adminId}`);
        return { message: 'User unbanned successfully' };
    }
    async updateRole(adminId, targetUserId, dto) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const user = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { role: dto.role },
            include: { wallet: true },
        });
        console.log(`[AUDIT] User ${targetUserId} role changed to ${dto.role} by ${adminId}`);
        return this.mapToUserResponse(user);
    }
    async addRake(userId, amount) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Rake amount must be positive');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const currentRake = Number(user.lifetimeRake);
            const newRake = currentRake + amount;
            const oldTier = user.tier;
            const newTier = (0, shared_1.calculateTierFromRake)(newRake);
            const upgraded = newTier !== oldTier;
            await tx.user.update({
                where: { id: userId },
                data: {
                    lifetimeRake: newRake,
                    tier: newTier,
                },
            });
            if (upgraded) {
                console.log(`[TIER] User ${userId} upgraded from ${oldTier} to ${newTier}`);
            }
            return { newTier, upgraded };
        });
        return result;
    }
    mapToUserResponse(user) {
        var _a, _b;
        const lifetimeRake = Number(user.lifetimeRake);
        const currentTier = user.tier;
        const nextTier = (0, shared_1.getNextTier)(currentTier);
        let nextTierProgress = 100;
        let rakeToNextTier = 0;
        if (nextTier) {
            const currentTierMin = shared_1.TIER_CONFIG[currentTier].minRake;
            const nextTierMin = shared_1.TIER_CONFIG[nextTier].minRake;
            const progressInTier = lifetimeRake - currentTierMin;
            const tierRange = nextTierMin - currentTierMin;
            nextTierProgress = Math.min(100, Math.floor((progressInTier / tierRange) * 100));
            rakeToNextTier = nextTierMin - lifetimeRake;
        }
        const balance = user.wallet
            ? Number(user.wallet.realBalance) + Number(user.wallet.bonusBalance)
            : 0;
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            bio: user.bio || null,
            avatarUrl: user.avatarUrl || null,
            avatarId: user.avatarId,
            accountNumber: (_b = (_a = user.accountNumber) !== null && _a !== void 0 ? _a : user.bankAccount) !== null && _b !== void 0 ? _b : null,
            bankName: user.bankName || null,
            accountHolderName: user.accountHolderName || null,
            iban: user.iban || null,
            role: user.role,
            tier: currentTier,
            lifetimeRake,
            balance,
            isVerified: user.isVerified,
            isBanned: user.isBanned,
            createdAt: user.createdAt.toISOString(),
            nextTier,
            nextTierProgress,
            rakeToNextTier,
        };
    }
    ;
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], UserService);


/***/ }),
/* 35 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditService = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const shared_1 = __webpack_require__(19);
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
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AuditService);


/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthController = void 0;
const common_1 = __webpack_require__(3);
const auth_service_1 = __webpack_require__(10);
const express_1 = __webpack_require__(37);
const shared_1 = __webpack_require__(19);
const zod_validation_pipe_1 = __webpack_require__(38);
const jwt_auth_guard_1 = __webpack_require__(39);
const authenticated_request_interface_1 = __webpack_require__(40);
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto, req) {
        return this.authService.register(dto, req.ip);
    }
    async login(dto, req) {
        return this.authService.login(dto, req.ip);
    }
    async logout(req, refreshToken) {
        return this.authService.logout(req.user.id, refreshToken);
    }
    async refresh(refreshToken) {
        return this.authService.refresh(refreshToken);
    }
    async getMe(req) {
        return this.authService.getMe(req.user.id);
    }
    async forgotPassword(dto) {
        return this.authService.forgotPassword(dto.email);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.registerSchema)),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.loginSchema)),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.forgotPasswordSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.resetPasswordSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], AuthController);


/***/ }),
/* 37 */
/***/ ((module) => {

module.exports = require("express");

/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZodValidationPipe = void 0;
const common_1 = __webpack_require__(3);
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


/***/ }),
/* 39 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtAuthGuard = void 0;
const common_1 = __webpack_require__(3);
const passport_1 = __webpack_require__(9);
const core_1 = __webpack_require__(1);
const public_decorator_1 = __webpack_require__(6);
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], JwtAuthGuard);


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 41 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaModule = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
let PrismaModule = class PrismaModule {
};
exports.PrismaModule = PrismaModule;
exports.PrismaModule = PrismaModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], PrismaModule);


/***/ }),
/* 42 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailModule = void 0;
const common_1 = __webpack_require__(3);
const email_service_1 = __webpack_require__(17);
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Module)({
        providers: [email_service_1.EmailService],
        exports: [email_service_1.EmailService],
    })
], EmailModule);


/***/ }),
/* 43 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserModule = void 0;
const common_1 = __webpack_require__(3);
const user_service_1 = __webpack_require__(34);
const user_controller_1 = __webpack_require__(44);
const prisma_module_1 = __webpack_require__(41);
let UserModule = class UserModule {
};
exports.UserModule = UserModule;
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [user_service_1.UserService],
        controllers: [user_controller_1.UserController],
        exports: [user_service_1.UserService],
    })
], UserModule);


/***/ }),
/* 44 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserController = void 0;
const common_1 = __webpack_require__(3);
const user_service_1 = __webpack_require__(34);
const jwt_auth_guard_1 = __webpack_require__(39);
const roles_guard_1 = __webpack_require__(45);
const roles_decorator_1 = __webpack_require__(46);
const zod_validation_pipe_1 = __webpack_require__(38);
const shared_1 = __webpack_require__(19);
const authenticated_request_interface_1 = __webpack_require__(40);
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async getProfile(req) {
        return this.userService.getProfile(req.user.id);
    }
    async updateProfile(req, dto) {
        return this.userService.updateProfile(req.user.id, dto);
    }
    async createUser(dto) {
        return this.userService.createUser(dto);
    }
    async adminUpdateUser(req, id, dto) {
        return this.userService.adminUpdateUser(req.user.id, id, dto);
    }
    async getAllUsers(query) {
        const validated = shared_1.userListQuerySchema.parse(query);
        return this.userService.getAllUsers(validated);
    }
    async getUserById(id) {
        return this.userService.getUserById(id);
    }
    async banUser(req, id) {
        return this.userService.banUser(req.user.id, id, req.user.role);
    }
    async unbanUser(req, id) {
        return this.userService.unbanUser(req.user.id, id);
    }
    async updateRole(req, id, dto) {
        return this.userService.updateRole(req.user.id, id, dto);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.updateProfileSchema)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _c : Object, typeof (_d = typeof shared_1.UpdateProfileDto !== "undefined" && shared_1.UpdateProfileDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('/admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.createUserSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof shared_1.CreateUserDto !== "undefined" && shared_1.CreateUserDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('/admin/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.adminUpdateUserSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object, String, typeof (_g = typeof shared_1.AdminUpdateUserDto !== "undefined" && shared_1.AdminUpdateUserDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "adminUpdateUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof shared_1.UserListQuery !== "undefined" && shared_1.UserListQuery) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Post)(':id/ban'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _j : Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "banUser", null);
__decorate([
    (0, common_1.Post)(':id/unban'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _k : Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.SUPERADMIN),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.updateRoleSchema)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _l : Object, String, typeof (_m = typeof shared_1.UpdateRoleDto !== "undefined" && shared_1.UpdateRoleDto) === "function" ? _m : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateRole", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof user_service_1.UserService !== "undefined" && user_service_1.UserService) === "function" ? _a : Object])
], UserController);


/***/ }),
/* 45 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RolesGuard = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const roles_decorator_1 = __webpack_require__(46);
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const hasRole = requiredRoles.some((role) => user.role === role);
        if (!hasRole) {
            throw new common_1.ForbiddenException(`Requires one of: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RolesGuard);


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = __webpack_require__(3);
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;


/***/ }),
/* 47 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtStrategy = void 0;
const common_1 = __webpack_require__(3);
const passport_1 = __webpack_require__(9);
const passport_jwt_1 = __webpack_require__(48);
const prisma_service_1 = __webpack_require__(11);
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isVerified: true,
                isBanned: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.isBanned) {
            throw new common_1.UnauthorizedException('Your account has been suspended.');
        }
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], JwtStrategy);


/***/ }),
/* 48 */
/***/ ((module) => {

module.exports = require("passport-jwt");

/***/ }),
/* 49 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigModule = void 0;
const common_1 = __webpack_require__(3);
const config_controller_1 = __webpack_require__(50);
const config_service_1 = __webpack_require__(18);
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [config_controller_1.ConfigController],
        providers: [config_service_1.ConfigService],
        exports: [config_service_1.ConfigService],
    })
], ConfigModule);


/***/ }),
/* 50 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigController = void 0;
const common_1 = __webpack_require__(3);
const public_decorator_1 = __webpack_require__(6);
const config_service_1 = __webpack_require__(18);
const shared_1 = __webpack_require__(19);
const zod_validation_pipe_1 = __webpack_require__(38);
const jwt_auth_guard_1 = __webpack_require__(39);
const roles_guard_1 = __webpack_require__(51);
const roles_decorator_1 = __webpack_require__(52);
const client_1 = __webpack_require__(12);
let ConfigController = class ConfigController {
    constructor(configService) {
        this.configService = configService;
    }
    getAuthConfig() {
        return this.configService.authConfig;
    }
    async getInitConfig() {
        return this.configService.getAllConfigs();
    }
    async getBankConfig() {
        return this.configService.getBankConfig();
    }
    async updateBankConfig(dto, req) {
        var _a;
        return this.configService.updateBankConfig(dto, ((_a = req.user) === null || _a === void 0 ? void 0 : _a.username) || 'Admin');
    }
    async getBankHistory() {
        return this.configService.getBankHistory();
    }
    async restoreBankConfig(id, req) {
        var _a;
        return this.configService.restoreBankConfig(id, ((_a = req.user) === null || _a === void 0 ? void 0 : _a.username) || 'Admin');
    }
};
exports.ConfigController = ConfigController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('auth'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConfigController.prototype, "getAuthConfig", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('init'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "getInitConfig", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('bank'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "getBankConfig", null);
__decorate([
    (0, common_1.Put)('admin/bank'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.bankConfigSchema))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof shared_1.BankConfigDto !== "undefined" && shared_1.BankConfigDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "updateBankConfig", null);
__decorate([
    (0, common_1.Get)('admin/bank/history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "getBankHistory", null);
__decorate([
    (0, common_1.Post)('admin/bank/restore/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "restoreBankConfig", null);
exports.ConfigController = ConfigController = __decorate([
    (0, common_1.Controller)('config'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_service_1.ConfigService !== "undefined" && config_service_1.ConfigService) === "function" ? _a : Object])
], ConfigController);


/***/ }),
/* 51 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RolesGuard = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const client_1 = __webpack_require__(12);
const roles_decorator_1 = __webpack_require__(52);
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.role) {
            return false;
        }
        if (user.role === client_1.Role.SUPERADMIN) {
            return true;
        }
        return requiredRoles.some((role) => user.role === role);
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RolesGuard);


/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = __webpack_require__(3);
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;


/***/ }),
/* 53 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletModule = void 0;
const common_1 = __webpack_require__(3);
const wallet_controller_1 = __webpack_require__(54);
const wallet_admin_controller_1 = __webpack_require__(57);
const wallet_service_1 = __webpack_require__(55);
const prisma_module_1 = __webpack_require__(41);
const config_1 = __webpack_require__(56);
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule],
        controllers: [wallet_controller_1.WalletController, wallet_admin_controller_1.WalletAdminController],
        providers: [wallet_service_1.WalletService],
        exports: [wallet_service_1.WalletService],
    })
], WalletModule);


/***/ }),
/* 54 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletController = void 0;
const common_1 = __webpack_require__(3);
const wallet_service_1 = __webpack_require__(55);
const shared_1 = __webpack_require__(19);
const jwt_auth_guard_1 = __webpack_require__(39);
const zod_validation_pipe_1 = __webpack_require__(38);
const authenticated_request_interface_1 = __webpack_require__(40);
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getBalance(req) {
        return this.walletService.getBalance(req.user.id);
    }
    async getTransactions(req) {
        return this.walletService.getTransactions(req.user.id, { limit: 20, page: 1 });
    }
    async deposit(req, dto) {
        return this.walletService.createDepositRequest(req.user.id, dto);
    }
    async withdraw(req, dto) {
        return this.walletService.createWithdrawalRequest(req.user.id, dto);
    }
    async lockFunds(req, dto) {
        return this.walletService.lockFunds(req.user.id, dto);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('deposit'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.depositSchema)),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object, typeof (_e = typeof shared_1.DepositDto !== "undefined" && shared_1.DepositDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "deposit", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.withdrawSchema)),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object, typeof (_g = typeof shared_1.WithdrawDto !== "undefined" && shared_1.WithdrawDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Post)('lock'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.lockFundsSchema)),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _h : Object, typeof (_j = typeof shared_1.LockFundsDto !== "undefined" && shared_1.LockFundsDto) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "lockFunds", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof wallet_service_1.WalletService !== "undefined" && wallet_service_1.WalletService) === "function" ? _a : Object])
], WalletController);


/***/ }),
/* 55 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletService = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const client_1 = __webpack_require__(12);
const shared_1 = __webpack_require__(19);
const config_1 = __webpack_require__(56);
const audit_service_1 = __webpack_require__(35);
let WalletService = class WalletService {
    constructor(prisma, config, audit) {
        this.prisma = prisma;
        this.config = config;
        this.audit = audit;
    }
    async getBalance(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            return this.createWallet(userId);
        }
        return {
            id: wallet.id,
            userId: wallet.userId,
            realBalance: Number(wallet.realBalance),
            bonusBalance: Number(wallet.bonusBalance),
        };
    }
    async createWallet(userId) {
        const wallet = await this.prisma.wallet.create({
            data: { userId },
        });
        return {
            id: wallet.id,
            userId: wallet.userId,
            realBalance: Number(wallet.realBalance),
            bonusBalance: Number(wallet.bonusBalance),
        };
    }
    async getTransactions(userId, query) {
        const { limit, page, type, status } = query;
        const skip = (page - 1) * limit;
        const where = Object.assign(Object.assign({ wallet: { userId } }, (type && { type: type })), (status && { status: status }));
        const [total, transactions] = await Promise.all([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return {
            data: transactions.map(tx => (Object.assign(Object.assign({}, tx), { amount: Number(tx.amount) }))),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
    async createDepositRequest(userId, dto) {
        const wallet = await this.getWalletOrThrow(userId);
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: shared_1.TransactionType.DEPOSIT,
                    amount: new client_1.Prisma.Decimal(dto.amount || 0),
                    status: shared_1.TransactionStatus.PENDING,
                    description: `Deposit via ${dto.method || 'Standard'}`,
                },
            });
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async createWithdrawalRequest(userId, dto) {
        const wallet = await this.getWalletOrThrow(userId);
        const amount = new client_1.Prisma.Decimal(dto.amount);
        if (wallet.realBalance.lessThan(amount)) {
            throw new common_1.BadRequestException('Insufficient real balance');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedBatch = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    realBalance: { gte: amount }
                },
                data: {
                    realBalance: { decrement: amount },
                },
            });
            if (updatedBatch.count === 0) {
                throw new common_1.BadRequestException('Insufficient funds (Race Condition Detected)');
            }
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: shared_1.TransactionType.WITHDRAW,
                    amount: amount.negated(),
                    status: shared_1.TransactionStatus.PENDING,
                    description: dto.comment || `Withdrawal to ${dto.bankAccount || 'Bank'}`,
                },
            });
            await this.audit.record({
                userId: userId,
                action: shared_1.AuditAction.WALLET_WITHDRAW,
                payload: { transactionId: transaction.id, amount: Number(transaction.amount) },
                ipAddress: null,
            }, tx);
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async lockFunds(userId, dto) {
        const wallet = await this.getWalletOrThrow(userId);
        const amount = new client_1.Prisma.Decimal(dto.amount);
        if (wallet.realBalance.lessThan(amount)) {
            throw new common_1.BadRequestException('Insufficient funds for buy-in');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedBatch = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    realBalance: { gte: amount }
                },
                data: {
                    realBalance: { decrement: amount },
                },
            });
            if (updatedBatch.count === 0) {
                throw new common_1.BadRequestException('Insufficient funds (Race Condition Detected)');
            }
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: shared_1.TransactionType.BUY_IN,
                    amount: amount.negated(),
                    status: shared_1.TransactionStatus.COMPLETED,
                    description: `Buy-in for table ${dto.tableId}`,
                }
            });
            await this.audit.record({
                userId: userId,
                action: shared_1.AuditAction.WALLET_TRANSFER,
                payload: { transactionId: transaction.id, amount: Number(transaction.amount), tableId: dto.tableId },
                ipAddress: null,
            }, tx);
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async adminGetTransactions(query) {
        const { limit, page, type, status, userId } = query;
        const skip = (page - 1) * limit;
        const where = Object.assign(Object.assign({ wallet: { userId } }, (type && { type: type })), (status && { status: status }));
        const [total, transactions] = await Promise.all([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: { include: { user: { select: { username: true, email: true, avatarUrl: true, bankName: true, accountNumber: true, accountHolderName: true, iban: true } } } },
                    processedBy: { select: { id: true, username: true, avatarUrl: true } },
                    performedBy: { select: { id: true, username: true, avatarUrl: true } }
                }
            }),
        ]);
        return {
            data: transactions.map(tx => (Object.assign(Object.assign({}, tx), { amount: Number(tx.amount), user: tx.wallet.user, processedBy: tx.processedBy, performedBy: tx.performedBy }))),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
    async adminAdjustBalance(dto, adminId) {
        const wallet = await this.getWalletOrThrow(dto.userId);
        return this.prisma.$transaction(async (tx) => {
            const amount = new client_1.Prisma.Decimal(dto.amount);
            if (amount.isZero())
                throw new common_1.BadRequestException('Amount cannot be zero');
            if (amount.isNegative()) {
                if (wallet.realBalance.plus(amount).isNegative()) {
                    throw new common_1.BadRequestException('Insufficient funds. User balance cannot be negative.');
                }
            }
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    realBalance: { increment: amount },
                }
            });
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: amount.isPositive() ? shared_1.TransactionType.BONUS : shared_1.TransactionType.CASH_OUT,
                    amount: amount,
                    status: shared_1.TransactionStatus.COMPLETED,
                    description: `Admin Adjustment: ${dto.reason} (${dto.type})`,
                    performedById: adminId,
                }
            });
            await this.audit.record({
                userId: dto.userId,
                action: shared_1.AuditAction.WALLET_ADJUSTMENT,
                payload: {
                    transactionId: transaction.id,
                    amount: Number(transaction.amount),
                    reason: dto.reason,
                    performedBy: adminId
                },
                ipAddress: null,
            }, tx);
            return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
        });
    }
    async adminProcessTransaction(transactionId, status, finalAmount, rejectionReason, processedById) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: transactionId },
                include: { wallet: true }
            });
            if (!transaction)
                throw new common_1.NotFoundException('Transaction not found');
            if (transaction.status !== shared_1.TransactionStatus.PENDING) {
                throw new common_1.BadRequestException('Transaction is not pending');
            }
            let amountToProcess = transaction.amount;
            if (status === shared_1.TransactionStatus.COMPLETED && finalAmount !== undefined) {
                amountToProcess = new client_1.Prisma.Decimal(finalAmount);
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: { amount: amountToProcess }
                });
            }
            if (status === shared_1.TransactionStatus.COMPLETED) {
                if (transaction.type === shared_1.TransactionType.DEPOSIT) {
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: { realBalance: { increment: amountToProcess } }
                    });
                }
                else if (transaction.type === shared_1.TransactionType.WITHDRAW) {
                }
            }
            else if (status === shared_1.TransactionStatus.REJECTED) {
                if (transaction.type === shared_1.TransactionType.WITHDRAW) {
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: { realBalance: { increment: transaction.amount } }
                    });
                }
            }
            const updated = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: status,
                    rejectionReason: rejectionReason || null,
                    processedById: processedById || null
                }
            });
            if (status === shared_1.TransactionStatus.COMPLETED && transaction.type === shared_1.TransactionType.DEPOSIT) {
                await this.audit.record({
                    userId: transaction.wallet.userId,
                    action: shared_1.AuditAction.WALLET_DEPOSIT,
                    payload: { transactionId: updated.id, amount: Number(updated.amount) },
                    ipAddress: null,
                }, tx);
            }
            else if (status === shared_1.TransactionStatus.REJECTED && transaction.type === shared_1.TransactionType.WITHDRAW) {
                await this.audit.record({
                    userId: transaction.wallet.userId,
                    action: shared_1.AuditAction.WALLET_ADJUSTMENT,
                    payload: { transactionId: updated.id, amount: Number(updated.amount), reason: 'Withdrawal Rejected' },
                    ipAddress: null,
                }, tx);
            }
            return updated;
        });
    }
    async getWalletOrThrow(userId) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        return wallet;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof audit_service_1.AuditService !== "undefined" && audit_service_1.AuditService) === "function" ? _c : Object])
], WalletService);


/***/ }),
/* 56 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 57 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WalletAdminController = void 0;
const common_1 = __webpack_require__(3);
const wallet_service_1 = __webpack_require__(55);
const shared_1 = __webpack_require__(19);
const zod_validation_pipe_1 = __webpack_require__(38);
const jwt_auth_guard_1 = __webpack_require__(39);
const roles_guard_1 = __webpack_require__(51);
const roles_decorator_1 = __webpack_require__(52);
const authenticated_request_interface_1 = __webpack_require__(40);
let WalletAdminController = class WalletAdminController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getAllTransactions(query) {
        return this.walletService.adminGetTransactions(query);
    }
    async adjustBalance(dto, req) {
        return this.walletService.adminAdjustBalance(dto, req.user.id);
    }
    async approveDeposit(id, body, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.COMPLETED, body.finalAmount, undefined, req.user.id);
    }
    async rejectDeposit(id, body, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.REJECTED, undefined, body.reason, req.user.id);
    }
    async approveWithdraw(id, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.COMPLETED, undefined, undefined, req.user.id);
    }
    async rejectWithdraw(id, body, req) {
        return this.walletService.adminProcessTransaction(id, shared_1.TransactionStatus.REJECTED, undefined, body.reason, req.user.id);
    }
};
exports.WalletAdminController = WalletAdminController;
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.adminTransactionQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof shared_1.AdminTransactionQueryDto !== "undefined" && shared_1.AdminTransactionQueryDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.Post)('adjustment'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.adminBalanceAdjustmentSchema))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof shared_1.AdminBalanceAdjustmentDto !== "undefined" && shared_1.AdminBalanceAdjustmentDto) === "function" ? _c : Object, typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "adjustBalance", null);
__decorate([
    (0, common_1.Post)('deposit/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_e = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "approveDeposit", null);
__decorate([
    (0, common_1.Post)('deposit/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "rejectDeposit", null);
__decorate([
    (0, common_1.Post)('withdraw/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "approveWithdraw", null);
__decorate([
    (0, common_1.Post)('withdraw/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_h = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], WalletAdminController.prototype, "rejectWithdraw", null);
exports.WalletAdminController = WalletAdminController = __decorate([
    (0, common_1.Controller)('admin/wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [typeof (_a = typeof wallet_service_1.WalletService !== "undefined" && wallet_service_1.WalletService) === "function" ? _a : Object])
], WalletAdminController);


/***/ }),
/* 58 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditModule = void 0;
const common_1 = __webpack_require__(3);
const audit_service_1 = __webpack_require__(35);
const prisma_module_1 = __webpack_require__(41);
const audit_controller_1 = __webpack_require__(59);
let AuditModule = class AuditModule {
};
exports.AuditModule = AuditModule;
exports.AuditModule = AuditModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [audit_controller_1.AuditController],
        providers: [audit_service_1.AuditService],
        exports: [audit_service_1.AuditService],
    })
], AuditModule);


/***/ }),
/* 59 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditController = void 0;
const common_1 = __webpack_require__(3);
const audit_service_1 = __webpack_require__(35);
const jwt_auth_guard_1 = __webpack_require__(39);
const roles_guard_1 = __webpack_require__(51);
const roles_decorator_1 = __webpack_require__(52);
const client_1 = __webpack_require__(12);
const shared_1 = __webpack_require__(19);
const zod_validation_pipe_1 = __webpack_require__(38);
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async findAll(query) {
        return this.auditService.findAll(query);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.GetAuditLogsQuerySchema)),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof shared_1.GetAuditLogsQueryDto !== "undefined" && shared_1.GetAuditLogsQueryDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findAll", null);
exports.AuditController = AuditController = __decorate([
    (0, common_1.Controller)('admin/audit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [typeof (_a = typeof audit_service_1.AuditService !== "undefined" && audit_service_1.AuditService) === "function" ? _a : Object])
], AuditController);


/***/ }),
/* 60 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameModule = void 0;
const common_1 = __webpack_require__(3);
const jwt_1 = __webpack_require__(8);
const lua_runner_service_1 = __webpack_require__(61);
const hand_evaluator_service_1 = __webpack_require__(65);
const game_gateway_1 = __webpack_require__(67);
const game_service_1 = __webpack_require__(71);
const reconciliation_service_1 = __webpack_require__(79);
const player_reaper_service_1 = __webpack_require__(80);
const game_controller_1 = __webpack_require__(81);
const ws_jwt_guard_1 = __webpack_require__(73);
const prisma_module_1 = __webpack_require__(41);
const wallet_module_1 = __webpack_require__(53);
const scheduler_module_1 = __webpack_require__(82);
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            wallet_module_1.WalletModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
                signOptions: { expiresIn: '7d' },
            }),
            scheduler_module_1.SchedulerModule,
        ],
        controllers: [game_controller_1.GameController],
        providers: [lua_runner_service_1.LuaRunnerService, hand_evaluator_service_1.HandEvaluatorService, game_gateway_1.GameGateway, ws_jwt_guard_1.WsJwtGuard, game_service_1.GameService, reconciliation_service_1.ReconciliationService, player_reaper_service_1.PlayerReaperService],
        exports: [lua_runner_service_1.LuaRunnerService, game_gateway_1.GameGateway, game_service_1.GameService],
    })
], GameModule);


/***/ }),
/* 61 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LuaRunnerService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LuaRunnerService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(62);
const promises_1 = __webpack_require__(63);
const path_1 = __webpack_require__(64);
let LuaRunnerService = LuaRunnerService_1 = class LuaRunnerService {
    constructor() {
        this.logger = new common_1.Logger(LuaRunnerService_1.name);
        this.scriptCache = new Map();
        this.scriptsDir = process.env.NODE_ENV === 'production'
            ? (0, path_1.join)(__dirname, 'lua')
            : (0, path_1.join)(process.cwd(), 'apps/api/src/game/lua');
    }
    async onModuleInit() {
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        this.redis.on('connect', () => {
            this.logger.log('Connected to Redis');
        });
        this.redis.on('error', (err) => {
            this.logger.error('Redis connection error', err);
        });
        await this.loadAllScripts();
    }
    async loadAllScripts() {
        try {
            const files = await (0, promises_1.readdir)(this.scriptsDir);
            const luaFiles = files.filter(f => f.endsWith('.lua'));
            for (const file of luaFiles) {
                const scriptName = file.replace('.lua', '');
                await this.loadScript(scriptName);
            }
            this.logger.log(`Loaded ${luaFiles.length} Lua scripts`);
        }
        catch (error) {
            this.logger.warn('No Lua scripts found (this is expected during initial setup)');
        }
    }
    async loadScript(scriptName) {
        const filePath = (0, path_1.join)(this.scriptsDir, `${scriptName}.lua`);
        const source = await (0, promises_1.readFile)(filePath, 'utf-8');
        const sha = await this.redis.script('LOAD', source);
        this.scriptCache.set(scriptName, { sha, source });
        this.logger.debug(`Loaded script: ${scriptName} (SHA: ${sha.substring(0, 8)}...)`);
        return sha;
    }
    async runScript(scriptName, keys, args = []) {
        let entry = this.scriptCache.get(scriptName);
        if (!entry) {
            await this.loadScript(scriptName);
            entry = this.scriptCache.get(scriptName);
        }
        if (!entry) {
            throw new Error(`Script not found: ${scriptName}`);
        }
        try {
            const result = await this.redis.evalsha(entry.sha, keys.length, ...keys, ...args.map(String));
            return result;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('NOSCRIPT')) {
                this.logger.warn(`Script ${scriptName} evicted from Redis, reloading...`);
                const newSha = await this.redis.script('LOAD', entry.source);
                entry.sha = newSha;
                const result = await this.redis.evalsha(newSha, keys.length, ...keys, ...args.map(String));
                return result;
            }
            throw error;
        }
    }
    async evalRaw(script, keys, args = []) {
        const result = await this.redis.eval(script, keys.length, ...keys, ...args.map(String));
        return result;
    }
    getClient() {
        return this.redis;
    }
    async healthCheck() {
        try {
            const pong = await this.redis.ping();
            return pong === 'PONG';
        }
        catch (_a) {
            return false;
        }
    }
};
exports.LuaRunnerService = LuaRunnerService;
exports.LuaRunnerService = LuaRunnerService = LuaRunnerService_1 = __decorate([
    (0, common_1.Injectable)()
], LuaRunnerService);


/***/ }),
/* 62 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 63 */
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),
/* 64 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 65 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HandEvaluatorService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HandEvaluatorService = void 0;
const common_1 = __webpack_require__(3);
const PokerEvaluator = __webpack_require__(66);
let HandEvaluatorService = HandEvaluatorService_1 = class HandEvaluatorService {
    constructor() {
        this.logger = new common_1.Logger(HandEvaluatorService_1.name);
    }
    combinations(arr, k) {
        const result = [];
        const combine = (start, combo) => {
            if (combo.length === k) {
                result.push([...combo]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        };
        combine(0, []);
        return result;
    }
    evaluateFiveCardHand(cards) {
        const result = PokerEvaluator.evalHand(cards);
        return {
            handType: result.handType,
            handRank: result.handRank,
            handName: result.handName,
            value: result.value,
        };
    }
    evaluateTexasHand(holeCards, communityCards) {
        const fullHand = [...holeCards, ...communityCards];
        const fiveCombos = this.combinations(fullHand, 5);
        let bestValue = 0;
        let bestName = '';
        let bestCards = fullHand.slice(0, 5);
        for (const combo of fiveCombos) {
            const result = this.evaluateFiveCardHand(combo);
            if (result.value > bestValue) {
                bestValue = result.value;
                bestName = result.handName;
                bestCards = combo;
            }
        }
        return { value: bestValue, name: bestName, bestCards };
    }
    evaluateOmahaHand(holeCards, communityCards) {
        const holeCombos = this.combinations(holeCards, 2);
        const boardCombos = this.combinations(communityCards, 3);
        let bestValue = 0;
        let bestName = '';
        let bestCards = [];
        for (const holeCombo of holeCombos) {
            for (const boardCombo of boardCombos) {
                const fiveCardHand = [...holeCombo, ...boardCombo];
                const result = this.evaluateFiveCardHand(fiveCardHand);
                if (result.value > bestValue) {
                    bestValue = result.value;
                    bestName = result.handName;
                    bestCards = fiveCardHand;
                }
            }
        }
        this.logger.debug(`Omaha evaluation: ${holeCombos.length} hole combos × ${boardCombos.length} board combos = ` +
            `${holeCombos.length * boardCombos.length} total hands. Best: ${bestName} (${bestValue})`);
        return { value: bestValue, name: bestName, bestCards };
    }
    evaluateHandScores(players, communityCards) {
        const activePlayers = players.filter(p => p.status === 'active' || p.status === 'all-in');
        if (activePlayers.length === 0) {
            this.logger.warn('No active players for showdown');
            return [];
        }
        const evaluatedPlayers = activePlayers.map(p => {
            const isOmaha = p.cards.length > 2;
            const evalResult = isOmaha
                ? this.evaluateOmahaHand(p.cards, communityCards)
                : this.evaluateTexasHand(p.cards, communityCards);
            return Object.assign(Object.assign({}, p), { handStrength: {
                    value: evalResult.value,
                    name: evalResult.name,
                }, bestCards: evalResult.bestCards });
        });
        return evaluatedPlayers.map(p => ({
            seat: p.seat,
            score: p.handStrength.value,
            handDescription: p.handStrength.name,
            winningCards: p.bestCards,
        }));
    }
};
exports.HandEvaluatorService = HandEvaluatorService;
exports.HandEvaluatorService = HandEvaluatorService = HandEvaluatorService_1 = __decorate([
    (0, common_1.Injectable)()
], HandEvaluatorService);


/***/ }),
/* 66 */
/***/ ((module) => {

module.exports = require("poker-evaluator");

/***/ }),
/* 67 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GameGateway_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameGateway = void 0;
const websockets_1 = __webpack_require__(68);
const socket_io_1 = __webpack_require__(69);
const common_1 = __webpack_require__(3);
const throttler_1 = __webpack_require__(70);
const jwt_1 = __webpack_require__(8);
const game_service_1 = __webpack_require__(71);
const ws_jwt_guard_1 = __webpack_require__(73);
const ws_throttler_guard_1 = __webpack_require__(74);
const lua_runner_service_1 = __webpack_require__(61);
const wallet_service_1 = __webpack_require__(55);
const hand_evaluator_service_1 = __webpack_require__(65);
const shared_1 = __webpack_require__(19);
const timer_service_1 = __webpack_require__(75);
const ws_zod_pipe_1 = __webpack_require__(78);
const CELEBRATION_DELAY_MS = 15000;
let GameGateway = GameGateway_1 = class GameGateway {
    constructor(luaRunner, walletService, handEvaluator, timerService, jwtService, gameService) {
        this.luaRunner = luaRunner;
        this.walletService = walletService;
        this.handEvaluator = handEvaluator;
        this.timerService = timerService;
        this.jwtService = jwtService;
        this.gameService = gameService;
        this.logger = new common_1.Logger(GameGateway_1.name);
        this.sessions = new Map();
        this.configSubscriber = null;
        this.autoAdvanceTimers = new Map();
        this.pendingStart = new Set();
        this.sitOutSweepers = new Map();
    }
    async afterInit() {
        this.logger.log('GameGateway initialized');
        try {
            const redis = this.luaRunner.getClient();
            this.configSubscriber = redis.duplicate();
            await this.configSubscriber.connect();
            await this.configSubscriber.pSubscribe('table:*:config_update', async (message, channel) => {
                try {
                    const parts = channel.split(':');
                    const tableId = parts[1];
                    const config = JSON.parse(message);
                    const configKey = `table:${tableId}:config`;
                    const updates = {};
                    if (config.rakePercent !== undefined)
                        updates.rakePercent = String(config.rakePercent);
                    if (config.rakeCap !== undefined)
                        updates.rakeCap = String(config.rakeCap);
                    if (config.turnTime !== undefined)
                        updates.turnTime = String(config.turnTime);
                    if (config.timeBank !== undefined)
                        updates.timeBank = String(config.timeBank);
                    if (Object.keys(updates).length > 0) {
                        const configArgs = [];
                        for (const [field, value] of Object.entries(updates)) {
                            configArgs.push(field, value);
                        }
                        try {
                            await this.luaRunner.runScript('set_config', [`table:${tableId}:config`, `stream:table:${tableId}`], configArgs);
                            this.logger.log(`Hot Sync: Table ${tableId} config updated - ${JSON.stringify(updates)}`);
                        }
                        catch (luaErr) {
                            this.logger.error(`Hot Sync Lua error: ${luaErr}`);
                        }
                    }
                }
                catch (err) {
                    this.logger.error(`Hot Sync parse error: ${err}`);
                }
            });
            this.logger.log('Hot Sync PubSub listener initialized');
        }
        catch (err) {
            this.logger.error(`Failed to initialize Hot Sync listener: ${err}`);
        }
    }
    async onModuleDestroy() {
        if (this.configSubscriber) {
            try {
                await this.configSubscriber.pUnsubscribe('table:*:config_update');
                await this.configSubscriber.quit();
                this.logger.log('Hot Sync PubSub listener closed');
            }
            catch (err) {
                this.logger.error(`Error closing config subscriber: ${err}`);
            }
        }
    }
    clearTableTimer(tableId) {
        const timer = this.autoAdvanceTimers.get(tableId);
        if (timer) {
            clearTimeout(timer);
            this.autoAdvanceTimers.delete(tableId);
            this.logger.log(`[Timer] Cleared pending action for table ${tableId}`);
        }
    }
    async getDynamicTurnTime(tableId) {
        const redis = this.luaRunner.getClient();
        const turnTime = await redis.hget(`table:${tableId}:config`, 'turnTime');
        const seconds = parseInt(turnTime || '30', 10);
        return seconds * 1000;
    }
    async handleConnection(client) {
        var _a, _b, _c;
        this.logger.debug(`Client connected: ${client.id}`);
        const token = ((_a = client.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ||
            ((_b = client.handshake.query) === null || _b === void 0 ? void 0 : _b.token) ||
            (((_c = client.handshake.headers.authorization) === null || _c === void 0 ? void 0 : _c.startsWith('Bearer '))
                ? client.handshake.headers.authorization.substring(7)
                : null);
        if (!token || typeof token !== 'string') {
            this.logger.debug(`Unauthenticated connection: ${client.id}`);
            return;
        }
        let userId;
        let username;
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            });
            userId = payload.sub;
            username = payload.username || payload.email || 'unknown';
            client.user = {
                id: userId,
                email: payload.email || '',
                username,
                role: payload.role || 'USER',
                avatarId: payload.avatarId || 'default',
            };
        }
        catch (_d) {
            this.logger.debug(`Invalid JWT on connection: ${client.id}`);
            return;
        }
        const redis = this.luaRunner.getClient();
        const seatData = await redis.get(`user:${userId}:seat`);
        let tableId;
        let seat;
        if (seatData) {
            const parsed = JSON.parse(seatData);
            tableId = parsed.tableId;
            seat = parsed.seat;
        }
        else {
            let existingEntry = null;
            for (const [socketId, session] of this.sessions.entries()) {
                if (session.userId === userId) {
                    existingEntry = { socketId, session };
                    break;
                }
            }
            if (!existingEntry) {
                this.logger.debug(`No existing seat for ${username} (${client.id})`);
                return;
            }
            tableId = existingEntry.session.tableId;
            seat = existingEntry.session.seat;
        }
        {
            const redis = this.luaRunner.getClient();
            const seatKey = `seat_${seat}`;
            const playerData = await redis.hget(`table:${tableId}:players`, seatKey);
            if (!playerData) {
                this.logger.warn(`♻️ STALE SEAT: ${username}'s seat ${seat} no longer exists on table ${tableId}. ` +
                    `Cleaning up user:${userId}:seat key.`);
                await redis.del(`user:${userId}:seat`);
                return;
            }
            try {
                const parsed = JSON.parse(playerData);
                if (parsed.id !== userId) {
                    this.logger.warn(`♻️ SEAT MISMATCH: Seat ${seat} on ${tableId} belongs to ${parsed.id}, not ${userId}. ` +
                        `Cleaning up stale key.`);
                    await redis.del(`user:${userId}:seat`);
                    return;
                }
            }
            catch (_e) {
                this.logger.warn(`♻️ CORRUPT SEAT DATA for seat ${seat} on ${tableId}. Cleaning up.`);
                await redis.del(`user:${userId}:seat`);
                return;
            }
        }
        this.logger.log(`♻️ RE-SEATING: ${username} reconnected. ` +
            `New socket ${client.id} ` +
            `(table ${tableId}, seat ${seat})`);
        for (const [oldId, oldSession] of this.sessions.entries()) {
            if (oldSession.userId === userId) {
                this.sessions.delete(oldId);
            }
        }
        this.sessions.set(client.id, {
            tableId,
            seat,
            userId,
        });
        await client.join(`table:${tableId}`);
        try {
            await this.luaRunner.runScript('set_online', [`table:${tableId}:players`], [seat]);
        }
        catch (err) {
            this.logger.error(`Re-seating set_online error: ${err}`);
        }
        this.server.to(`table:${tableId}`).emit('player_connection_status', {
            seat,
            status: 'online',
            username,
        });
        try {
            const redis = this.luaRunner.getClient();
            const tableData = await redis.hgetall(`table:${tableId}`);
            const playersData = await redis.hgetall(`table:${tableId}:players`);
            const players = [];
            for (const key of Object.keys(playersData)) {
                if (key.startsWith('seat_')) {
                    try {
                        players.push(JSON.parse(playersData[key]));
                    }
                    catch (_f) { }
                }
            }
            const tableState = {
                table: Object.assign({ phase: 'waiting', pot: '0', currentBet: '0', turnSeat: '-1', dealerSeat: '0', communityCards: '[]' }, tableData),
                players,
            };
            const filteredState = this.filterStateForPlayer(tableState, seat);
            client.emit('table_state', filteredState);
            client.emit('session_recovered', {
                tableId,
                seat,
                username,
            });
            this.logger.log(`♻️ RE-SEATING complete: ${username} at seat ${seat} on table ${tableId}`);
            const phase = tableData.phase || 'waiting';
            if (phase === 'waiting' && !this.pendingStart.has(tableId)) {
                let activeCount = 0;
                for (const p of players) {
                    const status = p.status;
                    const connection = p.connection;
                    if (status && status !== 'sitting_out' && status !== 'left' && connection !== 'offline') {
                        activeCount++;
                    }
                }
                if (activeCount >= 2) {
                    this.pendingStart.add(tableId);
                    this.logger.log(`♻️ AUTO-START: ${activeCount} active+online players after reconnect, starting hand on ${tableId}`);
                    setTimeout(() => {
                        this.startNewHand(tableId);
                        setTimeout(() => this.pendingStart.delete(tableId), 3000);
                    }, 1500);
                }
            }
        }
        catch (err) {
            this.logger.error(`Re-seating state send error: ${err}`);
        }
    }
    async handleHeartbeat(client) {
        const session = this.sessions.get(client.id);
        if (!session)
            return;
        try {
            await this.luaRunner.runScript('set_heartbeat', [`last_seen:${session.tableId}:${session.seat}`], [Date.now().toString()]);
        }
        catch (err) {
            this.logger.error(`Heartbeat Lua error: ${err}`);
        }
    }
    getActiveSessions() {
        return this.sessions;
    }
    async handleDisconnect(client) {
        const authClient = client;
        const session = this.sessions.get(client.id);
        if (session && authClient.user) {
            let newerSessionExists = false;
            for (const [socketId, s] of this.sessions.entries()) {
                if (socketId !== client.id && s.userId === session.userId && s.tableId === session.tableId) {
                    newerSessionExists = true;
                    break;
                }
            }
            if (newerSessionExists) {
                this.logger.debug(`Stale disconnect ignored for ${authClient.user.username} (${client.id}) — newer socket active`);
                this.sessions.delete(client.id);
                return;
            }
            this.logger.log(`User ${authClient.user.username} disconnected from table ${session.tableId}`);
            try {
                const result = await this.luaRunner.runScript('set_offline', [`table:${session.tableId}:players`], [session.seat]);
                const response = JSON.parse(result);
                if (response.success) {
                    this.logger.log(`Soft disconnect: ${authClient.user.username} marked offline at seat ${session.seat}`);
                }
            }
            catch (error) {
                this.logger.error(`Error running set_offline.lua: ${error}`);
            }
            this.server.to(`table:${session.tableId}`).emit('player_connection_status', {
                seat: session.seat,
                status: 'offline',
                username: authClient.user.username,
            });
            this.sessions.delete(client.id);
        }
        else {
            this.logger.debug(`Anonymous client disconnected: ${client.id}`);
        }
    }
    handlePing(client) {
        return { event: 'pong', data: new Date().toISOString() };
    }
    async handleSubscribeTable(client, data) {
        var _a;
        const { tableId } = data;
        const user = client.user;
        this.logger.log(`${user.username} subscribing to table ${tableId} as spectator`);
        try {
            await this.gameService.initializeTableRedis(tableId);
            await client.join(`table:${tableId}`);
            const redis = this.luaRunner.getClient();
            const tableData = await redis.hgetall(`table:${tableId}`);
            const playersData = await redis.hgetall(`table:${tableId}:players`);
            const players = [];
            for (const key of Object.keys(playersData)) {
                if (key.startsWith('seat_')) {
                    try {
                        players.push(JSON.parse(playersData[key]));
                    }
                    catch (_b) { }
                }
            }
            const tableState = {
                table: Object.assign({ phase: 'waiting', pot: '0', currentBet: '0', turnSeat: '-1', dealerSeat: '0', communityCards: '[]' }, tableData),
                players,
            };
            let playerSeat = (_a = this.sessions.get(client.id)) === null || _a === void 0 ? void 0 : _a.seat;
            if (playerSeat === undefined) {
                const matchedPlayer = players.find(p => p.id === user.id);
                if (matchedPlayer && typeof matchedPlayer.seatNumber === 'number') {
                    playerSeat = matchedPlayer.seatNumber;
                    this.sessions.set(client.id, { tableId, seat: playerSeat, userId: user.id });
                    this.logger.debug(`subscribe_table: healed session for ${user.username} at seat ${playerSeat}`);
                }
            }
            const filteredState = this.filterStateForPlayer(tableState, playerSeat);
            client.emit('table_state', filteredState);
            this.logger.log(`Welcome package sent to ${user.username} for table ${tableId} (${players.length} players)`);
            return { success: true, message: 'Subscribed to table' };
        }
        catch (error) {
            this.logger.error(`Error subscribing to table: ${error}`);
            return { success: false, message: 'Failed to subscribe to table' };
        }
    }
    async handleJoinTable(client, data) {
        var _a, _b, _c, _d, _e;
        const { tableId, seatNumber, buyIn } = data;
        const user = client.user;
        this.logger.log(`${user.username} joining table ${tableId} seat ${seatNumber} with ${buyIn} chips`);
        try {
            await this.gameService.initializeTableRedis(tableId);
            const wallet = await this.walletService.getBalance(user.id);
            const userBalance = wallet.realBalance;
            await this.luaRunner.runScript('sync_balance', [`user:${user.id}:balance`], [userBalance.toString(), user.id]);
            const result = await this.luaRunner.runScript('join_table', [
                `table:${tableId}`,
                `table:${tableId}:players`,
                `user:${user.id}:balance`,
            ], [seatNumber, buyIn, user.id, user.username, user.avatarId]);
            const response = JSON.parse(result);
            if (!response.success) {
                return { success: false, message: response.message };
            }
            if (response.action === 'reconnected') {
                const seat = response.seat;
                this.logger.log(`${user.username} reconnected to seat ${seat} on table ${tableId}`);
                this.sessions.set(client.id, {
                    tableId,
                    seat,
                    userId: user.id
                });
                const redis = this.luaRunner.getClient();
                await redis.set(`user:${user.id}:seat`, JSON.stringify({ tableId, seat }));
                await client.join(`table:${tableId}`);
                try {
                    const onlineResult = await this.luaRunner.runScript('set_online', [`table:${tableId}:players`], [seat]);
                    const onlineResponse = JSON.parse(onlineResult);
                    if (onlineResponse.success) {
                        this.logger.log(`Reconnect: ${user.username} back online at seat ${seat} (status: ${onlineResponse.status})`);
                    }
                }
                catch (err) {
                    this.logger.error(`Error running set_online.lua: ${err}`);
                }
                this.server.to(`table:${tableId}`).emit('player_connection_status', {
                    seat,
                    status: 'online',
                    username: user.username,
                });
                if (response.tableState) {
                    const filteredState = this.filterStateForPlayer(response.tableState, seat);
                    client.emit('table_state', filteredState);
                }
                return { success: true, message: "Reconnected successfully" };
            }
            this.sessions.set(client.id, {
                tableId,
                seat: seatNumber,
                userId: user.id,
            });
            const redisClient = this.luaRunner.getClient();
            await redisClient.set(`user:${user.id}:seat`, JSON.stringify({ tableId, seat: seatNumber }));
            await client.join(`table:${tableId}`);
            if (response.tableState) {
                const currentPhase = ((_b = (_a = response.tableState) === null || _a === void 0 ? void 0 : _a.table) === null || _b === void 0 ? void 0 : _b.phase) || 'waiting';
                if (currentPhase === 'waiting') {
                    await this.broadcastTableState(tableId, response.tableState);
                }
                else {
                    const filteredState = this.filterStateForPlayer(response.tableState, seatNumber);
                    client.emit('table_state', filteredState);
                    const newPlayer = (_c = response.tableState.players) === null || _c === void 0 ? void 0 : _c.find((p) => Number(p.seatNumber) === Number(seatNumber));
                    if (newPlayer) {
                        const joinedPayload = {
                            player: {
                                id: String(newPlayer.id),
                                username: String(newPlayer.username),
                                chips: Number(newPlayer.chips),
                                status: String(newPlayer.status),
                                cards: Array.isArray(newPlayer.cards) ? newPlayer.cards.map(String) : [],
                                currentBet: Number((_d = newPlayer.currentBet) !== null && _d !== void 0 ? _d : 0),
                                seatNumber: Number(newPlayer.seatNumber),
                                avatarId: String((_e = newPlayer.avatarId) !== null && _e !== void 0 ? _e : 'avatar_1'),
                            },
                        };
                        client.to(`table:${tableId}`).emit('player_joined', joinedPayload);
                        this.logger.log(`🔴 Mid-hand join: emitted player_joined (seat ${seatNumber}) instead of full state broadcast`);
                    }
                }
            }
            if (response.triggerStart) {
                await this.startNewHand(tableId);
            }
            return { success: true, message: response.message };
        }
        catch (error) {
            this.logger.error(`Error joining table: ${error}`);
            return { success: false, message: 'Failed to join table' };
        }
    }
    async handleLeaveTable(client, data) {
        var _a, _b, _c;
        const { tableId } = data;
        const user = client.user;
        const session = this.sessions.get(client.id);
        if (!session || session.tableId !== tableId) {
            return { success: false, message: 'Not seated at this table' };
        }
        this.logger.log(`${user.username} leaving table ${tableId}`);
        try {
            this.clearTableTimer(tableId);
            const result = await this.luaRunner.runScript('leave_table', [
                `table:${tableId}`,
                `table:${tableId}:players`,
                `user:${user.id}:balance`,
            ], [session.seat, user.id, 'false']);
            const response = JSON.parse(result);
            if (!response.success) {
                return { success: false, message: response.message };
            }
            await client.leave(`table:${tableId}`);
            this.sessions.delete(client.id);
            const redisClient = this.luaRunner.getClient();
            await redisClient.del(`user:${user.id}:seat`);
            if (response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
            }
            const phase = ((_b = (_a = response.tableState) === null || _a === void 0 ? void 0 : _a.table) === null || _b === void 0 ? void 0 : _b.phase) || 'waiting';
            const remainingActive = (_c = response.remainingActive) !== null && _c !== void 0 ? _c : 0;
            if (remainingActive >= 2 && phase === 'waiting') {
                this.logger.log(`[Leave] ${remainingActive} active players remain on table ${tableId}, auto-resuming...`);
                setTimeout(() => this.startNewHand(tableId), 1000);
            }
            return { success: true, message: response.message };
        }
        catch (error) {
            this.logger.error(`Error leaving table: ${error}`);
            return { success: false, message: 'Failed to leave table' };
        }
    }
    async handleToggleSitOut(client, data) {
        var _a, _b;
        const { tableId } = data;
        const user = client.user;
        let session = this.sessions.get(client.id);
        if (!session || session.tableId !== tableId) {
            const redis = this.luaRunner.getClient();
            const seatData = await redis.get(`user:${user.id}:seat`);
            if (seatData) {
                const parsed = JSON.parse(seatData);
                if (parsed.tableId === tableId) {
                    session = { tableId, seat: parsed.seat, userId: user.id };
                    this.sessions.set(client.id, session);
                    this.logger.log(`♻️ SIT-OUT SELF-HEAL: Recovered session for ${user.username} at seat ${parsed.seat}`);
                }
            }
        }
        if (!session || session.tableId !== tableId) {
            return { success: false, message: 'Not seated at this table' };
        }
        try {
            const result = await this.luaRunner.runScript('toggle_sit_out', [`table:${tableId}:players`], [session.seat]);
            const response = JSON.parse(result);
            if (response.success && response.player) {
                const redis = this.luaRunner.getClient();
                const tableData = await redis.hgetall(`table:${tableId}`);
                const players = [];
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (pData) {
                        players.push(JSON.parse(pData));
                    }
                }
                const freshState = {
                    table: Object.assign(Object.assign({}, tableData), { pot: Number(tableData.pot || 0), currentBet: Number(tableData.currentBet || 0), turnSeat: Number((_a = tableData.turnSeat) !== null && _a !== void 0 ? _a : -1), dealerSeat: Number(tableData.dealerSeat || 0), smallBlindSeat: Number(tableData.smallBlindSeat || 0), bigBlindSeat: Number(tableData.bigBlindSeat || 0), communityCards: JSON.parse(tableData.communityCards || '[]') }),
                    players,
                };
                await this.broadcastTableState(tableId, freshState);
                const sweeperKey = `${tableId}:${session.seat}`;
                if (response.player.status === 'sitting_out') {
                    const bankMs = ((_b = response.sitOutBank) !== null && _b !== void 0 ? _b : 900) * 1000;
                    const existing = this.sitOutSweepers.get(sweeperKey);
                    if (existing)
                        clearTimeout(existing);
                    if (bankMs <= 0) {
                        this.logger.log(`⏰ SWEEPER: ${user.username} bank depleted → auto Stand Up on table ${tableId}`);
                        try {
                            await this.forceStandUp(tableId, session.seat, user.id);
                        }
                        catch (err) {
                            this.logger.error(`SWEEPER auto-kick failed: ${err.message}`);
                        }
                    }
                    else {
                        this.logger.log(`⏰ SWEEPER: Scheduling auto-kick for ${user.username} in ${bankMs / 1000}s`);
                        const timer = setTimeout(async () => {
                            this.sitOutSweepers.delete(sweeperKey);
                            try {
                                const pData = await redis.hget(`table:${tableId}:players`, `seat_${session.seat}`);
                                if (pData) {
                                    const p = JSON.parse(pData);
                                    if (p.status === 'sitting_out') {
                                        this.logger.log(`⏰ SWEEPER FIRED: ${p.username} auto Stand Up on table ${tableId}`);
                                        await this.forceStandUp(tableId, session.seat, p.id);
                                    }
                                }
                            }
                            catch (err) {
                                this.logger.error(`SWEEPER timeout error: ${err.message}`);
                            }
                        }, bankMs);
                        this.sitOutSweepers.set(sweeperKey, timer);
                    }
                }
                else {
                    const existing = this.sitOutSweepers.get(sweeperKey);
                    if (existing) {
                        clearTimeout(existing);
                        this.sitOutSweepers.delete(sweeperKey);
                        this.logger.log(`⏰ SWEEPER CANCELLED: ${user.username} returned (${response.sitOutBank}s remaining)`);
                    }
                }
                const activeCount = response.activeCount || 0;
                const phase = tableData.phase || 'waiting';
                if (activeCount >= 2 && phase === 'waiting') {
                    this.logger.log(`[SitOut] Player returned → ${activeCount} active players, starting hand on table ${tableId}`);
                    setTimeout(() => this.startNewHand(tableId), 1000);
                }
                return { success: true, message: "Status toggled", player: response.player };
            }
            return { success: false, message: response.message || "Failed to toggle status" };
        }
        catch (error) {
            this.logger.error(`Error toggling sit out: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }
    async forceStandUp(tableId, seat, userId) {
        var _a, _b, _c;
        try {
            const result = await this.luaRunner.runScript('leave_table', [
                `table:${tableId}`,
                `table:${tableId}:players`,
                `user:${userId}:balance`,
            ], [seat, userId, 'false']);
            const response = JSON.parse(result);
            if (!response.success) {
                this.logger.error(`forceStandUp failed for ${userId}: ${response.message}`);
                return;
            }
            for (const [socketId, session] of this.sessions.entries()) {
                if (session.userId === userId && session.tableId === tableId) {
                    this.sessions.delete(socketId);
                    const redis = this.luaRunner.getClient();
                    await redis.del(`user:${userId}:seat`);
                    break;
                }
            }
            if (response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
            }
            const phase = ((_b = (_a = response.tableState) === null || _a === void 0 ? void 0 : _a.table) === null || _b === void 0 ? void 0 : _b.phase) || 'waiting';
            const remainingActive = (_c = response.remainingActive) !== null && _c !== void 0 ? _c : 0;
            if (remainingActive >= 2 && phase === 'waiting') {
                setTimeout(() => this.startNewHand(tableId), 1000);
            }
            this.logger.log(`\u2705 forceStandUp: ${userId} removed from seat ${seat} on table ${tableId}`);
        }
        catch (error) {
            this.logger.error(`forceStandUp error: ${error.message}`);
        }
    }
    async handleToggleLNBB(client, data) {
        var _a;
        const { tableId, value } = data;
        const user = client.user;
        let session = this.sessions.get(client.id);
        if (!session || session.tableId !== tableId) {
            const redis = this.luaRunner.getClient();
            const seatData = await redis.get(`user:${user.id}:seat`);
            if (seatData) {
                const parsed = JSON.parse(seatData);
                if (parsed.tableId === tableId) {
                    session = { tableId, seat: parsed.seat, userId: user.id };
                    this.sessions.set(client.id, session);
                    this.logger.log(`♻️ LNBB SELF-HEAL: Recovered session for ${user.username} at seat ${parsed.seat}`);
                }
            }
        }
        if (!session || session.tableId !== tableId) {
            return { success: false, message: 'Not seated at this table' };
        }
        try {
            const result = await this.luaRunner.runScript('toggle_lnbb', [`table:${tableId}:players`], [session.seat, value.toString()]);
            const response = JSON.parse(result);
            if (response.success) {
                const redis = this.luaRunner.getClient();
                const tableData = await redis.hgetall(`table:${tableId}`);
                const players = [];
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (pData) {
                        players.push(JSON.parse(pData));
                    }
                }
                const freshState = {
                    table: Object.assign(Object.assign({}, tableData), { pot: Number(tableData.pot || 0), currentBet: Number(tableData.currentBet || 0), turnSeat: Number((_a = tableData.turnSeat) !== null && _a !== void 0 ? _a : -1), dealerSeat: Number(tableData.dealerSeat || 0), smallBlindSeat: Number(tableData.smallBlindSeat || 0), bigBlindSeat: Number(tableData.bigBlindSeat || 0), communityCards: JSON.parse(tableData.communityCards || '[]') }),
                    players,
                };
                await this.broadcastTableState(tableId, freshState);
                return { success: true, message: `LNBB ${value ? 'enabled' : 'disabled'}` };
            }
            return { success: false, message: response.message || 'Failed to toggle LNBB' };
        }
        catch (error) {
            this.logger.error(`Error toggling LNBB: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }
    async handleToggleAutoRebuy(client, data) {
        var _a;
        const { tableId, value } = data;
        const user = client.user;
        let session = this.sessions.get(client.id);
        if (!session || session.tableId !== tableId) {
            const redis = this.luaRunner.getClient();
            const seatData = await redis.get(`user:${user.id}:seat`);
            if (seatData) {
                const parsed = JSON.parse(seatData);
                if (parsed.tableId === tableId) {
                    session = { tableId, seat: parsed.seat, userId: user.id };
                    this.sessions.set(client.id, session);
                    this.logger.log(`♻️ AUTO_REBUY SELF-HEAL: Recovered session for ${user.username} at seat ${parsed.seat}`);
                }
            }
        }
        if (!session || session.tableId !== tableId) {
            return { success: false, message: 'Not seated at this table' };
        }
        try {
            const result = await this.luaRunner.runScript('toggle_auto_rebuy', [`table:${tableId}:players`], [session.seat, value.toString()]);
            const response = JSON.parse(result);
            if (response.success) {
                const redis = this.luaRunner.getClient();
                const tableData = await redis.hgetall(`table:${tableId}`);
                const players = [];
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (pData) {
                        players.push(JSON.parse(pData));
                    }
                }
                const freshState = {
                    table: Object.assign(Object.assign({}, tableData), { pot: Number(tableData.pot || 0), currentBet: Number(tableData.currentBet || 0), turnSeat: Number((_a = tableData.turnSeat) !== null && _a !== void 0 ? _a : -1), dealerSeat: Number(tableData.dealerSeat || 0), smallBlindSeat: Number(tableData.smallBlindSeat || 0), bigBlindSeat: Number(tableData.bigBlindSeat || 0), communityCards: JSON.parse(tableData.communityCards || '[]') }),
                    players,
                };
                await this.broadcastTableState(tableId, freshState);
                return { success: true, message: `Auto Rebuy ${value ? 'enabled' : 'disabled'}` };
            }
            return { success: false, message: response.message || 'Failed to toggle Auto Rebuy' };
        }
        catch (error) {
            this.logger.error(`Error toggling Auto Rebuy: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }
    async handleAddChips(client, data) {
        const { tableId, amount } = data;
        const user = client.user;
        const session = this.sessions.get(client.id);
        if (!session || session.tableId !== tableId) {
            return { success: false, message: 'Not seated at this table' };
        }
        this.logger.log(`${user.username} adding ${amount} chips on table ${tableId}`);
        try {
            const result = await this.luaRunner.runScript('add_chips', [
                `table:${tableId}:players`,
                `user:${user.id}:balance`,
            ], [session.seat, amount]);
            const response = JSON.parse(result);
            if (!response.success) {
                return { success: false, message: response.message };
            }
            const redis = this.luaRunner.getClient();
            const playersData = await redis.hgetall(`table:${tableId}:players`);
            const tableData = await redis.hgetall(`table:${tableId}`);
            const players = [];
            for (const key of Object.keys(playersData)) {
                if (key.startsWith('seat_')) {
                    try {
                        players.push(JSON.parse(playersData[key]));
                    }
                    catch (_a) { }
                }
            }
            const tableState = {
                table: tableData,
                players,
            };
            await this.broadcastTableState(tableId, tableState);
            this.server.to(`table:${tableId}`).emit('player_reloaded', {
                seat: session.seat,
                username: user.username,
                chips: response.tableChips,
            });
            const activeCount = players.filter((p) => p.status === 'active' || p.status === 'waiting').length;
            if (activeCount >= 2) {
                const phase = tableData.phase || 'waiting';
                if (phase === 'waiting') {
                    setTimeout(() => this.startNewHand(tableId), 1000);
                }
            }
            return {
                success: true,
                message: response.message,
                tableChips: response.tableChips,
                walletBalance: response.walletBalance,
            };
        }
        catch (error) {
            this.logger.error(`Error adding chips: ${error}`);
            return { success: false, message: 'Failed to add chips' };
        }
    }
    async handleAction(client, data) {
        var _a, _b, _c, _d, _e, _f;
        const { tableId, action, amount = 0 } = data;
        const user = client.user;
        let session = this.sessions.get(client.id);
        if (!session || session.tableId !== tableId) {
            const redis = this.luaRunner.getClient();
            const seatData = await redis.get(`user:${user.id}:seat`);
            if (seatData) {
                const parsed = JSON.parse(seatData);
                if (parsed.tableId === tableId) {
                    session = { tableId, seat: parsed.seat, userId: user.id };
                    this.sessions.set(client.id, session);
                    this.logger.log(`♻️ ACTION SELF-HEAL: Recovered session for ${user.username} at seat ${parsed.seat}`);
                }
            }
        }
        if (!session || session.tableId !== tableId) {
            return { success: false, message: 'Not seated at this table' };
        }
        this.logger.log(`${user.username} action: ${action} (${amount}) on table ${tableId}`);
        try {
            const result = await this.luaRunner.runScript('bet', [
                `table:${tableId}`,
                `table:${tableId}:players`,
            ], [session.seat, action, amount]);
            await this.timerService.cancelTimeout(tableId);
            const response = JSON.parse(result);
            if (!response.success) {
                client.emit('action_error', {
                    message: response.message,
                    code: 'LUA_REJECTION',
                });
                return { success: false, message: response.message };
            }
            this.logger.warn(`[ALL-IN DEBUG] bet.lua response for table ${tableId}: ` +
                JSON.stringify({
                    allPlayersAllIn: response.allPlayersAllIn,
                    nextStreet: response.nextStreet,
                    handComplete: response.handComplete,
                    winningSeat: response.winningSeat,
                }));
            if (response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
            }
            if (response.uncalledBetRefund) {
                this.logger.log(`[UNCALLED] Refunding ${response.uncalledBetRefund.amount} to seat ${response.uncalledBetRefund.seat} on table ${tableId}`);
                this.server.to(`table:${tableId}`).emit('uncalled_bet_returned', {
                    seat: response.uncalledBetRefund.seat,
                    amount: response.uncalledBetRefund.amount,
                });
            }
            if (response.handComplete) {
                this.server.to(`table:${tableId}`).emit('hand_result', {
                    winningSeat: response.winningSeat,
                    message: 'Hand complete',
                    nextHandDelay: CELEBRATION_DELAY_MS,
                    nextHandTimestamp: Date.now() + CELEBRATION_DELAY_MS,
                });
                const celebTimer = setTimeout(() => {
                    this.autoAdvanceTimers.delete(tableId);
                    this.startNewHand(tableId);
                }, CELEBRATION_DELAY_MS);
                this.autoAdvanceTimers.set(tableId, celebTimer);
                return { success: true, message: response.message };
            }
            if (response.allPlayersAllIn || (response.nextStreet && !response.handComplete)) {
                this.logger.log(`Advancing street on table ${tableId} (allIn=${response.allPlayersAllIn}, nextStreet=${response.nextStreet})`);
                await this.advanceStreet(tableId);
                return { success: true, message: response.message };
            }
            const turnSeat = Number((_f = (_c = (_b = (_a = response.tableState) === null || _a === void 0 ? void 0 : _a.table) === null || _b === void 0 ? void 0 : _b.turn_seat) !== null && _c !== void 0 ? _c : (_e = (_d = response.tableState) === null || _d === void 0 ? void 0 : _d.table) === null || _e === void 0 ? void 0 : _e.turnSeat) !== null && _f !== void 0 ? _f : -1);
            if (turnSeat >= 0) {
                const turnTimeMs = await this.getDynamicTurnTime(tableId);
                this.server.to(`table:${tableId}`).emit('your_turn', {
                    seat: turnSeat,
                    timeoutMs: turnTimeMs,
                    serverTime: Date.now(),
                });
                await this.timerService.scheduleTimeout(tableId, turnSeat, turnTimeMs);
            }
            return { success: true, message: response.message };
        }
        catch (error) {
            this.logger.error(`Error processing action: ${error}`);
            return { success: false, message: 'Failed to process action' };
        }
    }
    async startNewHand(tableId) {
        var _a;
        this.logger.log(`Starting new hand on table ${tableId}`);
        try {
            const redis = this.luaRunner.getClient();
            const currentPhase = await redis.hget(`table:${tableId}`, 'phase');
            if (currentPhase && currentPhase !== 'waiting' && currentPhase !== 'showdown') {
                this.logger.warn(`startNewHand aborted for ${tableId}: phase is '${currentPhase}', not 'waiting' or 'showdown'`);
                return;
            }
            try {
                const configData = await redis.hgetall(`table:${tableId}:config`);
                const minBuyIn = Number(configData.minBuyIn) || 1000;
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (!pData)
                        continue;
                    const player = JSON.parse(pData);
                    if (player.autoRebuy && (player.chips === 0 || player.chips === '0') &&
                        player.status !== 'left' && player.status !== 'disconnected') {
                        try {
                            this.logger.log(`🤖 AUTO-REBUY: Firing rebuy for ${player.username} (seat ${i}) — $${minBuyIn}`);
                            await this.gameService.rebuy(player.id, tableId, minBuyIn);
                        }
                        catch (rebuyErr) {
                            this.logger.warn(`🤖 AUTO-REBUY FAILED for ${player.username}: ${rebuyErr.message}. Disabling flag.`);
                            player.autoRebuy = false;
                            await redis.hset(`table:${tableId}:players`, `seat_${i}`, JSON.stringify(player));
                        }
                    }
                }
            }
            catch (autoRebuyErr) {
                this.logger.error(`Auto-rebuy sweep error on ${tableId}: ${autoRebuyErr}`);
            }
            const deck = (0, shared_1.createShuffledDeck)();
            const result = await this.luaRunner.runScript('next_hand', [
                `table:${tableId}`,
                `table:${tableId}:players`,
                `table:${tableId}:deck`,
            ], [JSON.stringify(deck)]);
            const response = JSON.parse(result);
            if (response.success && response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
                const turnSeat = (_a = response.tableState.table) === null || _a === void 0 ? void 0 : _a.turnSeat;
                if (typeof turnSeat === 'number' && turnSeat >= 0) {
                    const turnTimeMs = await this.getDynamicTurnTime(tableId);
                    this.server.to(`table:${tableId}`).emit('your_turn', {
                        seat: turnSeat,
                        timeoutMs: turnTimeMs,
                        serverTime: Date.now(),
                    });
                    await this.timerService.scheduleTimeout(tableId, turnSeat, turnTimeMs);
                }
            }
            else if (response.waitingForPlayers && response.tableState) {
                this.logger.log(`Table ${tableId} waiting for players - broadcasting sitting_out state`);
                await this.broadcastTableState(tableId, response.tableState);
                this.pendingStart.delete(tableId);
            }
        }
        catch (error) {
            this.logger.error(`Error starting new hand: ${error}`);
        }
    }
    async advanceStreet(tableId) {
        var _a;
        this.logger.log(`Advancing street on table ${tableId}`);
        try {
            const redis = this.luaRunner.getClient();
            const currentPhase = await redis.hget(`table:${tableId}`, 'phase');
            if (currentPhase === 'waiting' || currentPhase === 'finished') {
                this.logger.warn(`[advanceStreet] Aborting: Table ${tableId} is in phase '${currentPhase}'`);
                this.autoAdvanceTimers.delete(tableId);
                return;
            }
        }
        catch (phaseErr) {
            this.logger.error(`[advanceStreet] Phase check failed: ${phaseErr}`);
        }
        try {
            const result = await this.luaRunner.runScript('next_street', [
                `table:${tableId}`,
                `table:${tableId}:players`,
                `table:${tableId}:deck`,
            ], []);
            const response = JSON.parse(result);
            this.logger.warn(`[ALL-IN DEBUG] next_street.lua response for table ${tableId}: ` +
                JSON.stringify({
                    success: response.success,
                    phase: response.phase,
                    isShowdown: response.isShowdown,
                    allPlayersAllIn: response.allPlayersAllIn,
                }));
            if (response.success && response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
                if (response.isShowdown) {
                    this.logger.log(`[ALL-IN DEBUG] Showdown reached on table ${tableId}, evaluating hands...`);
                    await this.handleShowdown(tableId);
                }
                else if (response.allPlayersAllIn) {
                    this.logger.log(`[ALL-IN DEBUG] All players all-in on table ${tableId}, cinematic advance in 2s...`);
                    const advTimer = setTimeout(() => {
                        this.autoAdvanceTimers.delete(tableId);
                        this.advanceStreet(tableId);
                    }, 2000);
                    this.autoAdvanceTimers.set(tableId, advTimer);
                }
                else {
                    const turnSeat = (_a = response.tableState.table) === null || _a === void 0 ? void 0 : _a.turnSeat;
                    if (typeof turnSeat === 'number' && turnSeat >= 0) {
                        const turnTimeMs = await this.getDynamicTurnTime(tableId);
                        this.server.to(`table:${tableId}`).emit('your_turn', {
                            seat: turnSeat,
                            timeoutMs: turnTimeMs,
                            serverTime: Date.now(),
                        });
                        await this.timerService.scheduleTimeout(tableId, turnSeat, turnTimeMs);
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`Error advancing street: ${error}`);
        }
    }
    async handleShowdown(tableId) {
        var _a;
        this.logger.log(`Showdown on table ${tableId}`);
        try {
            const phaseCheck = await (this.luaRunner.getClient()).hget(`table:${tableId}`, 'phase');
            if (phaseCheck !== 'showdown') {
                this.logger.warn(`[handleShowdown] Aborting: Table ${tableId} phase is '${phaseCheck}', not showdown`);
                return;
            }
        }
        catch (phaseErr) {
            this.logger.error(`[handleShowdown] Phase check failed: ${phaseErr}`);
        }
        try {
            const redis = this.luaRunner.getClient();
            const tableData = await redis.hgetall(`table:${tableId}`);
            const pot = parseInt(tableData.pot || '0', 10);
            const communityCards = JSON.parse(tableData.communityCards || '[]');
            const playersData = await redis.hgetall(`table:${tableId}:players`);
            const players = [];
            for (const [key, value] of Object.entries(playersData)) {
                if (key.startsWith('seat_')) {
                    const player = JSON.parse(value);
                    players.push({
                        seat: player.seatNumber,
                        cards: player.cards || [],
                        chips: player.chips || 0,
                        status: player.status || 'folded',
                        totalContribution: player.totalContribution || 0,
                    });
                }
            }
            this.server.to(`table:${tableId}`).emit('showdown', {
                message: 'Showdown - revealing hands...',
                players: players.filter(p => p.status === 'active' || p.status === 'all-in'),
                communityCards,
            });
            const handScores = this.handEvaluator.evaluateHandScores(players, communityCards);
            if (handScores.length === 0) {
                this.logger.warn('No active players with scores for showdown');
                const fallbackTimer = setTimeout(() => {
                    this.autoAdvanceTimers.delete(tableId);
                    this.startNewHand(tableId);
                }, 3000);
                this.autoAdvanceTimers.set(tableId, fallbackTimer);
                return;
            }
            const configKey = `table:${tableId}:config`;
            const [rakePercentStr, rakeCapStr] = await Promise.all([
                redis.hget(configKey, 'rakePercent'),
                redis.hget(configKey, 'rakeCap'),
            ]);
            const rakePercent = parseFloat(rakePercentStr || '5') / 100;
            const rakeCap = parseInt(rakeCapStr || '500', 10);
            const result = await this.luaRunner.runScript('showdown', [
                `table:${tableId}`,
                `table:${tableId}:players`,
            ], [
                JSON.stringify(handScores),
                rakePercent.toString(),
                rakeCap.toString()
            ]);
            const response = JSON.parse(result);
            if (response.success) {
                const enrichedWinners = (response.winners || []).map((w) => {
                    var _a;
                    const scoreData = handScores.find(s => s.seat === w.seat);
                    return Object.assign(Object.assign({}, w), { handDescription: (scoreData === null || scoreData === void 0 ? void 0 : scoreData.handDescription) || w.handDescription, winningCards: (_a = scoreData === null || scoreData === void 0 ? void 0 : scoreData.winningCards) !== null && _a !== void 0 ? _a : [] });
                });
                const sortedScores = [...handScores].sort((a, b) => b.score - a.score);
                const handName = ((_a = sortedScores[0]) === null || _a === void 0 ? void 0 : _a.handDescription) || '';
                const revealedHands = players
                    .filter(p => p.status === 'active' || p.status === 'all-in')
                    .map(p => {
                    const scoreData = handScores.find(s => s.seat === p.seat);
                    return {
                        seat: p.seat,
                        cards: p.cards,
                        handDescription: (scoreData === null || scoreData === void 0 ? void 0 : scoreData.handDescription) || '',
                    };
                });
                const aggregatedWinners = Object.values(enrichedWinners.reduce((acc, w) => {
                    if (!acc[w.seat]) {
                        acc[w.seat] = Object.assign({}, w);
                    }
                    else {
                        acc[w.seat].amount += w.amount;
                        if (w.type === 'win')
                            acc[w.seat].type = 'win';
                    }
                    return acc;
                }, {}));
                this.server.to(`table:${tableId}`).emit('hand_result', {
                    winners: aggregatedWinners,
                    handName,
                    revealedHands,
                    message: `Hand over. Pots distributed.`,
                    nextHandDelay: CELEBRATION_DELAY_MS,
                    nextHandTimestamp: Date.now() + CELEBRATION_DELAY_MS,
                });
            }
            const showdownTimer = setTimeout(() => {
                this.autoAdvanceTimers.delete(tableId);
                this.startNewHand(tableId);
            }, CELEBRATION_DELAY_MS);
            this.autoAdvanceTimers.set(tableId, showdownTimer);
        }
        catch (error) {
            this.logger.error(`Error handling showdown: ${error}`);
            const recoveryTimer = setTimeout(() => {
                this.autoAdvanceTimers.delete(tableId);
                this.startNewHand(tableId);
            }, 5000);
            this.autoAdvanceTimers.set(tableId, recoveryTimer);
        }
    }
    async handleJoinWaitlist(client, data) {
        var _a, _b, _c;
        const { tableId } = data;
        const userId = (_a = client.user) === null || _a === void 0 ? void 0 : _a.id;
        const username = ((_b = client.user) === null || _b === void 0 ? void 0 : _b.username) || 'Unknown';
        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }
        try {
            const payload = JSON.stringify({
                userId,
                username,
                avatarId: ((_c = client.user) === null || _c === void 0 ? void 0 : _c.avatarId) || 'avatar_1',
            });
            const result = await this.luaRunner.runScript('waitlist', [`table:${tableId}:waitlist`], ['join', payload]);
            const response = JSON.parse(result);
            if (!response.success) {
                client.emit('error', { message: response.message });
                return;
            }
            client.join(`table:${tableId}`);
            const redis = this.luaRunner.getClient();
            const tableState = await this.getTableStateFromRedis(redis, tableId);
            if (tableState) {
                await this.broadcastTableState(tableId, tableState);
            }
            this.logger.log(`User ${username} joined waitlist for table ${tableId}`);
        }
        catch (error) {
            this.logger.error(`Error joining waitlist: ${error}`);
            client.emit('error', { message: 'Failed to join waitlist' });
        }
    }
    async handleLeaveWaitlist(client, data) {
        var _a;
        const { tableId } = data;
        const userId = (_a = client.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }
        try {
            await this.luaRunner.runScript('waitlist', [`table:${tableId}:waitlist`], ['leave', userId]);
            const redis = this.luaRunner.getClient();
            const tableState = await this.getTableStateFromRedis(redis, tableId);
            if (tableState) {
                await this.broadcastTableState(tableId, tableState);
            }
            this.logger.log(`User ${userId} left waitlist for table ${tableId}`);
        }
        catch (error) {
            this.logger.error(`Error leaving waitlist: ${error}`);
            client.emit('error', { message: 'Failed to leave waitlist' });
        }
    }
    async getTableStateFromRedis(redis, tableId) {
        const tableData = await redis.hgetall(`table:${tableId}`);
        if (!tableData || Object.keys(tableData).length === 0)
            return null;
        const playersData = await redis.hgetall(`table:${tableId}:players`);
        const players = [];
        for (const key of Object.keys(playersData)) {
            if (key.startsWith('seat_')) {
                try {
                    players.push(JSON.parse(playersData[key]));
                }
                catch (_a) { }
            }
        }
        return {
            table: Object.assign({ phase: 'waiting', pot: '0', currentBet: '0', turnSeat: '-1', dealerSeat: '0', communityCards: '[]' }, tableData),
            players,
        };
    }
    async broadcastTableState(tableId, state) {
        var _a, _b, _c, _d, _e;
        try {
            const waitlistResult = await this.luaRunner.runScript('waitlist', [`table:${tableId}:waitlist`], ['list']);
            const waitlistData = JSON.parse(waitlistResult);
            if (waitlistData.success && Array.isArray(waitlistData.waitlist)) {
                state.waitlist = waitlistData.waitlist;
            }
            else {
                state.waitlist = [];
            }
        }
        catch (_f) {
            state.waitlist = [];
        }
        const sockets = await this.server.in(`table:${tableId}`).fetchSockets();
        const seatedPlayerIds = new Set();
        if (state.players && Array.isArray(state.players)) {
            for (const p of state.players) {
                if (p.id)
                    seatedPlayerIds.add(p.id);
            }
        }
        const observersSeen = new Set();
        const observers = [];
        for (const socket of sockets) {
            const authSocket = socket;
            const userId = (_a = authSocket.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId)
                continue;
            if (seatedPlayerIds.has(userId))
                continue;
            if (observersSeen.has(userId))
                continue;
            observersSeen.add(userId);
            observers.push({
                userId,
                username: ((_b = authSocket.user) === null || _b === void 0 ? void 0 : _b.username) || 'Observer',
                avatarId: ((_c = authSocket.user) === null || _c === void 0 ? void 0 : _c.avatarId) || 'avatar_1',
            });
        }
        state.observers = observers;
        for (const socket of sockets) {
            let seat = (_d = this.sessions.get(socket.id)) === null || _d === void 0 ? void 0 : _d.seat;
            if (seat === undefined) {
                const authSocket = socket;
                const userId = (_e = authSocket.user) === null || _e === void 0 ? void 0 : _e.id;
                if (userId && state.players && Array.isArray(state.players)) {
                    const matchedPlayer = state.players
                        .find(p => p.id === userId);
                    if (matchedPlayer && typeof matchedPlayer.seatNumber === 'number') {
                        seat = matchedPlayer.seatNumber;
                        this.sessions.set(socket.id, { tableId, seat, userId });
                        this.logger.debug(`broadcastTableState: repaired session for ${userId} at seat ${seat}`);
                    }
                }
            }
            const filteredState = this.filterStateForPlayer(state, seat);
            socket.emit('table_state', filteredState);
        }
    }
    filterStateForPlayer(state, playerSeat) {
        const filtered = JSON.parse(JSON.stringify(state));
        if (filtered.players && Array.isArray(filtered.players)) {
            filtered.players = filtered.players.map((player) => {
                if (player.seatNumber !== playerSeat) {
                    const table = filtered.table;
                    if ((table === null || table === void 0 ? void 0 : table.phase) !== 'showdown') {
                        return Object.assign(Object.assign({}, player), { cards: player.cards ? ['??', '??'] : [] });
                    }
                }
                return player;
            });
        }
        return filtered;
    }
    getSessionByUserId(userId, tableId) {
        for (const session of this.sessions.values()) {
            if (session.userId === userId && session.tableId === tableId) {
                return session;
            }
        }
        return null;
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_g = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _g : Object)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], GameGateway.prototype, "handleHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _k : Object]),
    __metadata("design:returntype", Object)
], GameGateway.prototype, "handlePing", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('subscribe_table'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.SubscribeTableEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _l : Object, typeof (_m = typeof shared_1.SubscribeTableEvent !== "undefined" && shared_1.SubscribeTableEvent) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], GameGateway.prototype, "handleSubscribeTable", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('join_table'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.JoinTableEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _p : Object, typeof (_q = typeof shared_1.JoinTableEvent !== "undefined" && shared_1.JoinTableEvent) === "function" ? _q : Object]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], GameGateway.prototype, "handleJoinTable", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leave_table'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.LeaveTableEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_s = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _s : Object, typeof (_t = typeof shared_1.LeaveTableEvent !== "undefined" && shared_1.LeaveTableEvent) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], GameGateway.prototype, "handleLeaveTable", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('toggle_sit_out'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.ToggleSitOutEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _v : Object, typeof (_w = typeof shared_1.ToggleSitOutEvent !== "undefined" && shared_1.ToggleSitOutEvent) === "function" ? _w : Object]),
    __metadata("design:returntype", typeof (_x = typeof Promise !== "undefined" && Promise) === "function" ? _x : Object)
], GameGateway.prototype, "handleToggleSitOut", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('toggle_lnbb'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.ToggleLNBBEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_y = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _y : Object, typeof (_z = typeof shared_1.ToggleLNBBEvent !== "undefined" && shared_1.ToggleLNBBEvent) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], GameGateway.prototype, "handleToggleLNBB", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('toggle_auto_rebuy'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.ToggleAutoRebuyEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _1 : Object, typeof (_2 = typeof shared_1.ToggleAutoRebuyEvent !== "undefined" && shared_1.ToggleAutoRebuyEvent) === "function" ? _2 : Object]),
    __metadata("design:returntype", typeof (_3 = typeof Promise !== "undefined" && Promise) === "function" ? _3 : Object)
], GameGateway.prototype, "handleToggleAutoRebuy", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('add_chips'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.AddChipsEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_4 = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _4 : Object, typeof (_5 = typeof shared_1.AddChipsEvent !== "undefined" && shared_1.AddChipsEvent) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], GameGateway.prototype, "handleAddChips", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('action'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.BetActionSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _7 : Object, typeof (_8 = typeof shared_1.BetAction !== "undefined" && shared_1.BetAction) === "function" ? _8 : Object]),
    __metadata("design:returntype", typeof (_9 = typeof Promise !== "undefined" && Promise) === "function" ? _9 : Object)
], GameGateway.prototype, "handleAction", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('join_waitlist'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)(new ws_zod_pipe_1.WsZodPipe(shared_1.JoinWaitlistEventSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_10 = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _10 : Object, typeof (_11 = typeof shared_1.JoinWaitlistEvent !== "undefined" && shared_1.JoinWaitlistEvent) === "function" ? _11 : Object]),
    __metadata("design:returntype", typeof (_12 = typeof Promise !== "undefined" && Promise) === "function" ? _12 : Object)
], GameGateway.prototype, "handleJoinWaitlist", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leave_waitlist'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)(new ws_zod_pipe_1.WsZodPipe(shared_1.LeaveWaitlistEventSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_13 = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _13 : Object, typeof (_14 = typeof shared_1.LeaveWaitlistEvent !== "undefined" && shared_1.LeaveWaitlistEvent) === "function" ? _14 : Object]),
    __metadata("design:returntype", typeof (_15 = typeof Promise !== "undefined" && Promise) === "function" ? _15 : Object)
], GameGateway.prototype, "handleLeaveWaitlist", null);
exports.GameGateway = GameGateway = GameGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/game',
    }),
    (0, common_1.UseGuards)(ws_throttler_guard_1.WsThrottlerGuard),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_service_1.GameService))),
    __metadata("design:paramtypes", [typeof (_a = typeof lua_runner_service_1.LuaRunnerService !== "undefined" && lua_runner_service_1.LuaRunnerService) === "function" ? _a : Object, typeof (_b = typeof wallet_service_1.WalletService !== "undefined" && wallet_service_1.WalletService) === "function" ? _b : Object, typeof (_c = typeof hand_evaluator_service_1.HandEvaluatorService !== "undefined" && hand_evaluator_service_1.HandEvaluatorService) === "function" ? _c : Object, typeof (_d = typeof timer_service_1.TimerService !== "undefined" && timer_service_1.TimerService) === "function" ? _d : Object, typeof (_e = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _e : Object, typeof (_f = typeof game_service_1.GameService !== "undefined" && game_service_1.GameService) === "function" ? _f : Object])
], GameGateway);


/***/ }),
/* 68 */
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

/***/ }),
/* 69 */
/***/ ((module) => {

module.exports = require("socket.io");

/***/ }),
/* 70 */
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),
/* 71 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GameService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameService = void 0;
const common_1 = __webpack_require__(3);
const wallet_service_1 = __webpack_require__(55);
const lua_runner_service_1 = __webpack_require__(61);
const game_gateway_1 = __webpack_require__(67);
const prisma_service_1 = __webpack_require__(11);
const library_1 = __webpack_require__(72);
let GameService = GameService_1 = class GameService {
    constructor(walletService, luaRunner, gameGateway, prisma) {
        this.walletService = walletService;
        this.luaRunner = luaRunner;
        this.gameGateway = gameGateway;
        this.prisma = prisma;
        this.logger = new common_1.Logger(GameService_1.name);
    }
    async createTable(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.logger.log(`Creating table: ${data.name} (${data.variant})`);
        const table = await this.prisma.gameTable.create({
            data: {
                name: data.name,
                variant: data.variant,
                maxSeats: data.maxSeats,
                smallBlind: new library_1.Decimal(data.smallBlind),
                bigBlind: new library_1.Decimal(data.bigBlind),
                minBuyIn: new library_1.Decimal(data.minBuyIn),
                maxBuyIn: new library_1.Decimal(data.maxBuyIn),
                ante: new library_1.Decimal((_a = data.ante) !== null && _a !== void 0 ? _a : 0),
                turnTime: (_b = data.turnTime) !== null && _b !== void 0 ? _b : 30,
                timeBank: (_c = data.timeBank) !== null && _c !== void 0 ? _c : 60,
                isStraddleAllowed: (_d = data.isStraddleAllowed) !== null && _d !== void 0 ? _d : false,
                password: (_e = data.password) !== null && _e !== void 0 ? _e : null,
                rakePercent: new library_1.Decimal((_f = data.rakePercent) !== null && _f !== void 0 ? _f : 0),
                rakeCap: new library_1.Decimal((_g = data.rakeCap) !== null && _g !== void 0 ? _g : 0),
                holeCardsCount: (_h = data.holeCardsCount) !== null && _h !== void 0 ? _h : 2,
                bettingLimit: ((_j = data.bettingLimit) !== null && _j !== void 0 ? _j : 'NO_LIMIT'),
            },
        });
        return this.mapToLobbyTable(table, 0);
    }
    async getTables(filters) {
        var _a;
        const tables = await this.prisma.gameTable.findMany({
            where: Object.assign({ isActive: (_a = filters === null || filters === void 0 ? void 0 : filters.isActive) !== null && _a !== void 0 ? _a : true }, ((filters === null || filters === void 0 ? void 0 : filters.variant) && { variant: filters.variant })),
            orderBy: { createdAt: 'desc' },
        });
        const tablesWithPlayers = await Promise.all(tables.map(async (table) => {
            const playerCount = await this.getPlayerCount(table.id);
            return this.mapToLobbyTable(table, playerCount);
        }));
        return tablesWithPlayers;
    }
    async getTableById(id) {
        const table = await this.prisma.gameTable.findUnique({
            where: { id },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Table not found: ${id}`);
        }
        const playerCount = await this.getPlayerCount(id);
        return this.mapToLobbyTable(table, playerCount);
    }
    async getPlayerCount(tableId) {
        try {
            const redis = this.luaRunner.getClient();
            const playersKey = `table:${tableId}:players`;
            const playerData = await redis.hgetall(playersKey);
            return Object.values(playerData).filter(p => {
                try {
                    const parsed = JSON.parse(p);
                    return parsed && parsed.status !== 'empty';
                }
                catch (_a) {
                    return false;
                }
            }).length;
        }
        catch (_a) {
            return 0;
        }
    }
    mapToLobbyTable(table, playerCount) {
        var _a;
        return {
            id: table.id,
            name: table.name,
            variant: table.variant,
            stakes: `$${Number(table.smallBlind)}/$${Number(table.bigBlind)}`,
            players: playerCount,
            maxSeats: table.maxSeats,
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            holeCardsCount: (_a = table.holeCardsCount) !== null && _a !== void 0 ? _a : 2,
            isActive: table.isActive,
            status: table.status,
            isPrivate: !!table.password,
            rakePercent: Number(table.rakePercent),
            handsPerHour: 0,
            avgPot: '$0',
        };
    }
    async initializeTableRedis(tableId) {
        const redis = this.luaRunner.getClient();
        const configKey = `table:${tableId}:config`;
        const exists = await redis.exists(configKey);
        if (exists) {
            this.logger.debug(`Table ${tableId} Redis config already initialized`);
            return;
        }
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Table not found: ${tableId}`);
        }
        await redis.hset(configKey, {
            rakePercent: Number(table.rakePercent),
            rakeCap: Number(table.rakeCap),
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            turnTime: table.turnTime,
            timeBank: table.timeBank,
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            holeCardsCount: table.holeCardsCount,
            variant: table.variant,
            bettingLimit: table.bettingLimit,
        });
        await redis.hset(`table:${tableId}`, {
            id: tableId,
            name: table.name,
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            maxSeats: table.maxSeats,
        });
        this.logger.log(`Table ${tableId} Redis config initialized from Postgres`);
    }
    async rebuy(userId, tableId, amount) {
        var _a;
        this.logger.log(`User ${userId} attempting rebuy of ${amount} on table ${tableId}`);
        const session = this.gameGateway.getSessionByUserId(userId, tableId);
        if (!session) {
            throw new common_1.BadRequestException('Player session not found on this table');
        }
        try {
            await this.walletService.lockFunds(userId, {
                amount,
                tableId,
            });
            const result = await this.luaRunner.runScript('add_chips_vault', [
                `table:${tableId}`,
                `table:${tableId}:players`,
            ], [session.seat, amount]);
            const response = JSON.parse(result);
            if (!response.success) {
                this.logger.error(`CRITICAL SYNC ERROR: User ${userId} deducted ${amount} for rebuy, but Redis failed: ${response.message}`);
                throw new common_1.InternalServerErrorException('System sync error. Please contact support for manual refund.');
            }
            if (response.tableState) {
                await this.gameGateway.broadcastTableState(tableId, response.tableState);
            }
            if (response.tableState) {
                const players = response.tableState.players || [];
                const phase = ((_a = response.tableState.table) === null || _a === void 0 ? void 0 : _a.phase) || 'waiting';
                const eligible = players.filter((p) => p.status === 'active' || p.status === 'waiting').length;
                if (phase === 'waiting' && eligible >= 2) {
                    this.logger.log(`Auto-starting hand on table ${tableId} after rebuy (${eligible} eligible players)`);
                    setTimeout(() => this.gameGateway.startNewHand(tableId), 1000);
                }
            }
            return {
                success: true,
                message: 'Rebuy successful',
                tableState: response.tableState
            };
        }
        catch (error) {
            this.logger.error(`Rebuy failed for user ${userId}: ${error.message}`);
            throw error;
        }
    }
    async getHandHistory(tableId, userId) {
        const hands = await this.prisma.handHistory.findMany({
            where: { tableId },
            orderBy: { endTime: 'desc' },
            take: 20,
            include: {
                playerResults: true,
            },
        });
        const allUserIds = new Set();
        for (const hand of hands) {
            for (const pr of hand.playerResults) {
                if (pr.userId)
                    allUserIds.add(pr.userId);
            }
        }
        const users = allUserIds.size > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: Array.from(allUserIds) } },
                select: { id: true, username: true },
            })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));
        return hands.map(hand => {
            var _a, _b, _c, _d;
            const heroResult = hand.playerResults.find(pr => pr.userId === userId);
            const winners = hand.playerResults
                .filter(pr => pr.winAmount > 0)
                .map(pr => ({
                seat: pr.seat,
                amount: pr.winAmount,
                handDescription: pr.handDescription,
                name: userMap.get(pr.userId) || null,
            }));
            return {
                handId: hand.id,
                endTime: hand.endTime.toISOString(),
                communityCards: hand.communityCards,
                pot: hand.pot,
                heroSeat: (_a = heroResult === null || heroResult === void 0 ? void 0 : heroResult.seat) !== null && _a !== void 0 ? _a : null,
                heroNetProfit: (_b = heroResult === null || heroResult === void 0 ? void 0 : heroResult.netProfit) !== null && _b !== void 0 ? _b : 0,
                heroHandDescription: (_c = heroResult === null || heroResult === void 0 ? void 0 : heroResult.handDescription) !== null && _c !== void 0 ? _c : null,
                heroCards: (_d = heroResult === null || heroResult === void 0 ? void 0 : heroResult.cards) !== null && _d !== void 0 ? _d : [],
                winners,
            };
        });
    }
    async getHandDetail(handId, userId) {
        var _a, _b, _c, _d;
        const hand = await this.prisma.handHistory.findUnique({
            where: { id: handId },
            include: {
                playerResults: true,
            },
        });
        if (!hand) {
            throw new common_1.NotFoundException(`Hand not found: ${handId}`);
        }
        const heroResult = hand.playerResults.find(pr => pr.userId === userId);
        const userIds = hand.playerResults.map(pr => pr.userId).filter(Boolean);
        const users = userIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true },
            })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));
        const winners = hand.playerResults
            .filter(pr => pr.winAmount > 0)
            .map(pr => {
            var _a;
            return ({
                seat: pr.seat,
                amount: pr.winAmount,
                handDescription: pr.handDescription,
                cards: (_a = pr.cards) !== null && _a !== void 0 ? _a : [],
                name: userMap.get(pr.userId) || null,
            });
        });
        return {
            handId: hand.id,
            tableId: hand.tableId,
            endTime: hand.endTime.toISOString(),
            communityCards: hand.communityCards,
            pot: hand.pot,
            rake: hand.rake,
            heroSeat: (_a = heroResult === null || heroResult === void 0 ? void 0 : heroResult.seat) !== null && _a !== void 0 ? _a : null,
            heroNetProfit: (_b = heroResult === null || heroResult === void 0 ? void 0 : heroResult.netProfit) !== null && _b !== void 0 ? _b : 0,
            heroHandDescription: (_c = heroResult === null || heroResult === void 0 ? void 0 : heroResult.handDescription) !== null && _c !== void 0 ? _c : null,
            heroCards: (_d = heroResult === null || heroResult === void 0 ? void 0 : heroResult.cards) !== null && _d !== void 0 ? _d : [],
            actionLog: hand.actionLog || [],
            winners,
        };
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [typeof (_a = typeof wallet_service_1.WalletService !== "undefined" && wallet_service_1.WalletService) === "function" ? _a : Object, typeof (_b = typeof lua_runner_service_1.LuaRunnerService !== "undefined" && lua_runner_service_1.LuaRunnerService) === "function" ? _b : Object, typeof (_c = typeof game_gateway_1.GameGateway !== "undefined" && game_gateway_1.GameGateway) === "function" ? _c : Object, typeof (_d = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _d : Object])
], GameService);


/***/ }),
/* 72 */
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/library");

/***/ }),
/* 73 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WsJwtGuard_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WsJwtGuard = void 0;
const common_1 = __webpack_require__(3);
const jwt_1 = __webpack_require__(8);
const websockets_1 = __webpack_require__(68);
const prisma_service_1 = __webpack_require__(11);
let WsJwtGuard = WsJwtGuard_1 = class WsJwtGuard {
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WsJwtGuard_1.name);
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        try {
            const token = this.extractToken(client);
            if (!token) {
                throw new websockets_1.WsException('No authentication token provided');
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    isBanned: true,
                    avatarId: true,
                },
            });
            if (!user) {
                throw new websockets_1.WsException('User not found');
            }
            if (user.isBanned) {
                throw new websockets_1.WsException('Account suspended');
            }
            client.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                avatarId: user.avatarId,
            };
            return true;
        }
        catch (error) {
            this.logger.warn(`WebSocket auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new websockets_1.WsException('Unauthorized');
        }
    }
    extractToken(client) {
        var _a, _b;
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        const token = ((_a = client.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) || ((_b = client.handshake.query) === null || _b === void 0 ? void 0 : _b.token);
        return typeof token === 'string' ? token : null;
    }
};
exports.WsJwtGuard = WsJwtGuard;
exports.WsJwtGuard = WsJwtGuard = WsJwtGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object])
], WsJwtGuard);


/***/ }),
/* 74 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WsThrottlerGuard = void 0;
const common_1 = __webpack_require__(3);
const throttler_1 = __webpack_require__(70);
const websockets_1 = __webpack_require__(68);
let WsThrottlerGuard = class WsThrottlerGuard extends throttler_1.ThrottlerGuard {
    async handleRequest(requestProps) {
        const { context, limit, ttl, throttler } = requestProps;
        const client = context.switchToWs().getClient();
        const tracker = client.handshake.address || client.id;
        const key = this.generateKey(context, tracker, throttler.name);
        const { totalHits } = await this.storageService.increment(key, ttl, limit, throttler.blockDuration || 60, throttler.name || 'default');
        if (totalHits > limit) {
            throw new websockets_1.WsException('Rate limit exceeded');
        }
        return true;
    }
};
exports.WsThrottlerGuard = WsThrottlerGuard;
exports.WsThrottlerGuard = WsThrottlerGuard = __decorate([
    (0, common_1.Injectable)()
], WsThrottlerGuard);


/***/ }),
/* 75 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TimerService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TimerService = void 0;
const common_1 = __webpack_require__(3);
const bullmq_1 = __webpack_require__(76);
const bullmq_2 = __webpack_require__(77);
const ioredis_1 = __webpack_require__(62);
let TimerService = TimerService_1 = class TimerService {
    constructor(timerQueue) {
        this.timerQueue = timerQueue;
        this.logger = new common_1.Logger(TimerService_1.name);
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl);
    }
    async scheduleTimeout(tableId, seat, durationMs) {
        await this.cancelTimeout(tableId);
        this.logger.debug(`Scheduling turn timeout: Table ${tableId}, Seat ${seat}, Duration ${durationMs}ms`);
        const job = await this.timerQueue.add('turn-timeout', { tableId, seat }, {
            delay: durationMs,
            removeOnComplete: true,
            removeOnFail: true,
            jobId: `timer:${tableId}:${Date.now()}`
        });
        await this.redis.set(`timer:job:${tableId}`, job.id);
        return job.id;
    }
    async cancelTimeout(tableId) {
        const jobId = await this.redis.get(`timer:job:${tableId}`);
        if (jobId) {
            this.logger.debug(`Cancelling turn timeout: Table ${tableId}, JobID ${jobId}`);
            const job = await this.timerQueue.getJob(jobId);
            if (job) {
                try {
                    await job.remove();
                }
                catch (error) {
                    this.logger.warn(`Could not remove job ${jobId}: ${error.message}`);
                }
            }
            await this.redis.del(`timer:job:${tableId}`);
        }
    }
};
exports.TimerService = TimerService;
exports.TimerService = TimerService = TimerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('game-turn-timer')),
    __metadata("design:paramtypes", [typeof (_a = typeof bullmq_2.Queue !== "undefined" && bullmq_2.Queue) === "function" ? _a : Object])
], TimerService);


/***/ }),
/* 76 */
/***/ ((module) => {

module.exports = require("@nestjs/bullmq");

/***/ }),
/* 77 */
/***/ ((module) => {

module.exports = require("bullmq");

/***/ }),
/* 78 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WsZodPipe = void 0;
const common_1 = __webpack_require__(3);
const websockets_1 = __webpack_require__(68);
const zod_1 = __webpack_require__(21);
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
    __metadata("design:paramtypes", [typeof (_a = typeof zod_1.ZodSchema !== "undefined" && zod_1.ZodSchema) === "function" ? _a : Object])
], WsZodPipe);


/***/ }),
/* 79 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReconciliationService = void 0;
const common_1 = __webpack_require__(3);
const lua_runner_service_1 = __webpack_require__(61);
let ReconciliationService = class ReconciliationService {
    constructor(luaRunner) {
        this.luaRunner = luaRunner;
        this.logger = new common_1.Logger('🧹 Reconciliation');
    }
    async onModuleInit() {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
            await this.cleanupStaleTables();
        }
        catch (error) {
            this.logger.error(`Boot reconciliation failed: ${error}`);
        }
    }
    async cleanupStaleTables() {
        const redis = this.luaRunner.getClient();
        const tableIds = new Set();
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'table:*', 'COUNT', '100');
            cursor = nextCursor;
            for (const key of keys) {
                const match = key.match(/^table:([^:]+)/);
                if (match) {
                    const id = match[1];
                    tableIds.add(id);
                }
            }
        } while (cursor !== '0');
        if (tableIds.size === 0) {
            this.logger.log('No active tables found. Clean boot.');
            return;
        }
        this.logger.warn(`Found ${tableIds.size} table(s) in Redis. Starting cleanup...`);
        let totalPlayers = 0;
        let totalChips = 0;
        for (const tableId of tableIds) {
            try {
                const hasPlayers = await redis.exists(`table:${tableId}:players`);
                const result = await this.luaRunner.runScript('force_cleanup', [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                ], []);
                const parsed = JSON.parse(result);
                if (parsed.playersRefunded > 0) {
                    this.logger.warn(`  Table ${tableId}: ${parsed.playersRefunded} player(s) refunded, ` +
                        `${parsed.totalRefunded} chips returned to wallets`);
                    totalPlayers += parsed.playersRefunded;
                    totalChips += parsed.totalRefunded;
                }
                else {
                    this.logger.log(`  Table ${tableId}: already clean (no players)`);
                }
            }
            catch (error) {
                this.logger.error(`  Table ${tableId}: cleanup failed — ${error}`);
            }
        }
        if (totalPlayers > 0) {
            this.logger.warn(`✅ Reconciliation complete: ${totalPlayers} zombie player(s) evicted, ` +
                `${totalChips} total chips refunded across ${tableIds.size} table(s)`);
        }
        else {
            this.logger.log(`✅ Reconciliation complete: all ${tableIds.size} table(s) were already clean`);
        }
    }
};
exports.ReconciliationService = ReconciliationService;
exports.ReconciliationService = ReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof lua_runner_service_1.LuaRunnerService !== "undefined" && lua_runner_service_1.LuaRunnerService) === "function" ? _a : Object])
], ReconciliationService);


/***/ }),
/* 80 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerReaperService = void 0;
const common_1 = __webpack_require__(3);
const lua_runner_service_1 = __webpack_require__(61);
const game_gateway_1 = __webpack_require__(67);
const audit_service_1 = __webpack_require__(35);
const shared_1 = __webpack_require__(19);
const SWEEP_INTERVAL_MS = 30000;
const CRASH_THRESHOLD_MS = 60000;
const AFK_THRESHOLD_MS = 10 * 60000;
let PlayerReaperService = class PlayerReaperService {
    constructor(luaRunner, gameGateway, auditService) {
        this.luaRunner = luaRunner;
        this.gameGateway = gameGateway;
        this.auditService = auditService;
        this.logger = new common_1.Logger('💀 Reaper');
        this.sweepInterval = null;
    }
    async onModuleInit() {
        setTimeout(() => {
            this.sweepInterval = setInterval(() => this.sweep().catch(err => this.logger.error(`Sweep failed: ${err}`)), SWEEP_INTERVAL_MS);
            this.logger.log(`Reaper armed — sweeping every ${SWEEP_INTERVAL_MS / 1000}s | ` +
                `Crash: ${CRASH_THRESHOLD_MS / 1000}s | AFK: ${AFK_THRESHOLD_MS / 60000}min`);
        }, 10000);
    }
    onModuleDestroy() {
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
            this.sweepInterval = null;
            this.logger.log('Reaper disarmed');
        }
    }
    async sweep() {
        const redis = this.luaRunner.getClient();
        const now = Date.now();
        const tableIds = new Set();
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'table:*:players', 'COUNT', '100');
            cursor = nextCursor;
            for (const key of keys) {
                const match = key.match(/^table:([^:]+):players$/);
                if (match)
                    tableIds.add(match[1]);
            }
        } while (cursor !== '0');
        if (tableIds.size === 0)
            return;
        for (const tableId of tableIds) {
            try {
                await this.sweepTable(tableId, redis, now);
            }
            catch (err) {
                this.logger.error(`Error sweeping table ${tableId}: ${err}`);
            }
        }
    }
    async sweepTable(tableId, redis, now) {
        const playersKey = `table:${tableId}:players`;
        const playersData = await redis.hgetall(playersKey);
        for (const [seatKey, playerJson] of Object.entries(playersData)) {
            if (!seatKey.startsWith('seat_'))
                continue;
            const seatNum = parseInt(seatKey.replace('seat_', ''), 10);
            let player;
            try {
                player = JSON.parse(playerJson);
            }
            catch (_a) {
                continue;
            }
            let shouldKick = false;
            let reason = '';
            let offlineDurationMs = 0;
            if (player.connection === 'offline') {
                if (player.disconnected_at) {
                    const disconnectedAtMs = parseInt(player.disconnected_at, 10) * 1000;
                    offlineDurationMs = now - disconnectedAtMs;
                    if (offlineDurationMs >= CRASH_THRESHOLD_MS) {
                        shouldKick = true;
                        reason = `crash — offline for ${Math.round(offlineDurationMs / 1000)}s (disconnected_at)`;
                    }
                }
                else {
                    const lastSeenKey = `last_seen:${tableId}:${seatNum}`;
                    const lastSeenStr = await redis.get(lastSeenKey);
                    if (lastSeenStr) {
                        offlineDurationMs = now - parseInt(lastSeenStr, 10);
                        if (offlineDurationMs >= CRASH_THRESHOLD_MS) {
                            shouldKick = true;
                            reason = `crash — offline for ${Math.round(offlineDurationMs / 1000)}s (last_seen fallback)`;
                        }
                    }
                    else {
                        const sessions = this.gameGateway.getActiveSessions();
                        let hasActiveSocket = false;
                        for (const [, session] of sessions) {
                            if (session.tableId === tableId && session.seat === seatNum) {
                                hasActiveSocket = true;
                                break;
                            }
                        }
                        if (!hasActiveSocket) {
                            shouldKick = true;
                            reason = 'crash — no socket, no heartbeat, marked offline';
                        }
                    }
                }
            }
            if (!shouldKick && player.status === 'sitting_out' && player.sit_out_start) {
                const sitOutStart = parseInt(player.sit_out_start, 10) * 1000;
                const elapsed = now - sitOutStart;
                if (elapsed >= AFK_THRESHOLD_MS) {
                    shouldKick = true;
                    offlineDurationMs = elapsed;
                    reason = `AFK — sitting out for ${Math.round(elapsed / 60000)}min`;
                }
            }
            if (!shouldKick)
                continue;
            this.logger.warn(`[ZOMBIE] ${player.username || player.id} at table ${tableId} seat ${seatNum} — ${reason}. Kicking...`);
            try {
                const result = await this.luaRunner.runScript('leave_table', [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                    `user:${player.id}:balance`,
                ], [seatNum.toString(), player.id, 'false']);
                const response = JSON.parse(result);
                if (response.success) {
                    this.logger.warn(`[REAPED] ${player.username || player.id} removed from table ${tableId} seat ${seatNum} (${reason})`);
                    if (response.tableState) {
                        await this.gameGateway.broadcastTableState(tableId, response.tableState);
                    }
                    const server = this.gameGateway.server;
                    if (server) {
                        server.to(`table:${tableId}`).emit('chat_message', {
                            system: true,
                            text: `${player.username || 'A player'} timed out and was removed.`,
                        });
                    }
                    await redis.del(`last_seen:${tableId}:${seatNum}`);
                    await redis.del(`user:${player.id}:seat`);
                    this.auditService.record({
                        userId: player.id,
                        action: shared_1.AuditAction.PLAYER_KICKED,
                        payload: {
                            tableId,
                            seat: seatNum,
                            reason,
                            durationOffline: offlineDurationMs,
                            chipsAtKick: player.chips || '0',
                            username: player.username || 'unknown',
                        },
                        ipAddress: null,
                    }).catch(err => this.logger.error(`[REAPER] Audit failed: ${err}`));
                    const postKickPlayers = await redis.hgetall(playersKey);
                    let activeAfterKick = 0;
                    for (const [k, v] of Object.entries(postKickPlayers)) {
                        if (!k.startsWith('seat_'))
                            continue;
                        try {
                            const p = JSON.parse(v);
                            if (p.status === 'waiting' || p.status === 'active')
                                activeAfterKick++;
                        }
                        catch (_b) { }
                    }
                    const postPhase = await redis.hget(`table:${tableId}`, 'phase');
                    if (activeAfterKick >= 2 && (postPhase === 'waiting' || postPhase === 'showdown')) {
                        this.logger.log(`[REAPER] Auto-starting hand after kick (${activeAfterKick} active players)`);
                        setTimeout(() => this.gameGateway.startNewHand(tableId), 3000);
                    }
                }
                else {
                    this.logger.warn(`[REAPER] leave_table failed for ${player.id}: ${response.message}`);
                }
            }
            catch (err) {
                this.logger.error(`[REAPER] Error kicking ${player.id} from ${tableId}: ${err}`);
            }
        }
    }
};
exports.PlayerReaperService = PlayerReaperService;
exports.PlayerReaperService = PlayerReaperService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [typeof (_a = typeof lua_runner_service_1.LuaRunnerService !== "undefined" && lua_runner_service_1.LuaRunnerService) === "function" ? _a : Object, typeof (_b = typeof game_gateway_1.GameGateway !== "undefined" && game_gateway_1.GameGateway) === "function" ? _b : Object, typeof (_c = typeof audit_service_1.AuditService !== "undefined" && audit_service_1.AuditService) === "function" ? _c : Object])
], PlayerReaperService);


/***/ }),
/* 81 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameController = void 0;
const common_1 = __webpack_require__(3);
const game_service_1 = __webpack_require__(71);
const jwt_auth_guard_1 = __webpack_require__(39);
const roles_guard_1 = __webpack_require__(51);
const roles_decorator_1 = __webpack_require__(52);
const public_decorator_1 = __webpack_require__(6);
const zod_validation_pipe_1 = __webpack_require__(38);
const authenticated_request_interface_1 = __webpack_require__(40);
const shared_1 = __webpack_require__(19);
let GameController = class GameController {
    constructor(gameService) {
        this.gameService = gameService;
    }
    async getTables(variant, isActive) {
        const filters = {
            variant,
            isActive: isActive === 'false' ? false : true,
        };
        return this.gameService.getTables(filters);
    }
    async getTableById(id) {
        return this.gameService.getTableById(id);
    }
    async createTable(data) {
        return this.gameService.createTable(data);
    }
    async rebuy(req, body) {
        const userId = req.user.id;
        return this.gameService.rebuy(userId, body.tableId, body.amount);
    }
    async getHandHistory(tableId, req) {
        const userId = req.user.id;
        return this.gameService.getHandHistory(tableId, userId);
    }
    async getHandDetail(handId, req) {
        const userId = req.user.id;
        return this.gameService.getHandDetail(handId, userId);
    }
};
exports.GameController = GameController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tables'),
    __param(0, (0, common_1.Query)('variant')),
    __param(1, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof shared_1.GameVariant !== "undefined" && shared_1.GameVariant) === "function" ? _b : Object, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getTables", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tables/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getTableById", null);
__decorate([
    (0, common_1.Post)('tables'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.CreateTableSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof shared_1.CreateTableDto !== "undefined" && shared_1.CreateTableDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createTable", null);
__decorate([
    (0, common_1.Post)('rebuy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.RebuySchema)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object, typeof (_e = typeof shared_1.RebuyDto !== "undefined" && shared_1.RebuyDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "rebuy", null);
__decorate([
    (0, common_1.Get)('tables/:tableId/history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getHandHistory", null);
__decorate([
    (0, common_1.Get)('tables/:tableId/history/:handId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('handId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getHandDetail", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)('game'),
    __metadata("design:paramtypes", [typeof (_a = typeof game_service_1.GameService !== "undefined" && game_service_1.GameService) === "function" ? _a : Object])
], GameController);


/***/ }),
/* 82 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SchedulerModule = void 0;
const common_1 = __webpack_require__(3);
const bullmq_1 = __webpack_require__(76);
const timer_service_1 = __webpack_require__(75);
const turn_timer_processor_1 = __webpack_require__(83);
const game_module_1 = __webpack_require__(60);
const common_2 = __webpack_require__(3);
let SchedulerModule = class SchedulerModule {
};
exports.SchedulerModule = SchedulerModule;
exports.SchedulerModule = SchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'game-turn-timer',
            }),
            (0, common_2.forwardRef)(() => game_module_1.GameModule),
        ],
        providers: [timer_service_1.TimerService, turn_timer_processor_1.TurnTimerProcessor],
        exports: [timer_service_1.TimerService],
    })
], SchedulerModule);


/***/ }),
/* 83 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TurnTimerProcessor_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TurnTimerProcessor = void 0;
const bullmq_1 = __webpack_require__(76);
const common_1 = __webpack_require__(3);
const lua_runner_service_1 = __webpack_require__(61);
const timer_service_1 = __webpack_require__(75);
const game_gateway_1 = __webpack_require__(67);
const audit_service_1 = __webpack_require__(35);
const shared_1 = __webpack_require__(19);
let TurnTimerProcessor = TurnTimerProcessor_1 = class TurnTimerProcessor extends bullmq_1.WorkerHost {
    constructor(luaRunner, timerService, gameGateway, auditService) {
        super();
        this.luaRunner = luaRunner;
        this.timerService = timerService;
        this.gameGateway = gameGateway;
        this.auditService = auditService;
        this.logger = new common_1.Logger(TurnTimerProcessor_1.name);
    }
    async process(job) {
        var _a;
        const { tableId, seat } = job.data;
        if (job.name === 'turn-timeout') {
            this.logger.log(`Processing turn timeout for Table ${tableId}, Seat ${seat}`);
            const redis = this.luaRunner.getClient();
            const currentTurnSeat = await redis.hget(`table:${tableId}`, 'turnSeat');
            if (currentTurnSeat === String(seat)) {
                this.logger.warn(`Turn timeout trigger for Table ${tableId}, Seat ${seat}. Invoking The Judge (timeout.lua)`);
                try {
                    const result = await this.luaRunner.runScript('timeout', [`table:${tableId}`, `table:${tableId}:players`], [seat]);
                    const response = JSON.parse(result);
                    if (!response.success) {
                        this.logger.error(`Timeout script failed: ${response.message}`);
                        return;
                    }
                    if (response.action === 'extended') {
                        const durationMs = response.durationMs || 30000;
                        this.logger.log(`LIFELINE: Seat ${seat} time bank activated. Duration: ${durationMs}ms, Balance: ${response.timeBankBalance}s`);
                        await this.timerService.scheduleTimeout(tableId, seat, durationMs);
                        this.gameGateway.server.to(`table:${tableId}`).emit('time_bank_activated', {
                            seat,
                            durationMs,
                            timeBankBalance: response.timeBankBalance,
                        });
                        this.gameGateway.server.to(`table:${tableId}`).emit('your_turn', {
                            seat,
                            timeoutMs: durationMs,
                            isTimeBank: true,
                        });
                    }
                    else if (response.action === 'folded') {
                        this.logger.log(`FOLDED: Seat ${seat} bank depleted. Moving turn.`);
                        this.gameGateway.server.to(`table:${tableId}`).emit('player_action', {
                            seat,
                            action: 'fold',
                            reason: 'timeout'
                        });
                        if (response.benched) {
                            this.gameGateway.server.to(`table:${tableId}`).emit('player_status_update', {
                                seat,
                                status: 'sitting_out',
                            });
                            this.auditService.record({
                                userId: response.playerId || 'unknown',
                                action: shared_1.AuditAction.PLAYER_TIMEOUT,
                                payload: { tableId, seat, reason: 'time_bank_depleted' },
                                ipAddress: null,
                            }).catch(err => this.logger.error(`Audit failed: ${err}`));
                        }
                        const redis = this.luaRunner.getClient();
                        const tableData = await redis.hgetall(`table:${tableId}`);
                        const players = [];
                        for (let i = 0; i < 10; i++) {
                            const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                            if (pData) {
                                players.push(JSON.parse(pData));
                            }
                        }
                        const freshState = {
                            table: Object.assign(Object.assign({}, tableData), { pot: Number(tableData.pot || 0), currentBet: Number(tableData.currentBet || 0), turnSeat: Number((_a = tableData.turnSeat) !== null && _a !== void 0 ? _a : -1), dealerSeat: Number(tableData.dealerSeat || 0), smallBlindSeat: Number(tableData.smallBlindSeat || 0), bigBlindSeat: Number(tableData.bigBlindSeat || 0), communityCards: JSON.parse(tableData.communityCards || '[]') }),
                            players,
                        };
                        await this.gameGateway.broadcastTableState(tableId, freshState);
                        if (response.handComplete) {
                            this.logger.log(`Hand complete via timeout fold. Winner: Seat ${response.winningSeat}`);
                            this.gameGateway.server.to(`table:${tableId}`).emit('hand_result', {
                                winningSeat: response.winningSeat,
                                message: 'Hand complete via timeout fold',
                                nextHandDelay: 5000,
                                nextHandTimestamp: Date.now() + 5000,
                            });
                            setTimeout(() => this.gameGateway.startNewHand(tableId), 5000);
                        }
                        else if (response.nextStreet && !response.handComplete) {
                            await this.gameGateway.advanceStreet(tableId);
                        }
                        else {
                            if (typeof response.nextTurn === 'number' && response.nextTurn >= 0) {
                                const turnTimeCfg = await redis.hget(`table:${tableId}:config`, 'turnTime');
                                const turnTimeMs = (parseInt(turnTimeCfg || '30', 10)) * 1000;
                                await this.timerService.scheduleTimeout(tableId, response.nextTurn, turnTimeMs);
                                this.gameGateway.server.to(`table:${tableId}`).emit('your_turn', {
                                    seat: response.nextTurn,
                                    timeoutMs: turnTimeMs,
                                });
                            }
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to handle timeout for Seat ${seat}: ${error.message}`);
                }
            }
            else {
                this.logger.debug(`Timeout fired but turn changed (Current: ${currentTurnSeat}, Job: ${seat}). Skipping.`);
            }
        }
    }
};
exports.TurnTimerProcessor = TurnTimerProcessor;
exports.TurnTimerProcessor = TurnTimerProcessor = TurnTimerProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('game-turn-timer'),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => lua_runner_service_1.LuaRunnerService))),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => timer_service_1.TimerService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [typeof (_a = typeof lua_runner_service_1.LuaRunnerService !== "undefined" && lua_runner_service_1.LuaRunnerService) === "function" ? _a : Object, typeof (_b = typeof timer_service_1.TimerService !== "undefined" && timer_service_1.TimerService) === "function" ? _b : Object, typeof (_c = typeof game_gateway_1.GameGateway !== "undefined" && game_gateway_1.GameGateway) === "function" ? _c : Object, typeof (_d = typeof audit_service_1.AuditService !== "undefined" && audit_service_1.AuditService) === "function" ? _d : Object])
], TurnTimerProcessor);


/***/ }),
/* 84 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NexusModule = void 0;
const common_1 = __webpack_require__(3);
const bullmq_1 = __webpack_require__(76);
const stream_consumer_service_1 = __webpack_require__(85);
let NexusModule = class NexusModule {
};
exports.NexusModule = NexusModule;
exports.NexusModule = NexusModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'hand-persistence',
            }),
        ],
        providers: [stream_consumer_service_1.StreamConsumerService],
    })
], NexusModule);


/***/ }),
/* 85 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StreamConsumerService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamConsumerService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(62);
const bullmq_1 = __webpack_require__(76);
const bullmq_2 = __webpack_require__(77);
const uuid_1 = __webpack_require__(33);
const os = __webpack_require__(86);
let StreamConsumerService = StreamConsumerService_1 = class StreamConsumerService {
    constructor(handPersistenceQueue) {
        this.handPersistenceQueue = handPersistenceQueue;
        this.logger = new common_1.Logger(StreamConsumerService_1.name);
        this.groupName = 'nexus_v1';
        this.consumerName = `worker_${os.hostname()}_${(0, uuid_1.v4)().substring(0, 8)}`;
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(this.getRedisPort(), 10),
            maxRetriesPerRequest: null,
        });
    }
    getRedisPort() {
        return process.env.REDIS_PORT || '6379';
    }
    async onModuleInit() {
        this.logger.log(`Starting StreamConsumer as ${this.consumerName}`);
        this.consumeLoop().catch(err => {
            this.logger.error('Fatal error in consumeLoop', err);
        });
    }
    async consumeLoop() {
        this.logger.log('Nexus loop initiated');
        while (true) {
            try {
                const streams = await this.redis.keys('stream:table:*');
                if (streams.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
                for (const stream of streams) {
                    try {
                        await this.redis.xgroup('CREATE', stream, this.groupName, '$', 'MKSTREAM');
                    }
                    catch (err) {
                        if (!err.message.includes('BUSYGROUP')) {
                            this.logger.error(`Error creating group for ${stream}: ${err.message}`);
                        }
                    }
                }
                const results = await this.redis.xreadgroup('GROUP', this.groupName, this.consumerName, 'COUNT', 1, 'BLOCK', 5000, 'STREAMS', ...streams, ...streams.map(() => '>'));
                if (results) {
                    for (const [stream, messages] of results) {
                        for (const [id, fieldPairs] of messages) {
                            const messageFields = {};
                            for (let i = 0; i < fieldPairs.length; i += 2) {
                                messageFields[fieldPairs[i]] = fieldPairs[i + 1];
                            }
                            if (messageFields.event === 'hand_ended') {
                                this.logger.log(`Received HAND_END for ${stream} (msg: ${id})`);
                                const tableId = stream.replace('stream:table:', '');
                                await this.handPersistenceQueue.add('archive-hand', {
                                    handId: id,
                                    tableId,
                                    winners: JSON.parse(messageFields.winners),
                                    pot: parseInt(messageFields.pot, 10),
                                    rake: parseInt(messageFields.rake || '0', 10),
                                    communityCards: JSON.parse(messageFields.communityCards || '[]'),
                                    participants: JSON.parse(messageFields.participants),
                                    actionLog: JSON.parse(messageFields.actionLog || '[]'),
                                    timestamp: parseInt(messageFields.timestamp, 10),
                                }, {
                                    removeOnComplete: true,
                                    attempts: 3,
                                    backoff: {
                                        type: 'exponential',
                                        delay: 1000,
                                    },
                                });
                                await this.redis.xack(stream, this.groupName, id);
                                this.logger.debug(`Acked message ${id} from ${stream}`);
                            }
                        }
                    }
                }
            }
            catch (error) {
                this.logger.error(`Error in consumeLoop: ${error}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
};
exports.StreamConsumerService = StreamConsumerService;
exports.StreamConsumerService = StreamConsumerService = StreamConsumerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('hand-persistence')),
    __metadata("design:paramtypes", [typeof (_a = typeof bullmq_2.Queue !== "undefined" && bullmq_2.Queue) === "function" ? _a : Object])
], StreamConsumerService);


/***/ }),
/* 86 */
/***/ ((module) => {

module.exports = require("os");

/***/ }),
/* 87 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerModule = void 0;
const common_1 = __webpack_require__(3);
const bullmq_1 = __webpack_require__(76);
const hand_history_processor_1 = __webpack_require__(88);
const prisma_module_1 = __webpack_require__(41);
const audit_module_1 = __webpack_require__(58);
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'hand-persistence',
            }),
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
        ],
        providers: [hand_history_processor_1.HandHistoryProcessor],
    })
], WorkerModule);


/***/ }),
/* 88 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HandHistoryProcessor_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HandHistoryProcessor = void 0;
const bullmq_1 = __webpack_require__(76);
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const audit_service_1 = __webpack_require__(35);
const shared_1 = __webpack_require__(19);
let HandHistoryProcessor = HandHistoryProcessor_1 = class HandHistoryProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, audit) {
        super();
        this.prisma = prisma;
        this.audit = audit;
        this.logger = new common_1.Logger(HandHistoryProcessor_1.name);
    }
    async process(job) {
        const { handId, tableId, winners, pot, rake, communityCards, participants, actionLog, timestamp } = job.data;
        if (job.name === 'archive-hand') {
            this.logger.log(`Processing hand-persistence for hand ${handId} (table ${tableId})`);
            try {
                const existing = await this.prisma.handHistory.findUnique({
                    where: { id: handId },
                });
                if (existing) {
                    this.logger.warn(`Duplicate hand detected: ${handId}. Skipping.`);
                    return;
                }
                await this.prisma.$transaction(async (tx) => {
                    var _a;
                    const hand = await tx.handHistory.create({
                        data: {
                            id: handId,
                            tableId,
                            endTime: new Date(timestamp * 1000),
                            communityCards: communityCards,
                            pot,
                            rake: rake || 0,
                            actionLog: actionLog || [],
                        },
                    });
                    const playerResults = [];
                    for (const p of participants) {
                        const winner = winners.find((w) => w.seat === p.seatNumber);
                        const winAmount = winner ? winner.amount : 0;
                        const netProfit = winAmount - (p.totalContribution || 0);
                        playerResults.push({
                            handId: hand.id,
                            userId: p.id,
                            seat: p.seatNumber,
                            winAmount,
                            netProfit,
                            handDescription: p.handDescription || (winner ? (winner.handDescription || null) : null),
                            cards: Array.isArray(p.cards) ? p.cards : [],
                        });
                        if (p.id) {
                            if (winAmount > 0) {
                                await tx.wallet.update({
                                    where: { userId: p.id },
                                    data: { realBalance: { increment: winAmount } }
                                });
                                await tx.user.update({
                                    where: { id: p.id },
                                    data: { lifetimeEarnings: { increment: winAmount } }
                                });
                            }
                            if (rake > 0 && pot > 0 && p.totalContribution > 0) {
                                const rakeShare = Math.floor(rake * (p.totalContribution / pot));
                                if (rakeShare > 0) {
                                    await tx.user.update({
                                        where: { id: p.id },
                                        data: { lifetimeRake: { increment: rakeShare } }
                                    });
                                }
                            }
                        }
                    }
                    await tx.handPlayerResult.createMany({
                        data: playerResults,
                    });
                    if (rake > 0) {
                        const houseUser = await tx.user.findUnique({
                            where: { username: 'HOUSE_TREASURY' },
                            select: { id: true }
                        });
                        if (houseUser) {
                            await tx.wallet.update({
                                where: { userId: houseUser.id },
                                data: { realBalance: { increment: rake } }
                            });
                            const houseWallet = await tx.wallet.findUnique({
                                where: { userId: houseUser.id },
                                select: { id: true }
                            });
                            if (houseWallet) {
                                await tx.transaction.create({
                                    data: {
                                        walletId: houseWallet.id,
                                        type: 'RAKE',
                                        amount: rake,
                                        status: 'COMPLETED',
                                        description: `Rake from Hand #${handId} (Table: ${tableId})`,
                                    }
                                });
                            }
                            this.logger.log(`💰 Credited House Treasury with $${rake} rake from hand ${handId}`);
                        }
                        else {
                            this.logger.warn(`⚠️ HOUSE_TREASURY user not found! Rake of $${rake} not credited.`);
                        }
                    }
                    const auditUserId = ((_a = participants[0]) === null || _a === void 0 ? void 0 : _a.id) || 'system';
                    await this.audit.record({
                        userId: auditUserId,
                        action: shared_1.AuditAction.HAND_ARCHIVED,
                        payload: {
                            handId,
                            tableId,
                            pot,
                            rake: rake || 0,
                            winnerCount: winners.length,
                        },
                    }, tx);
                });
                this.logger.log(`Successfully archived hand ${handId} and synced wallets`);
            }
            catch (error) {
                this.logger.error(`Failed to archive hand ${handId}: ${error.stack}`);
                throw error;
            }
        }
    }
};
exports.HandHistoryProcessor = HandHistoryProcessor;
exports.HandHistoryProcessor = HandHistoryProcessor = HandHistoryProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('hand-persistence'),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof audit_service_1.AuditService !== "undefined" && audit_service_1.AuditService) === "function" ? _b : Object])
], HandHistoryProcessor);


/***/ }),
/* 89 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommonModule = void 0;
const common_1 = __webpack_require__(3);
const redis_service_1 = __webpack_require__(90);
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [redis_service_1.RedisService],
        exports: [redis_service_1.RedisService],
    })
], CommonModule);


/***/ }),
/* 90 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(62);
let RedisService = RedisService_1 = class RedisService {
    constructor() {
        this.logger = new common_1.Logger(RedisService_1.name);
    }
    async onModuleInit() {
        this.client = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            maxRetriesPerRequest: null,
        });
        this.client.on('connect', () => this.logger.log('Redis Connected'));
        this.client.on('error', (err) => this.logger.error('Redis Error', err));
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
    getClient() {
        return this.client;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)()
], RedisService);


/***/ }),
/* 91 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CronModule_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CronModule = void 0;
const common_1 = __webpack_require__(3);
const bullmq_1 = __webpack_require__(76);
const bullmq_2 = __webpack_require__(77);
const cron_service_1 = __webpack_require__(92);
const audit_processor_1 = __webpack_require__(93);
const stats_processor_1 = __webpack_require__(94);
const prisma_module_1 = __webpack_require__(41);
const common_module_1 = __webpack_require__(89);
let CronModule = CronModule_1 = class CronModule {
    constructor(cronQueue) {
        this.cronQueue = cronQueue;
        this.logger = new common_1.Logger(CronModule_1.name);
    }
    async onModuleInit() {
        this.logger.log('Initializing System Cron repeatable jobs...');
        await this.cronQueue.add('financial-audit', {}, {
            repeat: {
                every: 10 * 60 * 1000,
            },
            removeOnComplete: true,
        });
        this.logger.log('Financial Audit scheduled (Every 10m)');
        await this.cronQueue.add('table-stats', {}, {
            repeat: {
                every: 60 * 1000,
            },
            removeOnComplete: true,
        });
        this.logger.log('Table Stats Worker scheduled (Every 1m) - Yellow Cable');
    }
};
exports.CronModule = CronModule;
exports.CronModule = CronModule = CronModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'system-cron',
            }),
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
        ],
        providers: [cron_service_1.CronService, audit_processor_1.AuditProcessor, stats_processor_1.StatsProcessor],
        exports: [cron_service_1.CronService],
    }),
    __param(0, (0, bullmq_1.InjectQueue)('system-cron')),
    __metadata("design:paramtypes", [typeof (_a = typeof bullmq_2.Queue !== "undefined" && bullmq_2.Queue) === "function" ? _a : Object])
], CronModule);


/***/ }),
/* 92 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CronService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CronService = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const redis_service_1 = __webpack_require__(90);
const client_1 = __webpack_require__(12);
let CronService = CronService_1 = class CronService {
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.logger = new common_1.Logger(CronService_1.name);
    }
    async runAudit() {
        this.logger.log('Starting financial reconciliation audit...');
        try {
            const totals = await this.getSystemTotals();
            const wallets = new client_1.Prisma.Decimal(totals.totalWalletBalance);
            const chips = new client_1.Prisma.Decimal(totals.totalChipsInPlay);
            const expected = new client_1.Prisma.Decimal(totals.expectedBalance);
            const currentTotal = wallets.plus(chips);
            const discrepancy = currentTotal.minus(expected);
            const status = discrepancy.isZero() ? 'MATCH' : 'DRIFT';
            const report = await this.prisma.reconciliationReport.create({
                data: {
                    totalWalletBalance: wallets,
                    totalChipsInPlay: chips,
                    expectedBalance: expected,
                    systemDiscrepancy: discrepancy,
                    status,
                    details: {
                        walletDetail: totals.walletDetail,
                        tableCount: totals.tableCount,
                    },
                },
            });
            if (status === 'DRIFT') {
                this.logger.error(`CRITICAL: Financial Drift Detected! Discrepancy: ${discrepancy.toString()}`);
            }
            else {
                this.logger.log(`Audit Complete: System in balance. (Report ID: ${report.id})`);
            }
            return report;
        }
        catch (error) {
            this.logger.error('Failed to run financial audit', error.stack);
            throw error;
        }
    }
    async getSystemTotals() {
        var _a, _b, _c, _d, _e;
        const walletSum = await this.prisma.wallet.aggregate({
            _sum: {
                realBalance: true,
                bonusBalance: true,
            },
        });
        const totalWalletBalance = (((_a = walletSum._sum.realBalance) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0) +
            (((_b = walletSum._sum.bonusBalance) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0);
        const ledgerSum = await this.prisma.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                type: {
                    in: ['DEPOSIT', 'WITHDRAW'],
                },
                status: 'COMPLETED',
            },
        });
        const expectedBalance = ((_c = ledgerSum._sum.amount) === null || _c === void 0 ? void 0 : _c.toNumber()) || 0;
        const redisTotal = await this.sumChipsFromRedis();
        return {
            totalWalletBalance,
            expectedBalance,
            totalChipsInPlay: redisTotal.total,
            tableCount: redisTotal.count,
            walletDetail: {
                real: ((_d = walletSum._sum.realBalance) === null || _d === void 0 ? void 0 : _d.toNumber()) || 0,
                bonus: ((_e = walletSum._sum.bonusBalance) === null || _e === void 0 ? void 0 : _e.toNumber()) || 0,
            }
        };
    }
    async sumChipsFromRedis() {
        const redis = this.redisService.getClient();
        let total = 0;
        let tableCount = 0;
        let cursor = '0';
        do {
            const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'table:*', 'COUNT', 100);
            cursor = newCursor;
            for (const key of keys) {
                if (key.includes(':'))
                    continue;
                tableCount++;
                const tableData = await redis.hgetall(key);
                const pot = parseInt(tableData.pot || '0', 10);
                total += pot;
                const playersData = await redis.hgetall(`${key}:players`);
                for (const playerJson of Object.values(playersData)) {
                    try {
                        const player = JSON.parse(playerJson);
                        total += (player.chips || 0);
                    }
                    catch (e) {
                        this.logger.error(`Failed to parse player data for key ${key}:players`, e);
                    }
                }
            }
        } while (cursor !== '0');
        return { total, count: tableCount };
    }
};
exports.CronService = CronService;
exports.CronService = CronService = CronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], CronService);


/***/ }),
/* 93 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditProcessor_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditProcessor = void 0;
const bullmq_1 = __webpack_require__(76);
const common_1 = __webpack_require__(3);
const cron_service_1 = __webpack_require__(92);
let AuditProcessor = AuditProcessor_1 = class AuditProcessor extends bullmq_1.WorkerHost {
    constructor(cronService) {
        super();
        this.cronService = cronService;
        this.logger = new common_1.Logger(AuditProcessor_1.name);
    }
    async process(job) {
        if (job.name === 'financial-audit') {
            this.logger.log('Executing scheduled financial audit job');
            try {
                await this.cronService.runAudit();
            }
            catch (error) {
                this.logger.error('Scheduled financial audit failed', error.stack);
                throw error;
            }
        }
    }
};
exports.AuditProcessor = AuditProcessor;
exports.AuditProcessor = AuditProcessor = AuditProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('system-cron'),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof cron_service_1.CronService !== "undefined" && cron_service_1.CronService) === "function" ? _a : Object])
], AuditProcessor);


/***/ }),
/* 94 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StatsProcessor_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StatsProcessor = void 0;
const bullmq_1 = __webpack_require__(76);
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const redis_service_1 = __webpack_require__(90);
let StatsProcessor = StatsProcessor_1 = class StatsProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, redisService) {
        super();
        this.prisma = prisma;
        this.redisService = redisService;
        this.logger = new common_1.Logger(StatsProcessor_1.name);
    }
    async process(job) {
        if (job.name !== 'table-stats') {
            return;
        }
        this.logger.debug('Running table stats calculation (Yellow Cable)...');
        const startTime = Date.now();
        try {
            const redis = this.redisService.getClient();
            const tables = await this.prisma.gameTable.findMany({
                where: { isActive: true },
                select: { id: true, rakePercent: true, rakeCap: true, bigBlind: true },
            });
            for (const table of tables) {
                try {
                    const stats = await this.calculateTableStats(table.id, redis);
                    const cacheKey = `admin:table_stats:${table.id}`;
                    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 120);
                    this.logger.debug(`Cached stats for table ${table.id}: ${stats.handsPerHour} H/hr`);
                }
                catch (error) {
                    this.logger.error(`Failed to calculate stats for table ${table.id}: ${error.message}`);
                }
            }
            const elapsed = Date.now() - startTime;
            this.logger.log(`Table stats calculated for ${tables.length} tables in ${elapsed}ms`);
        }
        catch (error) {
            this.logger.error(`Stats calculation failed: ${error.message}`);
        }
    }
    async calculateTableStats(tableId, redis) {
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);
        const handCount = parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.handNumber) || '0', 10);
        const tableCreatedAt = (tableData === null || tableData === void 0 ? void 0 : tableData.createdAt)
            ? new Date(tableData.createdAt).getTime()
            : Date.now() - (60 * 60 * 1000);
        const uptimeHours = Math.max(0.1, (Date.now() - tableCreatedAt) / (1000 * 60 * 60));
        const handsPerHour = Math.round(handCount / uptimeHours);
        const totalRake = parseFloat((tableData === null || tableData === void 0 ? void 0 : tableData.totalRake) || '0');
        const pot = parseFloat((tableData === null || tableData === void 0 ? void 0 : tableData.pot) || '0');
        const avgPot = pot > 0 ? pot : Math.round(Math.random() * 50 + 10);
        let activePlayers = 0;
        const ipAddresses = {};
        Object.entries(playerData || {}).forEach(([seat, data]) => {
            try {
                const player = JSON.parse(data);
                if (player && player.status !== 'empty' && player.userId) {
                    activePlayers++;
                    if (player.ipAddress) {
                        if (!ipAddresses[player.ipAddress]) {
                            ipAddresses[player.ipAddress] = [];
                        }
                        ipAddresses[player.ipAddress].push(player.userId);
                    }
                }
            }
            catch (_a) { }
        });
        let securityAlert = false;
        let alertReason;
        for (const [ip, users] of Object.entries(ipAddresses)) {
            if (users.length >= 2) {
                securityAlert = true;
                alertReason = `Duplicate IP: ${ip} (${users.length} players)`;
                break;
            }
        }
        return {
            handsPerHour,
            totalRake,
            avgPot,
            activePlayers,
            totalHands: handCount,
            securityAlert,
            alertReason,
            calculatedAt: new Date().toISOString(),
        };
    }
};
exports.StatsProcessor = StatsProcessor;
exports.StatsProcessor = StatsProcessor = StatsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('system-cron'),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], StatsProcessor);


/***/ }),
/* 95 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChatModule = void 0;
const common_1 = __webpack_require__(3);
const chat_gateway_1 = __webpack_require__(96);
const auth_module_1 = __webpack_require__(7);
const prisma_module_1 = __webpack_require__(41);
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        providers: [chat_gateway_1.ChatGateway],
        exports: [chat_gateway_1.ChatGateway],
    })
], ChatModule);


/***/ }),
/* 96 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChatGateway = void 0;
const websockets_1 = __webpack_require__(68);
const socket_io_1 = __webpack_require__(69);
const common_1 = __webpack_require__(3);
const ws_jwt_guard_1 = __webpack_require__(73);
const ws_throttler_guard_1 = __webpack_require__(74);
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor() {
        this.logger = new common_1.Logger(ChatGateway_1.name);
    }
    handleJoinRoom(client, data) {
        const room = `table:${data.tableId}`;
        client.join(room);
        this.logger.log(`User ${client.user.username} joined chat room ${room}`);
        return { event: 'joined', room };
    }
    handleMessage(client, data) {
        const { tableId, text } = data;
        if (!text || text.trim().length === 0) {
            return;
        }
        const cleanText = text.trim().substring(0, 200);
        const room = `table:${tableId}`;
        const payload = {
            sender: client.user.username,
            text: cleanText,
            type: 'PLAYER',
            timestamp: new Date(),
        };
        this.server.to(room).emit('new_message', payload);
        this.logger.debug(`Chat message in ${room} from ${client.user.username}: ${cleanText}`);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof ws_jwt_guard_1.AuthenticatedSocket !== "undefined" && ws_jwt_guard_1.AuthenticatedSocket) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMessage", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/chat',
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.UseGuards)(ws_throttler_guard_1.WsThrottlerGuard)
], ChatGateway);


/***/ }),
/* 97 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationModule = void 0;
const common_1 = __webpack_require__(3);
const jwt_1 = __webpack_require__(8);
const notification_service_1 = __webpack_require__(98);
const notification_gateway_1 = __webpack_require__(99);
const notification_controller_1 = __webpack_require__(100);
const prisma_module_1 = __webpack_require__(41);
const common_module_1 = __webpack_require__(89);
const ws_jwt_guard_1 = __webpack_require__(73);
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
                signOptions: { expiresIn: '7d' },
            }),
        ],
        controllers: [notification_controller_1.NotificationController],
        providers: [notification_service_1.NotificationService, notification_gateway_1.NotificationGateway, ws_jwt_guard_1.WsJwtGuard],
        exports: [notification_service_1.NotificationService],
    })
], NotificationModule);


/***/ }),
/* 98 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationService = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const redis_service_1 = __webpack_require__(90);
const shared_1 = __webpack_require__(19);
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma, redisSerivce) {
        this.prisma = prisma;
        this.redisSerivce = redisSerivce;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendGlobal(title, message, type = shared_1.NotificationType.SYSTEM, metadata) {
        this.logger.log(`Sending global notification: ${title}`);
        const notification = await this.prisma.notification.create({
            data: {
                userId: null,
                type,
                title,
                message,
                metadata: metadata || {},
            },
        });
        const event = {
            target: 'ALL',
            payload: notification,
        };
        await this.redisSerivce.getClient().publish('global_alerts', JSON.stringify(event));
        return notification;
    }
    async sendPersonal(userId, title, message, type = shared_1.NotificationType.PERSONAL, metadata) {
        this.logger.log(`Sending personal notification to ${userId}: ${title}`);
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata: metadata || {},
            },
        });
        const event = {
            target: 'USER',
            userId,
            payload: notification,
        };
        await this.redisSerivce.getClient().publish(`user_alerts:${userId}`, JSON.stringify(event));
        return notification;
    }
    async getNotifications(userId, limitGlobal = 10, limitPersonal = 40) {
        const [global, personal] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId: null },
                orderBy: { createdAt: 'desc' },
                take: limitGlobal,
            }),
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limitPersonal,
            }),
        ]);
        return [...global, ...personal].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async markAsRead(notificationId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], NotificationService);


/***/ }),
/* 99 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationGateway_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationGateway = void 0;
const websockets_1 = __webpack_require__(68);
const socket_io_1 = __webpack_require__(69);
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(62);
const ws_jwt_guard_1 = __webpack_require__(73);
let NotificationGateway = NotificationGateway_1 = class NotificationGateway {
    constructor() {
        this.logger = new common_1.Logger(NotificationGateway_1.name);
    }
    afterInit() {
        this.logger.log('Notification Gateway Initialized');
        this.setupRedisSubscriber();
    }
    setupRedisSubscriber() {
        this.subscriber = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
        this.subscriber.subscribe('global_alerts', (err) => {
            if (err)
                this.logger.error('Failed to subscribe to global_alerts', err);
        });
        this.subscriber.psubscribe('user_alerts:*', (err) => {
            if (err)
                this.logger.error('Failed to psubscribe to user_alerts', err);
        });
        this.subscriber.on('message', (channel, message) => {
            if (channel === 'global_alerts') {
                const event = JSON.parse(message);
                this.logger.log('Broadcasting global alert from Redis');
                this.server.emit('global_alert', event.payload);
            }
        });
        this.subscriber.on('pmessage', (pattern, channel, message) => {
            if (pattern === 'user_alerts:*') {
                const event = JSON.parse(message);
                const userId = channel.split(':')[1];
                this.logger.log(`Emitting personal alert to user room: user:${userId}`);
                this.server.to(`user:${userId}`).emit('personal_alert', event.payload);
            }
        });
    }
    handleConnection(client) {
        const user = client.user;
        if (user) {
            this.logger.log(`User ${user.id} connected to notifications`);
            client.join(`user:${user.id}`);
        }
    }
    handleDisconnect(client) {
        this.logger.log('Client disconnected from notifications');
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], NotificationGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], NotificationGateway.prototype, "handleConnection", null);
exports.NotificationGateway = NotificationGateway = NotificationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/notifications',
        cors: { origin: '*' },
    })
], NotificationGateway);


/***/ }),
/* 100 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationController = void 0;
const common_1 = __webpack_require__(3);
const notification_service_1 = __webpack_require__(98);
const jwt_auth_guard_1 = __webpack_require__(39);
const roles_guard_1 = __webpack_require__(45);
const roles_decorator_1 = __webpack_require__(46);
const authenticated_request_interface_1 = __webpack_require__(40);
const common_2 = __webpack_require__(3);
const zod_validation_pipe_1 = __webpack_require__(38);
const shared_1 = __webpack_require__(19);
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async getMyNotifications(req, limitGlobal, limitPersonal) {
        return this.notificationService.getNotifications(req.user.id, limitGlobal, limitPersonal);
    }
    async markAsRead(req, id) {
        return this.notificationService.markAsRead(id, req.user.id);
    }
    async markAllAsRead(req) {
        return this.notificationService.markAllAsRead(req.user.id);
    }
    async broadcast(dto) {
        return this.notificationService.sendGlobal(dto.title, dto.message, dto.type, dto.metadata);
    }
    async debugTournament() {
        return this.notificationService.sendGlobal('Tournament Starting', 'Sunday Million starts in 10 minutes!', shared_1.NotificationType.TOURNAMENT, { tournamentId: 'debug-1' });
    }
    async debugPersonal(userId) {
        return this.notificationService.sendPersonal(userId, 'Big Win!', 'You won 500 chips in a showdown!', shared_1.NotificationType.SYSTEM, { amount: 500 });
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limitGlobal')),
    __param(2, (0, common_1.Query)('limitPersonal')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _b : Object, Number, Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getMyNotifications", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _c : Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Post)('broadcast'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.Role.ADMIN, shared_1.Role.SUPERADMIN),
    (0, common_2.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(shared_1.createNotificationSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof shared_1.CreateNotificationDto !== "undefined" && shared_1.CreateNotificationDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "broadcast", null);
__decorate([
    (0, common_1.Post)('debug/tournament-alert'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "debugTournament", null);
__decorate([
    (0, common_1.Post)('debug/personal-win/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "debugPersonal", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [typeof (_a = typeof notification_service_1.NotificationService !== "undefined" && notification_service_1.NotificationService) === "function" ? _a : Object])
], NotificationController);


/***/ }),
/* 101 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminModule = void 0;
const common_1 = __webpack_require__(3);
const admin_game_controller_1 = __webpack_require__(102);
const game_module_1 = __webpack_require__(60);
const prisma_module_1 = __webpack_require__(41);
const auth_module_1 = __webpack_require__(7);
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [game_module_1.GameModule, prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [admin_game_controller_1.AdminGameController],
    })
], AdminModule);


/***/ }),
/* 102 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminGameController_1;
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminGameController = void 0;
const common_1 = __webpack_require__(3);
const prisma_service_1 = __webpack_require__(11);
const redis_service_1 = __webpack_require__(90);
const roles_guard_1 = __webpack_require__(51);
const jwt_auth_guard_1 = __webpack_require__(39);
const roles_decorator_1 = __webpack_require__(52);
const client_1 = __webpack_require__(12);
const shared_1 = __webpack_require__(19);
const game_gateway_1 = __webpack_require__(67);
let AdminGameController = AdminGameController_1 = class AdminGameController {
    constructor(prisma, redisService, gameGateway) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.gameGateway = gameGateway;
        this.logger = new common_1.Logger(AdminGameController_1.name);
    }
    async getDashboard() {
        const tables = await this.prisma.gameTable.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        const redis = this.redisService.getClient();
        let totalPlayers = 0;
        let totalRake = 0;
        let alertCount = 0;
        let runningCount = 0;
        const godModeTables = await Promise.all(tables.map(async (t) => {
            const cacheKey = `admin:table_stats:${t.id}`;
            const cachedStats = await redis.get(cacheKey);
            let stats = {
                handsPerHour: 0,
                totalRake: 0,
                avgPot: 0,
                activePlayers: 0,
                totalHands: 0,
                securityAlert: false,
                alertReason: undefined,
            };
            if (cachedStats) {
                try {
                    stats = JSON.parse(cachedStats);
                }
                catch (e) {
                    this.logger.warn(`Failed to parse cached stats for ${t.id}`);
                }
            }
            else {
                try {
                    const [tableData, playerCount] = await Promise.all([
                        redis.hgetall(`table:${t.id}`),
                        redis.hlen(`table:${t.id}:players`),
                    ]);
                    stats.activePlayers = playerCount || 0;
                    stats.totalHands = parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.handNumber) || '0', 10);
                }
                catch (_a) { }
            }
            let status = 'WAITING';
            let phase = 'waiting';
            try {
                phase = await redis.hget(`table:${t.id}`, 'phase') || 'waiting';
                if (phase === 'PAUSED' || phase === 'paused') {
                    status = 'PAUSED';
                }
                else if (phase === 'error') {
                    status = 'ERROR';
                }
                else if (stats.activePlayers >= 2) {
                    status = 'RUNNING';
                    runningCount++;
                }
            }
            catch (_b) { }
            totalPlayers += stats.activePlayers;
            totalRake += stats.totalRake;
            if (stats.securityAlert)
                alertCount++;
            let severity = 'HEALTHY';
            if (stats.securityAlert || status === 'ERROR') {
                severity = 'CRITICAL';
            }
            else if (stats.handsPerHour > 90 || stats.activePlayers >= t.maxSeats) {
                severity = 'WARNING';
            }
            const uptimeMs = Date.now() - new Date(t.createdAt).getTime();
            const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
            const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
            const uptime = `${hours}h ${minutes}m`;
            let variantDisplay = t.variant.replace('_', ' ');
            if (t.variant === 'TEXAS_HOLDEM') {
                variantDisplay = "Texas Hold'em";
            }
            else if (t.variant === 'OMAHA') {
                variantDisplay = `PLO-${t.holeCardsCount}`;
            }
            else if (t.variant === 'ALL_IN_OR_FOLD') {
                variantDisplay = 'All-in or Fold';
            }
            return {
                id: t.id,
                name: t.name,
                variant: t.variant,
                variantDisplay,
                stakes: `$${t.smallBlind}/$${t.bigBlind}`,
                isPrivate: !!t.password,
                status,
                phase,
                handsPerHour: stats.handsPerHour,
                avgPot: stats.avgPot,
                totalHands: stats.totalHands,
                activePlayers: stats.activePlayers,
                maxSeats: t.maxSeats,
                occupancyDisplay: `${stats.activePlayers}/${t.maxSeats}`,
                totalRake: stats.totalRake,
                rakePercent: Number(t.rakePercent),
                rakeCap: Number(t.rakeCap),
                securityAlert: stats.securityAlert,
                alertReason: stats.alertReason,
                severity,
                createdAt: t.createdAt.toISOString(),
                uptime,
            };
        }));
        return {
            tables: godModeTables,
            summary: {
                totalTables: tables.length,
                runningTables: runningCount,
                totalPlayers,
                totalRake,
                alertCount,
            },
        };
    }
    async getInspectorDetails(tableId) {
        const redis = this.redisService.getClient();
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);
        const players = [];
        const ipCounts = {};
        Object.entries(playerData || {}).forEach(([seat, data]) => {
            try {
                const player = JSON.parse(data);
                if (player && player.userId) {
                    const playerInfo = {
                        seat: parseInt(seat),
                        userId: player.userId,
                        name: player.username || player.userId.slice(0, 8),
                        chips: player.stack || 0,
                        ip: player.ipAddress || 'Unknown',
                        status: player.status || 'active',
                    };
                    players.push(playerInfo);
                    if (player.ipAddress) {
                        ipCounts[player.ipAddress] = (ipCounts[player.ipAddress] || 0) + 1;
                    }
                }
            }
            catch (_a) { }
        });
        let liveLog = [];
        try {
            const logKey = `table:${tableId}:log`;
            const logEntries = await redis.lrange(logKey, 0, 19);
            liveLog = logEntries.map((entry) => {
                try {
                    return JSON.parse(entry);
                }
                catch (_a) {
                    return { action: entry, time: new Date().toISOString(), type: 'system' };
                }
            });
        }
        catch (_a) {
        }
        let chat = [];
        try {
            const chatKey = `table:${tableId}:chat`;
            const chatEntries = await redis.lrange(chatKey, 0, 19);
            chat = chatEntries.map((entry) => {
                try {
                    return JSON.parse(entry);
                }
                catch (_a) {
                    return { message: entry, time: new Date().toISOString(), user: 'System' };
                }
            });
        }
        catch (_b) {
        }
        const playersWithFlags = players.map(p => (Object.assign(Object.assign({}, p), { isDuplicateIP: ipCounts[p.ip] > 1 })));
        return {
            tableId,
            phase: (tableData === null || tableData === void 0 ? void 0 : tableData.phase) || 'waiting',
            handNumber: parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.handNumber) || '0'),
            pot: parseFloat((tableData === null || tableData === void 0 ? void 0 : tableData.pot) || '0'),
            players: playersWithFlags.sort((a, b) => a.seat - b.seat),
            liveLog,
            chat,
            maxSeats: parseInt((tableData === null || tableData === void 0 ? void 0 : tableData.maxSeats) || '9'),
        };
    }
    async getTableConfig(tableId) {
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
        });
        if (!table) {
            throw new Error('Table not found');
        }
        return {
            id: table.id,
            name: table.name,
            variant: table.variant,
            smallBlind: Number(table.smallBlind),
            bigBlind: Number(table.bigBlind),
            minBuyIn: Number(table.minBuyIn),
            maxBuyIn: Number(table.maxBuyIn),
            maxSeats: table.maxSeats,
            ante: Number(table.ante || 0),
            password: table.password || null,
            rakePercent: Number(table.rakePercent || 5),
            rakeCap: Number(table.rakeCap || 10),
            turnTime: Number(table.turnTime || 30),
            timeBank: Number(table.timeBank || 60),
            status: table.status,
            isActive: table.isActive,
            createdAt: table.createdAt.toISOString(),
        };
    }
    async updateTableConfig(tableId, dto) {
        const redis = this.redisService.getClient();
        const updateData = {};
        if (dto.password !== undefined)
            updateData.password = dto.password;
        if (dto.rakePercent !== undefined)
            updateData.rakePercent = dto.rakePercent;
        if (dto.rakeCap !== undefined)
            updateData.rakeCap = dto.rakeCap;
        if (dto.turnTime !== undefined)
            updateData.turnTime = dto.turnTime;
        if (dto.timeBank !== undefined)
            updateData.timeBank = dto.timeBank;
        if (dto.status === 'PAUSED') {
            updateData.status = 'PAUSED';
            await redis.hset(`table:${tableId}`, 'phase', 'PAUSED');
        }
        else if (dto.status === 'RUNNING') {
            updateData.status = 'RUNNING';
            const currentPhase = await redis.hget(`table:${tableId}`, 'phase');
            if (currentPhase === 'PAUSED') {
                await redis.hset(`table:${tableId}`, 'phase', 'waiting');
            }
        }
        const updated = await this.prisma.gameTable.update({
            where: { id: tableId },
            data: updateData,
        });
        const configUpdate = {
            tableId,
            rakePercent: dto.rakePercent,
            rakeCap: dto.rakeCap,
            turnTime: dto.turnTime,
            timeBank: dto.timeBank,
            timestamp: new Date().toISOString(),
        };
        await redis.publish(`table:${tableId}:config_update`, JSON.stringify(configUpdate));
        this.gameGateway.server.to(`table:${tableId}`).emit('TABLE_CONFIG_UPDATED', configUpdate);
        this.logger.log(`Table ${tableId} config updated: ${JSON.stringify(updateData)}`);
        return { success: true, updated: updateData };
    }
    async forceSave(tableId) {
        const redis = this.redisService.getClient();
        const tableData = await redis.hgetall(`table:${tableId}`);
        const playerData = await redis.hgetall(`table:${tableId}:players`);
        let playerCount = 0;
        Object.values(playerData || {}).forEach((data) => {
            try {
                const player = JSON.parse(data);
                if (player && player.userId)
                    playerCount++;
            }
            catch (_a) { }
        });
        await this.prisma.gameTable.update({
            where: { id: tableId },
            data: {
                status: (tableData === null || tableData === void 0 ? void 0 : tableData.phase) || 'waiting',
            },
        });
        this.logger.log(`Force-saved table ${tableId}: phase=${tableData === null || tableData === void 0 ? void 0 : tableData.phase}, players=${playerCount}`);
        return {
            success: true,
            snapshot: {
                phase: tableData === null || tableData === void 0 ? void 0 : tableData.phase,
                playerCount,
                handNumber: tableData === null || tableData === void 0 ? void 0 : tableData.handNumber,
            }
        };
    }
    async getTables() {
        const tables = await this.prisma.gameTable.findMany();
        const redis = this.redisService.getClient();
        const result = await Promise.all(tables.map(async (t) => {
            let playersCount = 0;
            let tableStatus = 'INACTIVE';
            try {
                const [phase, count] = await Promise.all([
                    redis.hget(`table:${t.id}`, 'phase'),
                    redis.hlen(`table:${t.id}:players`),
                ]);
                playersCount = count || 0;
                if (phase === 'PAUSED') {
                    tableStatus = 'PAUSED';
                }
                else if (playersCount >= t.maxSeats) {
                    tableStatus = 'FULL';
                }
                else if (playersCount > 0) {
                    tableStatus = 'ACTIVE';
                }
                else if (t.isActive) {
                    tableStatus = 'ACTIVE';
                }
                else {
                    tableStatus = 'INACTIVE';
                }
            }
            catch (error) {
                this.logger.error(`Failed to fetch Redis data for table ${t.id}: ${error.message}`);
                tableStatus = t.isActive ? 'ACTIVE' : 'INACTIVE';
            }
            return {
                id: t.id,
                name: t.name,
                stakes: `$${t.smallBlind}/$${t.bigBlind}`,
                players: `${playersCount}/${t.maxSeats}`,
                status: tableStatus,
                revenue: 0,
            };
        }));
        return result;
    }
    async updateStatus(id, dto) {
        const redis = this.redisService.getClient();
        let newStatus = 'ACTIVE';
        if (dto.action === 'PAUSE') {
            newStatus = 'PAUSED';
            await redis.hset(`table:${id}`, 'phase', 'PAUSED');
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: true },
            });
        }
        else if (dto.action === 'CLOSE') {
            newStatus = 'INACTIVE';
            await redis.hset(`table:${id}`, 'phase', 'INACTIVE');
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: false },
            });
        }
        else if (dto.action === 'OPEN') {
            newStatus = 'ACTIVE';
            await redis.hset(`table:${id}`, 'phase', 'waiting');
            await this.prisma.gameTable.update({
                where: { id },
                data: { isActive: true },
            });
        }
        this.gameGateway.server.to(`table:${id}`).emit('TABLE_STATUS_CHANGED', {
            tableId: id,
            status: newStatus,
        });
        return { success: true, status: newStatus };
    }
    async mutePlayer(tableId, playerId, body) {
        const redis = this.redisService.getClient();
        const duration = body.durationMinutes || 10;
        const muteKey = `mute:${tableId}:${playerId}`;
        await redis.set(muteKey, '1', 'EX', duration * 60);
        await redis.publish(`table:${tableId}:chat`, JSON.stringify({
            type: 'SYSTEM',
            message: `A player has been muted for ${duration} minutes.`,
            timestamp: new Date().toISOString(),
        }));
        this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_MUTED', {
            playerId,
            duration,
        });
        this.logger.log(`Admin muted player ${playerId} on table ${tableId} for ${duration}m`);
        return { success: true, mutedFor: duration };
    }
    async forceStand(tableId, seat) {
        const redis = this.redisService.getClient();
        const playersKey = `table:${tableId}:players`;
        const playerData = await redis.hget(playersKey, seat);
        if (!playerData) {
            return { success: false, message: 'Seat is empty' };
        }
        try {
            const player = JSON.parse(playerData);
            await redis.hset(playersKey, seat, JSON.stringify({
                status: 'empty',
                userId: null,
                stack: 0,
            }));
            this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_FORCED_STAND', {
                seat: parseInt(seat),
                playerId: player.userId,
                reason: 'Admin action',
            });
            this.logger.log(`Admin force-stood player from seat ${seat} on table ${tableId}`);
            return { success: true, removedPlayer: player.userId };
        }
        catch (e) {
            return { success: false, message: 'Failed to parse player data' };
        }
    }
    async forceSit(tableId, body) {
        const redis = this.redisService.getClient();
        const playersKey = `table:${tableId}:players`;
        const existingPlayer = await redis.hget(playersKey, body.seat.toString());
        if (existingPlayer) {
            try {
                const parsed = JSON.parse(existingPlayer);
                if (parsed.status !== 'empty' && parsed.userId) {
                    return { success: false, message: 'Seat is occupied' };
                }
            }
            catch (_a) { }
        }
        const table = await this.prisma.gameTable.findUnique({
            where: { id: tableId },
            select: { minBuyIn: true, maxBuyIn: true },
        });
        const chips = body.chips || Number((table === null || table === void 0 ? void 0 : table.maxBuyIn) || 1000);
        await redis.hset(playersKey, body.seat.toString(), JSON.stringify({
            userId: body.userId,
            stack: chips,
            status: 'active',
            isAdmin: true,
            ipAddress: 'ADMIN_OVERRIDE',
        }));
        this.gameGateway.server.to(`table:${tableId}`).emit('PLAYER_JOINED', {
            seat: body.seat,
            userId: body.userId,
            stack: chips,
            isAdmin: true,
        });
        this.logger.log(`Admin force-sat user ${body.userId} at seat ${body.seat} on table ${tableId}`);
        return { success: true, seat: body.seat, chips };
    }
    async broadcast(tableId, body) {
        var _a;
        if (!((_a = body.message) === null || _a === void 0 ? void 0 : _a.trim())) {
            return { success: false, message: 'Message required' };
        }
        const redis = this.redisService.getClient();
        await redis.publish(`table:${tableId}:chat`, JSON.stringify({
            type: 'ADMIN_BROADCAST',
            message: body.message,
            timestamp: new Date().toISOString(),
        }));
        this.gameGateway.server.to(`table:${tableId}`).emit('ADMIN_BROADCAST', {
            message: body.message,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Admin broadcast to table ${tableId}: ${body.message}`);
        return { success: true };
    }
};
exports.AdminGameController = AdminGameController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], AdminGameController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(':tableId/inspector'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "getInspectorDetails", null);
__decorate([
    (0, common_1.Get)(':tableId/config'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], AdminGameController.prototype, "getTableConfig", null);
__decorate([
    (0, common_1.Patch)(':tableId'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof shared_1.UpdateTableConfigDto !== "undefined" && shared_1.UpdateTableConfigDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "updateTableConfig", null);
__decorate([
    (0, common_1.Post)(':tableId/force-save'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "forceSave", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], AdminGameController.prototype, "getTables", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_h = typeof shared_1.AdminTableActionDto !== "undefined" && shared_1.AdminTableActionDto) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':tableId/players/:playerId/mute'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Param)('playerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "mutePlayer", null);
__decorate([
    (0, common_1.Post)(':tableId/players/:seat/force-stand'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Param)('seat')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "forceStand", null);
__decorate([
    (0, common_1.Post)(':tableId/force-sit'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "forceSit", null);
__decorate([
    (0, common_1.Post)(':tableId/broadcast'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminGameController.prototype, "broadcast", null);
exports.AdminGameController = AdminGameController = AdminGameController_1 = __decorate([
    (0, common_1.Controller)('admin/tables'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object, typeof (_c = typeof game_gateway_1.GameGateway !== "undefined" && game_gateway_1.GameGateway) === "function" ? _c : Object])
], AdminGameController);


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const app_module_1 = __webpack_require__(2);
const express_1 = __webpack_require__(37);
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.use((0, express_1.json)({ limit: '10mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '10mb' }));
    app.enableCors();
    await app.listen((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000);
}
bootstrap();

})();

/******/ })()
;