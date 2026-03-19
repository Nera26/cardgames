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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GameGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const game_service_1 = require("./game.service");
const ws_jwt_guard_1 = require("../auth/guards/ws-jwt.guard");
const ws_throttler_guard_1 = require("../auth/guards/ws-throttler.guard");
const lua_runner_service_1 = require("./lua-runner.service");
const wallet_service_1 = require("../wallet/wallet.service");
const hand_evaluator_service_1 = require("./hand-evaluator.service");
const shared_1 = require("@poker/shared");
const timer_service_1 = require("../scheduler/timer.service");
const ws_zod_pipe_1 = require("../common/pipes/ws-zod.pipe");
const CELEBRATION_DELAY_MS = 5000;
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
                    catch (_e) { }
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
                    if (status && status !== 'sitting_out' && status !== 'left') {
                        activeCount++;
                    }
                }
                if (activeCount >= 2) {
                    this.pendingStart.add(tableId);
                    this.logger.log(`♻️ AUTO-START: ${activeCount} active players after reconnect, starting hand on ${tableId}`);
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
                await this.broadcastTableState(tableId, response.tableState);
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
            return { success: true, message: response.message };
        }
        catch (error) {
            this.logger.error(`Error leaving table: ${error}`);
            return { success: false, message: 'Failed to leave table' };
        }
    }
    async handleToggleSitOut(client, data) {
        var _a;
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
                    });
                    await this.timerService.scheduleTimeout(tableId, turnSeat, turnTimeMs);
                }
            }
            else if (response.waitingForPlayers && response.tableState) {
                this.logger.log(`Table ${tableId} waiting for players - broadcasting sitting_out state`);
                await this.broadcastTableState(tableId, response.tableState);
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
                    this.logger.log(`[ALL-IN DEBUG] All players all-in on table ${tableId}, auto-advancing in 1s...`);
                    const advTimer = setTimeout(() => {
                        this.autoAdvanceTimers.delete(tableId);
                        this.advanceStreet(tableId);
                    }, 1000);
                    this.autoAdvanceTimers.set(tableId, advTimer);
                }
                else {
                    const turnSeat = (_a = response.tableState.table) === null || _a === void 0 ? void 0 : _a.turnSeat;
                    if (typeof turnSeat === 'number' && turnSeat >= 0) {
                        const turnTimeMs = await this.getDynamicTurnTime(tableId);
                        this.server.to(`table:${tableId}`).emit('your_turn', {
                            seat: turnSeat,
                            timeoutMs: turnTimeMs,
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
                    .map(p => ({ seat: p.seat, cards: p.cards }));
                this.server.to(`table:${tableId}`).emit('hand_result', {
                    winners: enrichedWinners,
                    handName,
                    revealedHands,
                    message: `Hand over. Pots distributed.`,
                    nextHandDelay: CELEBRATION_DELAY_MS,
                    nextHandTimestamp: Date.now() + CELEBRATION_DELAY_MS,
                });
                if (response.tableState) {
                    await this.broadcastTableState(tableId, response.tableState);
                }
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
    async broadcastTableState(tableId, state) {
        var _a, _b;
        const sockets = await this.server.in(`table:${tableId}`).fetchSockets();
        for (const socket of sockets) {
            let seat = (_a = this.sessions.get(socket.id)) === null || _a === void 0 ? void 0 : _a.seat;
            if (seat === undefined) {
                const authSocket = socket;
                const userId = (_b = authSocket.user) === null || _b === void 0 ? void 0 : _b.id;
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
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Object)
], GameGateway.prototype, "handlePing", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('subscribe_table'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.SubscribeTableEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleSubscribeTable", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('join_table'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.JoinTableEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoinTable", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leave_table'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.LeaveTableEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleLeaveTable", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('toggle_sit_out'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.ToggleSitOutEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleToggleSitOut", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('add_chips'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.AddChipsEventSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleAddChips", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('action'),
    (0, common_1.UsePipes)(new ws_zod_pipe_1.WsZodPipe(shared_1.BetActionSchema)),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleAction", null);
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
    __metadata("design:paramtypes", [lua_runner_service_1.LuaRunnerService,
        wallet_service_1.WalletService,
        hand_evaluator_service_1.HandEvaluatorService,
        timer_service_1.TimerService,
        jwt_1.JwtService,
        game_service_1.GameService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map