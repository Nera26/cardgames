/**
 * Game Gateway - Socket.io WebSocket Entry Point
 * 
 * Handles real-time poker game connections and events.
 * Executes atomic Lua scripts for all game state changes.
 * 
 * @see ARCHITECTURE.md Section 2.1 - The Gateway
 */

import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UsePipes, Inject, forwardRef, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { GameService } from './game.service';
import { WsJwtGuard, AuthenticatedSocket } from '../auth/guards/ws-jwt.guard';
import { WsThrottlerGuard } from '../auth/guards/ws-throttler.guard';
import { LuaRunnerService } from './lua-runner.service';
import { WalletService } from '../wallet/wallet.service';
import { HandEvaluatorService, Winner } from './hand-evaluator.service';
import {
    createShuffledDeck,
    JoinTableEventSchema,
    JoinTableEvent,
    LeaveTableEventSchema,
    LeaveTableEvent,
    BetActionSchema,
    BetAction,
    ToggleSitOutEventSchema,
    ToggleSitOutEvent,
    ToggleLNBBEventSchema,
    ToggleLNBBEvent,
    ToggleAutoRebuyEventSchema,
    ToggleAutoRebuyEvent,
    SetAutoMuckEventSchema,
    SetAutoMuckEvent,
    ExtendSeatForDepositEventSchema,
    ExtendSeatForDepositEvent,
    AddChipsEventSchema,
    AddChipsEvent,
    SubscribeTableEventSchema,
    SubscribeTableEvent,
    JoinWaitlistEventSchema,
    JoinWaitlistEvent,
    LeaveWaitlistEventSchema,
    LeaveWaitlistEvent,
    PlayerJoinedEvent,
} from '@poker/shared';
import { TimerService } from '../scheduler/timer.service';
import { WsZodPipe } from '../common/pipes/ws-zod.pipe';

// Track which table/seat each socket is connected to
interface SocketSession {
    tableId: string;
    seat: number;
    userId: string;
}

// Lua script response types
interface LuaResponse {
    success: boolean;
    message: string;
    triggerStart?: boolean;
    nextStreet?: boolean;
    handComplete?: boolean;
    winningSeat?: number;
    isShowdown?: boolean;
    allPlayersAllIn?: boolean;
    phase?: string;
    winners?: Winner[];
    action?: 'extended' | 'folded';
    added?: number;
    remaining?: number;
    nextTurn?: number;
    uncalledBetRefund?: { seat: number; amount: number };
    tableState?: {
        table: Record<string, unknown>;
        players: Record<string, unknown>[];
    };
}

// ============================================================
// THE CELEBRATION PAUSE: Time between hand_result and next deal
// ============================================================
const CELEBRATION_DELAY_MS = 15000;

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/game',
})
@UseGuards(WsThrottlerGuard)
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(GameGateway.name);
    private sessions: Map<string, SocketSession> = new Map();
    private configSubscriber: any = null; // Redis PubSub subscriber for Hot Sync
    private maintenanceSubscriber: any = null; // Redis PubSub subscriber for Kill Switch
    private maintenanceLockdown = false; // In-memory flag for instant lockdown checks

    // ============================================================
    // MULTI-TABLE SESSION HELPERS
    // Composite key pattern: `${socketId}:${tableId}` allows one
    // socket to be seated at multiple tables simultaneously.
    // ============================================================

    /** Build composite session key for multi-table support */
    private sessionKey(socketId: string, tableId: string): string {
        return `${socketId}:${tableId}`;
    }

    /** Store a session with composite key */
    private setSession(socketId: string, tableId: string, session: SocketSession): void {
        this.sessions.set(this.sessionKey(socketId, tableId), session);
    }

    /** Get a session by composite key */
    private getSession(socketId: string, tableId: string): SocketSession | undefined {
        return this.sessions.get(this.sessionKey(socketId, tableId));
    }

    /** Delete a session by composite key */
    private deleteSession(socketId: string, tableId: string): void {
        this.sessions.delete(this.sessionKey(socketId, tableId));
    }

    /** Delete ALL sessions for a given socket (on disconnect) */
    private deleteAllSessionsForSocket(socketId: string): void {
        for (const key of this.sessions.keys()) {
            if (key.startsWith(`${socketId}:`)) {
                this.sessions.delete(key);
            }
        }
    }

    /** Resolve session with Redis self-heal fallback for multi-table */
    private async resolveSession(
        client: AuthenticatedSocket,
        tableId: string,
        label?: string,
    ): Promise<SocketSession | null> {
        // 1. Check composite key (fast path)
        let session = this.getSession(client.id, tableId);
        if (session) return session;

        // 2. Redis self-heal: scan the actual players hash for this table
        try {
            const redis = this.luaRunner.getClient();
            const playersData = await redis.hgetall(`table:${tableId}:players`);
            for (const key of Object.keys(playersData)) {
                if (key.startsWith('seat_')) {
                    try {
                        const player = JSON.parse(playersData[key]);
                        if (player.id === client.user.id) {
                            session = { tableId, seat: player.seatNumber, userId: client.user.id };
                            this.setSession(client.id, tableId, session);
                            this.logger.log(
                                `♻️ ${label ?? 'SESSION'} SELF-HEAL: Recovered ${client.user.username} ` +
                                `seat ${player.seatNumber} on table ${tableId}`
                            );
                            return session;
                        }
                    } catch { /* skip invalid JSON */ }
                }
            }
        } catch (err) {
            this.logger.error(`resolveSession Redis error: ${err}`);
        }

        return null;
    }

    // ============================================================
    // ZOMBIE TIMER KILL SWITCH
    // Tracks pending auto-advance / celebration timeouts per table.
    // Cleared when a player leaves to prevent stale hand processing.
    // ============================================================
    private autoAdvanceTimers: Map<string, NodeJS.Timeout> = new Map();

    // ============================================================
    // RECONNECT STARTER LOCK
    // Prevents double-invocation of startNewHand when multiple
    // players reconnect simultaneously and both trigger auto-start.
    // ============================================================
    private pendingStart: Set<string> = new Set();

    // ============================================================
    // SIT-OUT SWEEPER — Depleting Time Bank Enforcer
    // Schedules auto-kick (Stand Up) when a player's sitOutBank
    // reaches zero. Cancelled if they return early.
    // Key format: "tableId:seat"
    // ============================================================
    private sitOutSweepers: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private readonly luaRunner: LuaRunnerService,
        private readonly walletService: WalletService,
        private readonly handEvaluator: HandEvaluatorService,
        private readonly timerService: TimerService,
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => GameService))
        private readonly gameService: GameService,
        @InjectQueue('cashout-settlement')
        private readonly cashoutQueue: Queue,
    ) { }

    /**
     * Initialize gateway and set up Hot Sync PubSub listener.
     */
    async afterInit(): Promise<void> {
        this.logger.log('GameGateway initialized');

        // Hot Sync Protocol: Subscribe to config updates from Admin Panel
        try {
            const redis = this.luaRunner.getClient();
            this.configSubscriber = redis.duplicate();
            await this.configSubscriber.connect();

            await this.configSubscriber.pSubscribe('table:*:config_update', async (message: string, channel: string) => {
                try {
                    // Extract tableId from channel: "table:{id}:config_update"
                    const parts = channel.split(':');
                    const tableId = parts[1];
                    const config = JSON.parse(message);

                    // Update Redis config hash with new values
                    const configKey = `table:${tableId}:config`;
                    const updates: Record<string, string> = {};
                    if (config.rakePercent !== undefined) updates.rakePercent = String(config.rakePercent);
                    if (config.rakeCap !== undefined) updates.rakeCap = String(config.rakeCap);
                    if (config.turnTime !== undefined) updates.turnTime = String(config.turnTime);
                    if (config.timeBank !== undefined) updates.timeBank = String(config.timeBank);

                    if (Object.keys(updates).length > 0) {
                        // Red Cable §2: All mutations through Lua
                        const configArgs: string[] = [];
                        for (const [field, value] of Object.entries(updates)) {
                            configArgs.push(field, value);
                        }
                        try {
                            await this.luaRunner.runScript<string>(
                                'set_config',
                                [`table:${tableId}:config`, `stream:table:${tableId}`],
                                configArgs
                            );
                            this.logger.log(`Hot Sync: Table ${tableId} config updated - ${JSON.stringify(updates)}`);
                        } catch (luaErr) {
                            this.logger.error(`Hot Sync Lua error: ${luaErr}`);
                        }
                    }
                } catch (err) {
                    this.logger.error(`Hot Sync parse error: ${err}`);
                }
            });

            this.logger.log('Hot Sync PubSub listener initialized');
        } catch (err) {
            this.logger.error(`Failed to initialize Hot Sync listener: ${err}`);
        }

        // ════════════════════════════════════════════════════════
        // 🔒 KILL SWITCH LISTENER: Subscribe to system:maintenance
        // CronService publishes here on financial drift detection.
        // Decoupled via Redis PubSub to avoid circular DI.
        // ════════════════════════════════════════════════════════
        try {
            const redis = this.luaRunner.getClient();
            this.maintenanceSubscriber = redis.duplicate();
            await this.maintenanceSubscriber.connect();

            await this.maintenanceSubscriber.subscribe('system:maintenance', async (message: string) => {
                this.logger.error(`🔒 KILL SWITCH RECEIVED: ${message}`);
                await this.enableMaintenanceMode(message);
            });

            // Check if lockdown was already active (server restart recovery)
            try {
                const existingLockdown = await this.luaRunner.getClient().get('maintenance:lockdown');
                if (existingLockdown) {
                    this.maintenanceLockdown = true;
                    this.logger.warn('🔒 MAINTENANCE LOCKDOWN ACTIVE (recovered from Redis)');
                }
            } catch { /* ignore */ }

            // Also subscribe to lift events so admin can un-freeze
            await this.maintenanceSubscriber.subscribe('system:maintenance:lift', async (message: string) => {
                this.logger.log(`🔓 LOCKDOWN LIFT RECEIVED: ${message}`);
                this.maintenanceLockdown = false;
                this.server.emit('maintenance_mode', {
                    active: false,
                    reason: 'Lockdown lifted by admin.',
                    timestamp: new Date().toISOString(),
                });
            });

            this.logger.log('Kill Switch PubSub listener initialized');
        } catch (err) {
            this.logger.error(`Failed to initialize Kill Switch listener: ${err}`);
        }
    }

    /**
     * Cleanup on module destroy - close PubSub subscriber.
     */
    async onModuleDestroy(): Promise<void> {
        if (this.configSubscriber) {
            try {
                await this.configSubscriber.pUnsubscribe('table:*:config_update');
                await this.configSubscriber.quit();
                this.logger.log('Hot Sync PubSub listener closed');
            } catch (err) {
                this.logger.error(`Error closing config subscriber: ${err}`);
            }
        }
        if (this.maintenanceSubscriber) {
            try {
                await this.maintenanceSubscriber.unsubscribe('system:maintenance');
                await this.maintenanceSubscriber.quit();
                this.logger.log('Kill Switch PubSub listener closed');
            } catch (err) {
                this.logger.error(`Error closing maintenance subscriber: ${err}`);
            }
        }
    }

    // ════════════════════════════════════════════════════════
    // 🔒 KILL SWITCH: Enable Maintenance Mode
    // Freezes ALL tables instantly. No further game actions
    // are processed until an admin resolves the drift.
    // ════════════════════════════════════════════════════════
    public async enableMaintenanceMode(reason?: string): Promise<void> {
        this.maintenanceLockdown = true;

        // Persist in Redis so the lockdown survives server restarts
        try {
            await this.luaRunner.getClient().set('maintenance:lockdown', JSON.stringify({
                reason: reason || 'MANUAL',
                activatedAt: new Date().toISOString(),
            }));
        } catch (err) {
            this.logger.error(`Failed to persist lockdown to Redis: ${err}`);
        }

        // Broadcast maintenance_mode to ALL connected sockets
        this.server.emit('maintenance_mode', {
            active: true,
            reason: reason || 'System maintenance — all tables frozen.',
            timestamp: new Date().toISOString(),
        });

        this.logger.error(`🔒 MAINTENANCE MODE ACTIVATED: ${reason || 'MANUAL'}`);
    }

    // ============================================================
    // THE TIMEKEEPER: Dynamic Turn Timer (Hot Sync Config)
    // ============================================================

    /**
     * Clear any pending auto-advance or celebration timer for a table.
     * This is the Kill Switch that prevents zombie timers from
     * processing a hand that no longer exists.
     */
    private clearTableTimer(tableId: string): void {
        const timer = this.autoAdvanceTimers.get(tableId);
        if (timer) {
            clearTimeout(timer);
            this.autoAdvanceTimers.delete(tableId);
            this.logger.log(`[Timer] Cleared pending action for table ${tableId}`);
        }
    }

    /**
     * Get dynamic turn time from Redis config.
     * Falls back to 30 seconds if config missing.
     */
    private async getDynamicTurnTime(tableId: string): Promise<number> {
        const redis = this.luaRunner.getClient();
        const turnTime = await redis.hget(`table:${tableId}:config`, 'turnTime');
        const seconds = parseInt(turnTime || '30', 10);
        return seconds * 1000; // Convert to milliseconds
    }

    /**
     * Handle new socket connections — THE RE-SEATING PROTOCOL.
     *
     * On every connection (including page refresh), we:
     * 1. Verify JWT from the handshake to identify the user.
     * 2. Scan sessions to see if this userId is already seated somewhere.
     * 3. If yes → patch the session map, join the room, send table state.
     *    This prevents the "Ghost Session" where the user becomes a
     *    passive observer after refresh.
     */
    async handleConnection(client: Socket): Promise<void> {
        this.logger.debug(`Client connected: ${client.id}`);

        // ── STEP 1: Authenticate from handshake ──
        const token =
            client.handshake.auth?.token ||
            client.handshake.query?.token ||
            (client.handshake.headers.authorization?.startsWith('Bearer ')
                ? client.handshake.headers.authorization.substring(7)
                : null);

        if (!token || typeof token !== 'string') {
            this.logger.debug(`Unauthenticated connection: ${client.id}`);
            return; // Spectators / unauthenticated — nothing to recover
        }

        let userId: string;
        let username: string;
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            });
            userId = payload.sub;
            username = payload.username || payload.email || 'unknown';

            // Attach user info to socket for downstream guards/handlers
            (client as AuthenticatedSocket).user = {
                id: userId,
                email: payload.email || '',
                username,
                role: payload.role || 'USER',
                avatarId: payload.avatarId || 'default',
                avatarUrl: payload.avatarUrl || null,
            };
        } catch {
            this.logger.debug(`Invalid JWT on connection: ${client.id}`);
            return; // Bad token — can't recover
        }

        // ── STEP 2: Search Redis for ALL existing seats (multi-table) ──
        const redis = this.luaRunner.getClient();
        const seatsHash = await redis.hgetall(`user:${userId}:seats`);

        // Build list of tables the user is seated at
        const seatedTables: { tableId: string; seat: number }[] = [];
        if (seatsHash && Object.keys(seatsHash).length > 0) {
            for (const [tId, seatStr] of Object.entries(seatsHash)) {
                seatedTables.push({ tableId: tId, seat: parseInt(seatStr, 10) });
            }
        } else {
            // Fallback: scan in-memory sessions (handles legacy sessions)
            for (const [, session] of this.sessions.entries()) {
                if (session.userId === userId) {
                    seatedTables.push({ tableId: session.tableId, seat: session.seat });
                }
            }
        }

        if (seatedTables.length === 0) {
            this.logger.debug(`No existing seats for ${username} (${client.id})`);
            return; // Not seated anywhere — normal connect
        }

        // Re-seat on ALL tables the user is seated at
        for (const { tableId, seat } of seatedTables) {
            // VALIDATE the seat still exists in the actual table
            const seatKey = `seat_${seat}`;
            const playerData = await redis.hget(`table:${tableId}:players`, seatKey);

            if (!playerData) {
                this.logger.warn(
                    `♻️ STALE SEAT: ${username}'s seat ${seat} no longer exists on table ${tableId}. ` +
                    `Cleaning up.`
                );
                await redis.hdel(`user:${userId}:seats`, tableId);
                continue;
            }

            // Extra safety: verify the player ID in the seat matches this user
            try {
                const parsed = JSON.parse(playerData);
                if (parsed.id !== userId) {
                    this.logger.warn(
                        `♻️ SEAT MISMATCH: Seat ${seat} on ${tableId} belongs to ${parsed.id}, not ${userId}. ` +
                        `Cleaning up.`
                    );
                    await redis.hdel(`user:${userId}:seats`, tableId);
                    continue;
                }
            } catch {
                this.logger.warn(`♻️ CORRUPT SEAT DATA for seat ${seat} on ${tableId}. Cleaning up.`);
                await redis.hdel(`user:${userId}:seats`, tableId);
                continue;
            }

            this.logger.log(
                `♻️ RE-SEATING: ${username} reconnected. ` +
                `New socket ${client.id} ` +
                `(table ${tableId}, seat ${seat})`
            );

            // Patch session map (clean up stale entries for this user on THIS table)
            for (const [key, s] of this.sessions.entries()) {
                if (s.userId === userId && s.tableId === tableId) {
                    this.sessions.delete(key);
                }
            }
            this.setSession(client.id, tableId, {
                tableId,
                seat,
                userId,
            });

            // Join Socket.io room
            await client.join(`table:${tableId}`);

            // Clear offline flag via Lua
            try {
                await this.luaRunner.runScript<string>(
                    'set_online',
                    [`table:${tableId}:players`],
                    [seat]
                );
            } catch (err) {
                this.logger.error(`Re-seating set_online error for table ${tableId}: ${err}`);
            }

            // Emit connection status
            this.server.to(`table:${tableId}`).emit('player_connection_status', {
                tableId,
                seat,
                status: 'online',
                username,
            });

            // Send session_recovered so the client navigates to the game page
            client.emit('session_recovered', { tableId, seatNumber: seat });

            this.logger.log(
                `♻️ RE-SEATING complete: ${username} at seat ${seat} on table ${tableId}`
            );
        }
    }

    // ============================================================
    // HEARTBEAT — Client pulse "I am alive"
    // Updates last_seen in Redis with 60s TTL.
    // If a client stops sending these, the Reaper will evict them.
    // ============================================================

    @SkipThrottle()
    @SubscribeMessage('heartbeat')
    async handleHeartbeat(
        @ConnectedSocket() client: AuthenticatedSocket,
    ): Promise<void> {
        // Multi-table: heartbeat all tables this socket is seated at
        for (const [key, session] of this.sessions.entries()) {
            if (!key.startsWith(`${client.id}:`)) continue;

            // Red Cable §2: All mutations through Lua
            try {
                await this.luaRunner.runScript<string>(
                    'set_heartbeat',
                    [`last_seen:${session.tableId}:${session.seat}`],
                    [Date.now().toString()]
                );
            } catch (err) {
                this.logger.error(`Heartbeat Lua error: ${err}`);
            }
        }
    }

    /**
     * Expose active sessions for the Reaper service.
     * Returns a snapshot of all currently connected socket sessions.
     */
    getActiveSessions(): Map<string, SocketSession> {
        return this.sessions;
    }

    /**
     * Handle socket disconnections.
     * Clean up player sessions and notify tables.
     */
    async handleDisconnect(client: Socket): Promise<void> {
        const authClient = client as AuthenticatedSocket;

        // Multi-table disconnect: find ALL sessions for this socket
        const sessionsForSocket: SocketSession[] = [];
        for (const [key, s] of this.sessions.entries()) {
            if (key.startsWith(`${client.id}:`)) {
                sessionsForSocket.push(s);
            }
        }

        if (sessionsForSocket.length > 0 && authClient.user) {
            for (const session of sessionsForSocket) {
                // STALE DISCONNECT GUARD: If a newer socket for the same user is already
                // connected (handleConnection re-seated them), this disconnect is stale.
                let newerSessionExists = false;
                for (const [key, s] of this.sessions.entries()) {
                    if (!key.startsWith(`${client.id}:`) && s.userId === session.userId && s.tableId === session.tableId) {
                        newerSessionExists = true;
                        break;
                    }
                }

                if (newerSessionExists) {
                    this.logger.debug(`Stale disconnect ignored for ${authClient.user.username} on table ${session.tableId} — newer socket active`);
                    continue;
                }

                this.logger.log(`User ${authClient.user.username} disconnected from table ${session.tableId}`);

                // ── SOFT DISCONNECT: Atomic Lua (§17.2 — Lua is the Judge) ──
                try {
                    const result = await this.luaRunner.runScript<string>(
                        'set_offline',
                        [`table:${session.tableId}:players`],
                        [session.seat]
                    );
                    const response = JSON.parse(result);
                    if (response.success) {
                        this.logger.log(`Soft disconnect: ${authClient.user.username} marked offline at seat ${session.seat}`);
                    }
                } catch (error) {
                    this.logger.error(`Error running set_offline.lua: ${error}`);
                }

                // BROADCAST STATE: Tell the room this player went offline
                this.server.to(`table:${session.tableId}`).emit('player_connection_status', {
                    tableId: session.tableId,
                    seat: session.seat,
                    status: 'offline',
                    username: authClient.user.username,
                });
            }

            // Clean up ALL socket sessions
            this.deleteAllSessionsForSocket(client.id);
        } else {
            this.logger.debug(`Anonymous client disconnected: ${client.id}`);
        }
    }

    /**
     * Ping handler for connection health checks.
     */
    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket): { event: string; data: string } {
        return { event: 'pong', data: new Date().toISOString() };
    }

    /**
     * Subscribe to table state as a spectator (Spectator First architecture).
     * Joins the socket.io room to receive table_state broadcasts without taking a seat.
     * This enables the "Ghost Seat" UI where spectators can see the game before sitting.
     *
     * THE WELCOME PACKAGE: Always sends current table state on subscribe,
     * even if the table is empty (waiting phase with 0 players).
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe_table')
    @UsePipes(new WsZodPipe(SubscribeTableEventSchema))
    async handleSubscribeTable(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: SubscribeTableEvent,
    ): Promise<{ success: boolean; message: string }> {
        const { tableId } = data;
        const user = client.user;

        this.logger.log(`${user.username} subscribing to table ${tableId} as spectator`);

        try {
            // 1. Initialize Redis from Postgres if not already done (lazy seed)
            await this.gameService.initializeTableRedis(tableId);

            // 2. Join Socket.io room to receive future broadcasts
            await client.join(`table:${tableId}`);

            // 3. Fetch current table state from Redis
            const redis = this.luaRunner.getClient();
            const tableData = await redis.hgetall(`table:${tableId}`);
            const playersData = await redis.hgetall(`table:${tableId}:players`);

            // Build players array
            const players: Record<string, unknown>[] = [];
            for (const key of Object.keys(playersData)) {
                if (key.startsWith('seat_')) {
                    try {
                        players.push(JSON.parse(playersData[key]));
                    } catch { /* skip invalid */ }
                }
            }

            // 4. THE WELCOME PACKAGE: Always send state, even if empty
            //    Ensure minimum fields exist so frontend can render the felt
            const tableState = {
                table: {
                    phase: 'waiting',
                    pot: '0',
                    currentBet: '0',
                    turnSeat: '-1',
                    dealerSeat: '0',
                    communityCards: '[]',
                    ...tableData, // Override defaults with real data if it exists
                },
                players,
            };

            // Determine seat: check session map, then match userId against player data
            let playerSeat: number | undefined = this.getSession(client.id, tableId)?.seat;
            if (playerSeat === undefined) {
                // Fallback: match userId against players array
                const matchedPlayer = players.find(p => (p as any).id === user.id);
                if (matchedPlayer && typeof (matchedPlayer as any).seatNumber === 'number') {
                    playerSeat = (matchedPlayer as any).seatNumber;
                    // Self-heal session map
                    this.setSession(client.id, tableId, { tableId, seat: playerSeat as number, userId: user.id });
                    this.logger.debug(`subscribe_table: healed session for ${user.username} at seat ${playerSeat}`);
                }
            }

            // Filter state: show hole cards for seated player, or spectator view
            const filteredState = this.filterStateForPlayer(tableState, playerSeat);
            client.emit('table_state', filteredState);

            this.logger.log(`Welcome package sent to ${user.username} for table ${tableId} (${players.length} players)`);

            return { success: true, message: 'Subscribed to table' };
        } catch (error) {
            this.logger.error(`Error subscribing to table: ${error}`);
            return { success: false, message: 'Failed to subscribe to table' };
        }
    }

    /**
     * Join a table - requires authentication.
     * Executes join_table.lua atomically.
     * If 2+ players are ready, triggers next_hand.lua.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_table')
    @UsePipes(new WsZodPipe(JoinTableEventSchema))
    async handleJoinTable(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: JoinTableEvent,
    ): Promise<{ success: boolean; message: string }> {
        // 🔒 KILL SWITCH GUARD: Block new joins during lockdown
        if (this.maintenanceLockdown) {
            return { success: false, message: 'System is in maintenance mode. All tables are frozen.' };
        }

        const { tableId, seatNumber, buyIn, password } = data;
        const user = client.user;

        this.logger.log(`${user.username} joining table ${tableId} seat ${seatNumber} with ${buyIn} chips`);

        try {
            // Hot Sync: Initialize Redis config from Postgres (lazy load on first join)
            await this.gameService.initializeTableRedis(tableId);

            // 🔒 PRIVATE TABLE BOUNCER: Validate password before any state mutation
            const tableConfig = await this.gameService.getTablePassword(tableId);
            if (tableConfig) {
                if (!password || password !== tableConfig) {
                    this.logger.warn(`${user.username} failed password check for private table ${tableId}`);
                    return {
                        success: false,
                        message: 'Invalid password for private table',
                        errorCode: 'ERR_INVALID_PASSWORD',
                    } as any;
                }
            }

            // Step 1: Read current Postgres balance (pre-deduction)
            const wallet = await this.walletService.getBalance(user.id);
            const userBalance = wallet.realBalance;

            // Step 2: Sync ORIGINAL balance to Redis so join_table.lua can validate & deduct
            await this.luaRunner.runScript<string>(
                'sync_balance',
                [`user:${user.id}:balance`],
                [userBalance.toString(), user.id]
            );

            // Step 3: Execute join_table.lua (Redis deducts atomically)
            const result = await this.luaRunner.runScript<string>(
                'join_table',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                    `user:${user.id}:balance`,
                ],
                [seatNumber, buyIn, user.id, user.username, user.avatarId, user.avatarUrl || '']
            );

            const response: LuaResponse = JSON.parse(result);

            if (!response.success) {
                return { success: false, message: response.message };
            }

            // Step 4: 🔵 BLUE CABLE — Anchor the deduction in Postgres
            // Redis succeeded, now create the immutable BUY_IN ledger row.
            // If this fails, reverse the Redis join.
            try {
                await this.walletService.lockFunds(user.id, { tableId, amount: buyIn });
            } catch (lockErr) {
                this.logger.error(`lockFunds failed after Redis join — reversing: ${lockErr}`);
                // Refund Redis: add buyIn back to balance
                const redis = this.luaRunner.getClient();
                await redis.incrby(`user:${user.id}:balance`, buyIn);
                // Remove player from table
                await redis.hdel(`table:${tableId}:players`, `seat_${seatNumber}`);
                return { success: false, message: 'Insufficient wallet balance for buy-in.' };
            }

            // Handle Reconnection Action
            if ((response as any).action === 'reconnected') {
                const seat = (response as any).seat;
                this.logger.log(`${user.username} reconnected to seat ${seat} on table ${tableId}`);

                // 1. Update session map + Redis index with the new socket ID
                this.setSession(client.id, tableId, {
                    tableId,
                    seat,
                    userId: user.id
                });
                const redis = this.luaRunner.getClient();
                await redis.hset(`user:${user.id}:seats`, tableId, seat.toString());

                // 2. Join Socket.io room
                await client.join(`table:${tableId}`);

                // 2.5. Atomic reconnect: Clear offline flag + promote (§17.2)
                try {
                    const onlineResult = await this.luaRunner.runScript<string>(
                        'set_online',
                        [`table:${tableId}:players`],
                        [seat]
                    );
                    const onlineResponse = JSON.parse(onlineResult);
                    if (onlineResponse.success) {
                        this.logger.log(`Reconnect: ${user.username} back online at seat ${seat} (status: ${onlineResponse.status})`);
                    }
                } catch (err) {
                    this.logger.error(`Error running set_online.lua: ${err}`);
                }

                // 3. Emit connection status to the room (Red Cable §3: Broadcast State)
                this.server.to(`table:${tableId}`).emit('player_connection_status', {
                    tableId,
                    seat,
                    status: 'online',
                    username: user.username,
                });

                // 4. Emit full TABLE_STATE to the client immediately
                if (response.tableState) {
                    const filteredState = this.filterStateForPlayer(response.tableState, seat);
                    client.emit('table_state', filteredState);
                }

                return { success: true, message: "Reconnected successfully" };
            }

            // Track socket session + Redis index
            this.setSession(client.id, tableId, {
                tableId,
                seat: seatNumber,
                userId: user.id,
            });
            const redisClient = this.luaRunner.getClient();
            await redisClient.hset(`user:${user.id}:seats`, tableId, seatNumber.toString());

            // Join Socket.io room
            await client.join(`table:${tableId}`);

            // ── CONDITIONAL BROADCAST: Scalpel vs Sledgehammer ──
            // During an active hand, a full state broadcast causes render-thrashing
            // in the frontend (useGameOrchestrator queues a 400ms state update,
            // momentarily making isMyTurn evaluate to false for the active player).
            // Fix: Only broadcast lightweight player_joined event to existing clients.
            if (response.tableState) {
                const currentPhase = (response.tableState?.table as any)?.phase || 'waiting';

                if (currentPhase === 'waiting') {
                    // Table idle — safe to blast full state to everyone
                    await this.broadcastTableState(tableId, response.tableState);
                } else {
                    // 🔴 MID-HAND JOIN: Surgical approach
                    // 1. Send full state ONLY to the joining client (they need the whole picture)
                    const filteredState = this.filterStateForPlayer(response.tableState, seatNumber);
                    client.emit('table_state', filteredState);

                    // 2. Send lightweight player_joined event to the REST of the room
                    //    This triggers an immutable merge in SocketContext — no state clobber
                    const newPlayer = (response.tableState.players as Array<Record<string, unknown>>)
                        ?.find((p: Record<string, unknown>) => Number(p.seatNumber) === Number(seatNumber));

                    if (newPlayer) {
                        const joinedPayload = {
                            tableId,
                            player: {
                                id: String(newPlayer.id),
                                username: String(newPlayer.username),
                                chips: Number(newPlayer.chips),
                                status: String(newPlayer.status),
                                cards: Array.isArray(newPlayer.cards) ? newPlayer.cards.map(String) : [],
                                currentBet: Number(newPlayer.currentBet ?? 0),
                                seatNumber: Number(newPlayer.seatNumber),
                                avatarId: String(newPlayer.avatarId ?? 'avatar_1'),
                                avatarUrl: newPlayer.avatarUrl ? String(newPlayer.avatarUrl) : null,
                            },
                        };
                        client.to(`table:${tableId}`).emit('player_joined', joinedPayload);
                        this.logger.log(`🔴 Mid-hand join: emitted player_joined (seat ${seatNumber}) instead of full state broadcast`);
                    }
                }
            }

            // Auto-start: If 2+ players, start the hand
            if (response.triggerStart) {
                await this.startNewHand(tableId);
            }

            return { success: true, message: response.message };
        } catch (error) {
            this.logger.error(`Error joining table: ${error}`);
            return { success: false, message: 'Failed to join table' };
        }
    }

    /**
     * Leave a table - requires authentication.
     * Executes leave_table.lua atomically.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leave_table')
    @UsePipes(new WsZodPipe(LeaveTableEventSchema))
    async handleLeaveTable(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: LeaveTableEvent,
    ): Promise<{ success: boolean; message: string }> {
        const { tableId } = data;
        const user = client.user;
        const session = this.getSession(client.id, tableId) ?? (await this.resolveSession(client, tableId, 'LEAVE'));

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        this.logger.log(`${user.username} leaving table ${tableId}`);

        try {
            // KILL SWITCH: Cancel any pending auto-advance timers for this table
            this.clearTableTimer(tableId);

            // Execute leave_table.lua
            const result = await this.luaRunner.runScript<string>(
                'leave_table',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                    `user:${user.id}:balance`,
                ],
                [session.seat, user.id, 'false']
            );

            const response: LuaResponse = JSON.parse(result);

            if (!response.success) {
                return { success: false, message: response.message };
            }

            // Leave Socket.io room
            await client.leave(`table:${tableId}`);
            this.deleteSession(client.id, tableId);
            // Clear Redis seat index
            const redisClient = this.luaRunner.getClient();
            await redisClient.hdel(`user:${user.id}:seats`, tableId);

            // 🟡 YELLOW CABLE: Enqueue cashout settlement (Write-Behind Sync)
            // Gateway stays <50ms — CashOutProcessor handles Postgres settlement
            const refundedAmount = (response as any).refundedAmount ?? 0;
            if (refundedAmount > 0) {
                const jobId = `cashout:${user.id}:${tableId}:${Date.now()}`;
                await this.cashoutQueue.add('settle-cashout', {
                    userId: user.id,
                    amount: refundedAmount,
                    tableId,
                    source: 'leave_table',
                }, { jobId });
                this.logger.log(`🟡 Enqueued cashout: ${user.id} +$${refundedAmount} from ${tableId} (job: ${jobId})`);
            }

            // Broadcast updated table state
            if (response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
            }

            // AUTO-RESUME: If enough active players remain and table is idle, deal next hand.
            // This closes the 3→2 player stall where the engine passively waited for a
            // "join" event instead of recognizing that 2 remaining players is still valid.
            const phase = (response.tableState?.table as any)?.phase || 'waiting';
            const remainingActive = (response as any).remainingActive ?? 0;
            if (remainingActive >= 2 && phase === 'waiting') {
                this.logger.log(`[Leave] ${remainingActive} active players remain on table ${tableId}, auto-resuming...`);
                setTimeout(() => this.startNewHand(tableId), 1000);
            }

            return { success: true, message: response.message };
        } catch (error) {
            this.logger.error(`Error leaving table: ${error}`);
            return { success: false, message: 'Failed to leave table' };
        }
    }

    /**
     * Toggle Sit-Out status - requires authentication.
     * Executes toggle_sit_out.lua atomically.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('toggle_sit_out')
    @UsePipes(new WsZodPipe(ToggleSitOutEventSchema))
    async handleToggleSitOut(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: ToggleSitOutEvent,
    ): Promise<{ success: boolean; message: string; player?: any }> {
        const { tableId } = data;
        const user = client.user;
        const session = await this.resolveSession(client, tableId, 'SIT-OUT');

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        try {
            const result = await this.luaRunner.runScript<string>(
                'toggle_sit_out',
                [`table:${tableId}:players`],
                [session.seat]
            );

            const response = JSON.parse(result);
            if (response.success && response.player) {
                // Broadcast full table state so all clients see the ☕ icon / status change
                const redis = this.luaRunner.getClient();
                const tableData = await redis.hgetall(`table:${tableId}`);
                const players: Record<string, unknown>[] = [];
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (pData) {
                        players.push(JSON.parse(pData));
                    }
                }
                const freshState = {
                    table: {
                        ...tableData,
                        pot: Number(tableData.pot || 0),
                        currentBet: Number(tableData.currentBet || 0),
                        turnSeat: Number(tableData.turnSeat ?? -1),
                        dealerSeat: Number(tableData.dealerSeat || 0),
                        smallBlindSeat: Number(tableData.smallBlindSeat || 0),
                        bigBlindSeat: Number(tableData.bigBlindSeat || 0),
                        communityCards: JSON.parse(tableData.communityCards || '[]'),
                    },
                    players,
                };
                await this.broadcastTableState(tableId, freshState);

                // ════════════════════════════════════════════════
                // SIT-OUT SWEEPER LOGIC (Depleting Time Bank)
                // ════════════════════════════════════════════════
                const sweeperKey = `${tableId}:${session.seat}`;

                if (response.player.status === 'sitting_out') {
                    // Player just sat out → schedule auto-kick
                    const bankMs = (response.sitOutBank ?? 900) * 1000;

                    // Clear any existing sweeper first (safety)
                    const existing = this.sitOutSweepers.get(sweeperKey);
                    if (existing) clearTimeout(existing);

                    if (bankMs <= 0) {
                        // Bank already depleted → kick immediately
                        this.logger.log(`⏰ SWEEPER: ${user.username} bank depleted → auto Stand Up on table ${tableId}`);
                        // Simulate leave_table by calling existing handler
                        try {
                            await this.forceStandUp(tableId, session.seat, user.id);
                        } catch (err: any) {
                            this.logger.error(`SWEEPER auto-kick failed: ${err.message}`);
                        }
                    } else {
                        this.logger.log(`⏰ SWEEPER: Scheduling auto-kick for ${user.username} in ${bankMs / 1000}s`);
                        const timer = setTimeout(async () => {
                            this.sitOutSweepers.delete(sweeperKey);
                            // Re-check: is player still sitting_out?
                            try {
                                const pData = await redis.hget(`table:${tableId}:players`, `seat_${session!.seat}`);
                                if (pData) {
                                    const p = JSON.parse(pData);
                                    if (p.status === 'sitting_out') {
                                        this.logger.log(`⏰ SWEEPER FIRED: ${p.username} auto Stand Up on table ${tableId}`);
                                        await this.forceStandUp(tableId, session!.seat, p.id);
                                    }
                                }
                            } catch (err: any) {
                                this.logger.error(`SWEEPER timeout error: ${err.message}`);
                            }
                        }, bankMs);
                        this.sitOutSweepers.set(sweeperKey, timer);
                    }
                } else {
                    // Player returned → cancel sweeper
                    const existing = this.sitOutSweepers.get(sweeperKey);
                    if (existing) {
                        clearTimeout(existing);
                        this.sitOutSweepers.delete(sweeperKey);
                        this.logger.log(`⏰ SWEEPER CANCELLED: ${user.username} returned (${response.sitOutBank}s remaining)`);
                    }
                }

                // AUTO-START: If player returned and makes >= 2 active, kick the starter motor
                const activeCount = response.activeCount || 0;
                const phase = tableData.phase || 'waiting';
                if (activeCount >= 2 && phase === 'waiting') {
                    this.logger.log(`[SitOut] Player returned → ${activeCount} active players, starting hand on table ${tableId}`);
                    setTimeout(() => this.startNewHand(tableId), 1000);
                }

                return { success: true, message: "Status toggled", player: response.player };
            }
            return { success: false, message: response.message || "Failed to toggle status" };
        } catch (error) {
            this.logger.error(`Error toggling sit out: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }

    /**
     * Force a player to Stand Up (give up seat, refund chips).
     * Used by: Sit-Out Sweeper (time bank depleted), future "Stand Up" button.
     * Executes leave_table.lua server-side without needing the player's socket.
     */
    public async forceStandUp(tableId: string, seat: number, userId: string): Promise<void> {
        try {
            const result = await this.luaRunner.runScript<string>(
                'leave_table',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                    `user:${userId}:balance`,
                ],
                [seat, userId, 'false']
            );

            const response: LuaResponse = JSON.parse(result);

            if (!response.success) {
                this.logger.error(`forceStandUp failed for ${userId}: ${response.message}`);
                return;
            }

            // Clean up session map — find the socket for this user
            for (const [socketId, session] of this.sessions.entries()) {
                if (session.userId === userId && session.tableId === tableId) {
                    this.sessions.delete(socketId);
                    // Also clear Redis seat key
                    const redis = this.luaRunner.getClient();
                    await redis.hdel(`user:${userId}:seats`, tableId);
                    break;
                }
            }

            // Broadcast updated state
            if (response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
            }

            // 🟡 YELLOW CABLE: Enqueue cashout settlement (Write-Behind Sync)
            const refundedAmount = (response as any).refundedAmount ?? 0;
            if (refundedAmount > 0) {
                const jobId = `cashout:${userId}:${tableId}:${Date.now()}`;
                await this.cashoutQueue.add('settle-cashout', {
                    userId,
                    amount: refundedAmount,
                    tableId,
                    source: 'force_stand_up',
                }, { jobId });
                this.logger.log(`🟡 Enqueued cashout (forceStandUp): ${userId} +$${refundedAmount} from ${tableId} (job: ${jobId})`);
            }

            // Auto-resume if enough players remain
            const phase = (response.tableState?.table as any)?.phase || 'waiting';
            const remainingActive = (response as any).remainingActive ?? 0;
            if (remainingActive >= 2 && phase === 'waiting') {
                setTimeout(() => this.startNewHand(tableId), 1000);
            }

            this.logger.log(`\u2705 forceStandUp: ${userId} removed from seat ${seat} on table ${tableId}`);
        } catch (error: any) {
            this.logger.error(`forceStandUp error: ${error.message}`);
        }
    }

    /**
     * Toggle Leave Next Big Blind (LNBB) flag.
     * Executes toggle_lnbb.lua atomically.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('toggle_lnbb')
    @UsePipes(new WsZodPipe(ToggleLNBBEventSchema))
    async handleToggleLNBB(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: ToggleLNBBEvent,
    ): Promise<{ success: boolean; message: string }> {
        const { tableId, value } = data;
        const user = client.user;
        const session = await this.resolveSession(client, tableId, 'LNBB');

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        try {
            const result = await this.luaRunner.runScript<string>(
                'toggle_lnbb',
                [`table:${tableId}:players`],
                [session.seat, value.toString()]
            );

            const response = JSON.parse(result);
            if (response.success) {
                // Broadcast full table state so all clients see the updated flag
                const redis = this.luaRunner.getClient();
                const tableData = await redis.hgetall(`table:${tableId}`);
                const players: Record<string, unknown>[] = [];
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (pData) {
                        players.push(JSON.parse(pData));
                    }
                }
                const freshState = {
                    table: {
                        ...tableData,
                        pot: Number(tableData.pot || 0),
                        currentBet: Number(tableData.currentBet || 0),
                        turnSeat: Number(tableData.turnSeat ?? -1),
                        dealerSeat: Number(tableData.dealerSeat || 0),
                        smallBlindSeat: Number(tableData.smallBlindSeat || 0),
                        bigBlindSeat: Number(tableData.bigBlindSeat || 0),
                        communityCards: JSON.parse(tableData.communityCards || '[]'),
                    },
                    players,
                };
                await this.broadcastTableState(tableId, freshState);

                return { success: true, message: `LNBB ${value ? 'enabled' : 'disabled'}` };
            }
            return { success: false, message: response.message || 'Failed to toggle LNBB' };
        } catch (error) {
            this.logger.error(`Error toggling LNBB: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }

    /**
     * Extend Seat For Deposit — Hold seat for 180s while player deposits funds.
     * Resets the sitOutSweeper timer to 180s so busted players aren't kicked.
     * Executes extend_seat.lua atomically.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('extend_seat_for_deposit')
    @UsePipes(new WsZodPipe(ExtendSeatForDepositEventSchema))
    async handleExtendSeatForDeposit(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: ExtendSeatForDepositEvent,
    ): Promise<{ success: boolean; message: string; sitOutBank?: number }> {
        const { tableId } = data;
        const user = client.user;
        const session = await this.resolveSession(client, tableId, 'EXTEND_SEAT');

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        try {
            const result = await this.luaRunner.runScript<string>(
                'extend_seat',
                [`table:${tableId}:players`],
                [session.seat]
            );

            const response = JSON.parse(result);
            if (response.success) {
                // Reset the sitOutSweeper timer to 180s
                const sweeperKey = `${tableId}:${session.seat}`;
                const existing = this.sitOutSweepers.get(sweeperKey);
                if (existing) clearTimeout(existing);

                const redis = this.luaRunner.getClient();
                const bankMs = 180 * 1000; // 3 minutes
                this.logger.log(`⏰ DEPOSIT EXTENSION: Resetting sweeper for ${user.username} to ${bankMs / 1000}s`);

                const timer = setTimeout(async () => {
                    this.sitOutSweepers.delete(sweeperKey);
                    try {
                        const pData = await redis.hget(`table:${tableId}:players`, `seat_${session!.seat}`);
                        if (pData) {
                            const p = JSON.parse(pData);
                            if (p.status === 'sitting_out' || p.status === 'busted') {
                                this.logger.log(`⏰ DEPOSIT SWEEPER FIRED: ${p.username} auto Stand Up on table ${tableId}`);
                                await this.forceStandUp(tableId, session!.seat, p.id);
                            }
                        }
                    } catch (err: any) {
                        this.logger.error(`DEPOSIT SWEEPER timeout error: ${err.message}`);
                    }
                }, bankMs);
                this.sitOutSweepers.set(sweeperKey, timer);

                // 🔴 Broadcast updated state to ALL clients so they see "Depositing" badge
                const tableData = await redis.hgetall(`table:${tableId}`);
                const players: any[] = [];
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (pData) {
                        players.push(JSON.parse(pData));
                    }
                }
                const freshState = {
                    table: {
                        ...tableData,
                        pot: Number(tableData.pot || 0),
                        currentBet: Number(tableData.currentBet || 0),
                        turnSeat: Number(tableData.turnSeat ?? -1),
                        dealerSeat: Number(tableData.dealerSeat || 0),
                        smallBlindSeat: Number(tableData.smallBlindSeat || 0),
                        bigBlindSeat: Number(tableData.bigBlindSeat || 0),
                        communityCards: JSON.parse(tableData.communityCards || '[]'),
                    },
                    players,
                };
                await this.broadcastTableState(tableId, freshState);

                return { success: true, message: response.message, sitOutBank: response.sitOutBank };
            }
            return { success: false, message: response.message || 'Failed to extend seat' };
        } catch (error) {
            this.logger.error(`Error extending seat for deposit: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }

    /**
     * Toggle Auto Rebuy preference flag.
     * Executes toggle_auto_rebuy.lua atomically.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('toggle_auto_rebuy')
    @UsePipes(new WsZodPipe(ToggleAutoRebuyEventSchema))
    async handleToggleAutoRebuy(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: ToggleAutoRebuyEvent,
    ): Promise<{ success: boolean; message: string }> {
        const { tableId, value } = data;
        const user = client.user;
        const session = await this.resolveSession(client, tableId, 'AUTO_REBUY');

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        try {
            const result = await this.luaRunner.runScript<string>(
                'toggle_auto_rebuy',
                [`table:${tableId}:players`],
                [session.seat, value.toString()]
            );

            const response = JSON.parse(result);
            if (response.success) {
                // Broadcast full table state so all clients see the updated flag
                const redis = this.luaRunner.getClient();
                const tableData = await redis.hgetall(`table:${tableId}`);
                const players: Record<string, unknown>[] = [];
                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (pData) {
                        players.push(JSON.parse(pData));
                    }
                }
                const freshState = {
                    table: {
                        ...tableData,
                        pot: Number(tableData.pot || 0),
                        currentBet: Number(tableData.currentBet || 0),
                        turnSeat: Number(tableData.turnSeat ?? -1),
                        dealerSeat: Number(tableData.dealerSeat || 0),
                        smallBlindSeat: Number(tableData.smallBlindSeat || 0),
                        bigBlindSeat: Number(tableData.bigBlindSeat || 0),
                        communityCards: JSON.parse(tableData.communityCards || '[]'),
                    },
                    players,
                };
                await this.broadcastTableState(tableId, freshState);

                return { success: true, message: `Auto Rebuy ${value ? 'enabled' : 'disabled'}` };
            }
            return { success: false, message: response.message || 'Failed to toggle Auto Rebuy' };
        } catch (error) {
            this.logger.error(`Error toggling Auto Rebuy: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }

    /**
     * Set Auto-Muck preference flag.
     * When enabled, showdown.lua will scrub this player's losing cards
     * from the HAND_END broadcast — they won't be revealed to the table.
     * Executes set_auto_muck.lua atomically.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('set_auto_muck')
    @UsePipes(new WsZodPipe(SetAutoMuckEventSchema))
    async handleSetAutoMuck(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: SetAutoMuckEvent,
    ): Promise<{ success: boolean; message: string }> {
        const { tableId, value } = data;
        const user = client.user;
        const session = await this.resolveSession(client, tableId, 'AUTO_MUCK');

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        try {
            const result = await this.luaRunner.runScript<string>(
                'set_auto_muck',
                [`table:${tableId}:players`],
                [session.seat, value.toString()]
            );

            const response = JSON.parse(result);
            if (response.success) {
                // No broadcast needed — autoMuck is a private preference
                return { success: true, message: `Auto-Muck ${value ? 'enabled' : 'disabled'}` };
            }
            return { success: false, message: response.message || 'Failed to set Auto-Muck' };
        } catch (error) {
            this.logger.error(`Error setting Auto-Muck: ${error}`);
            return { success: false, message: 'Internal error' };
        }
    }

    /**
     * Add chips (rebuy) - Ghost Protocol.
     * Allows sitting_out players to reload and rejoin.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('add_chips')
    @UsePipes(new WsZodPipe(AddChipsEventSchema))
    async handleAddChips(
        @ConnectedSocket() client: AuthenticatedSocket,
        // Note: lockdown guard is applied below after parsing MessageBody
        @MessageBody() data: AddChipsEvent,
    ): Promise<{ success: boolean; message: string; tableChips?: number; walletBalance?: number }> {
        // 🔒 KILL SWITCH GUARD: Block chip reloads during lockdown (Mandate 2: Deep Freeze)
        if (this.maintenanceLockdown) {
            return { success: false, message: 'System is in maintenance mode. All tables are frozen.' };
        }

        const { tableId, amount } = data;
        const user = client.user;
        const session = this.getSession(client.id, tableId) ?? (await this.resolveSession(client, tableId, 'ADD_CHIPS'));

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        this.logger.log(`${user.username} adding ${amount} chips on table ${tableId}`);

        try {
            // Step 1: Read current Postgres balance (pre-deduction)
            const preLockWallet = await this.walletService.getBalance(user.id);

            // Step 2: Sync ORIGINAL balance to Redis so add_chips.lua can validate & deduct
            await this.luaRunner.runScript<string>(
                'sync_balance',
                [`user:${user.id}:balance`],
                [preLockWallet.realBalance.toString(), user.id]
            );

            // Step 3: Execute add_chips.lua (Redis validates balance & deducts atomically)
            const result = await this.luaRunner.runScript<string>(
                'add_chips',
                [
                    `table:${tableId}:players`,
                    `user:${user.id}:balance`,
                ],
                [session.seat, amount]
            );

            const response = JSON.parse(result);

            if (!response.success) {
                return { success: false, message: response.message };
            }

            // Step 4: 🔵 BLUE CABLE — Anchor the deduction in Postgres
            // Redis succeeded, now create the immutable BUY_IN ledger row.
            // If this fails, reverse by refunding via settleCashOut.
            try {
                await this.walletService.lockFunds(user.id, { tableId, amount });
            } catch (lockErr) {
                this.logger.error(`lockFunds failed after add_chips — refunding Redis: ${lockErr}`);
                // Refund Redis balance
                const redis = this.luaRunner.getClient();
                await redis.incrby(`user:${user.id}:balance`, amount);
                // Reverse the chip addition on the player
                const playerData = await redis.hget(`table:${tableId}:players`, `seat_${session.seat}`);
                if (playerData) {
                    try {
                        const player = JSON.parse(playerData);
                        player.chips = Math.max(0, (player.chips || 0) - amount);
                        await redis.hset(`table:${tableId}:players`, `seat_${session.seat}`, JSON.stringify(player));
                    } catch { /* best effort */ }
                }
                return { success: false, message: 'Insufficient wallet balance for top-up.' };
            }

            // Broadcast updated player status to table
            const redis = this.luaRunner.getClient();
            const playersData = await redis.hgetall(`table:${tableId}:players`);
            const tableData = await redis.hgetall(`table:${tableId}`);

            const players: Record<string, unknown>[] = [];
            for (const key of Object.keys(playersData)) {
                if (key.startsWith('seat_')) {
                    try {
                        players.push(JSON.parse(playersData[key]));
                    } catch { /* skip invalid */ }
                }
            }

            const tableState = {
                table: tableData,
                players,
            };

            await this.broadcastTableState(tableId, tableState);

            // Notify room that player reloaded
            this.server.to(`table:${tableId}`).emit('player_reloaded', {
                tableId,
                seat: session.seat,
                username: user.username,
                chips: response.tableChips,
            });

            // Check if we can auto-resume a paused game
            const activeCount = players.filter((p: Record<string, unknown>) =>
                p.status === 'active' || p.status === 'waiting'
            ).length;

            if (activeCount >= 2) {
                // Enough players to start a hand - let next_hand handle it
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
        } catch (error) {
            this.logger.error(`Error adding chips: ${error}`);
            return { success: false, message: 'Failed to add chips' };
        }
    }

    /**
     * Game action (fold, check, call, raise, all-in) - requires authentication.
     * Executes bet.lua atomically.
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('action')
    @UsePipes(new WsZodPipe(BetActionSchema))
    async handleAction(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: BetAction,
    ): Promise<{ success: boolean; message: string }> {
        // 🔒 KILL SWITCH GUARD: Block all actions during lockdown (Mandate 2: Deep Freeze)
        if (this.maintenanceLockdown) {
            return { success: false, message: 'System is in maintenance mode. All tables are frozen.' };
        }

        const { tableId, action, amount = 0 } = data;
        const user = client.user;
        const session = await this.resolveSession(client, tableId, 'ACTION');

        if (!session) {
            return { success: false, message: 'Not seated at this table' };
        }

        this.logger.log(`${user.username} action: ${action} (${amount}) on table ${tableId}`);

        // Persist to admin log — read current hand context from Redis
        const actionLabel = action === 'fold' ? 'Fold' : action === 'check' ? 'Check' : action === 'call' ? 'Call' : action === 'raise' ? `Raise $${amount}` : action === 'all-in' ? 'All-In' : action;
        {
            const _redis = this.luaRunner.getClient();
            const [_handId, _phase] = await Promise.all([
                _redis.hget(`table:${tableId}`, 'handNumber'),
                _redis.hget(`table:${tableId}`, 'phase'),
            ]);
            this.pushAdminLog(tableId, `${user.username}: ${actionLabel}`, action === 'fold' ? 'fold' : 'action', Number(_handId) || 0, _phase || 'preflop');
        }

        try {
            // Execute bet.lua
            const result = await this.luaRunner.runScript<string>(
                'bet',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                ],
                [session.seat, action, amount]
            );

            // STOP TIMER for previous player
            await this.timerService.cancelTimeout(tableId);

            const response: LuaResponse = JSON.parse(result);

            if (!response.success) {
                // Emit directly to requesting client as a safety net
                // in case the ack callback is dropped or delayed
                client.emit('action_error', {
                    message: response.message,
                    code: 'LUA_REJECTION',
                });
                return { success: false, message: response.message };
            }

            // === DEBUG: Log the full Lua response flags ===
            this.logger.warn(`[ALL-IN DEBUG] bet.lua response for table ${tableId}: ` +
                JSON.stringify({
                    allPlayersAllIn: response.allPlayersAllIn,
                    nextStreet: response.nextStreet,
                    handComplete: response.handComplete,
                    winningSeat: response.winningSeat,
                }));

            // Broadcast updated table state
            if (response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);
            }

            // UNCALLED BET REFUND: Emit distinct event for chip return animation
            if (response.uncalledBetRefund) {
                this.logger.log(`[UNCALLED] Refunding ${response.uncalledBetRefund.amount} to seat ${response.uncalledBetRefund.seat} on table ${tableId}`);
                this.server.to(`table:${tableId}`).emit('uncalled_bet_returned', {
                    tableId,
                    seat: response.uncalledBetRefund.seat,
                    amount: response.uncalledBetRefund.amount,
                });
            }

            // Handle hand complete (winner determined - everyone folded)
            if (response.handComplete) {
                // Log the fold-win to admin timeline
                {
                    const _redis = this.luaRunner.getClient();
                    const [_handId, _phase] = await Promise.all([
                        _redis.hget(`table:${tableId}`, 'handNumber'),
                        _redis.hget(`table:${tableId}`, 'phase'),
                    ]);
                    // Find winner username from player data
                    const winningSeat = response.winningSeat;
                    let winnerName = `Seat ${winningSeat}`;
                    const potStr = (response.tableState?.table as any)?.pot;
                    const pot = potStr ? Number(potStr) : 0;
                    if (winningSeat !== undefined) {
                        const pData = await _redis.hget(`table:${tableId}:players`, `seat_${winningSeat}`);
                        if (pData) { try { winnerName = JSON.parse(pData).username || winnerName; } catch {} }
                    }
                    this.pushAdminLog(tableId, `🏆 ${winnerName} wins $${pot} (all folded)`, 'winner', Number(_handId) || 0, _phase || 'preflop', { winners: [{ name: winnerName, amount: pot }] });
                }
                this.server.to(`table:${tableId}`).emit('hand_result', {
                    tableId,
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

            // AUTO-ADVANCE: If all players are all-in, force-advance streets
            // bet.lua sets BOTH nextStreet=true AND allPlayersAllIn=true in this case
            if (response.allPlayersAllIn || (response.nextStreet && !response.handComplete)) {
                this.logger.log(`Advancing street on table ${tableId} (allIn=${response.allPlayersAllIn}, nextStreet=${response.nextStreet})`);
                await this.advanceStreet(tableId);
                return { success: true, message: response.message };
            }

            // Normal play: START TIMER for next player + notify clients
            const turnSeat = Number((response.tableState?.table as any)?.turn_seat ?? (response.tableState?.table as any)?.turnSeat ?? -1);
            if (turnSeat >= 0) {
                const turnTimeMs = await this.getDynamicTurnTime(tableId);

                // Red Cable: Emit turn data so frontend can render the timer ring
                this.server.to(`table:${tableId}`).emit('your_turn', {
                    tableId,
                    seat: turnSeat,
                    timeoutMs: turnTimeMs,
                    serverTime: Date.now(),
                });

                await this.timerService.scheduleTimeout(tableId, turnSeat, turnTimeMs);
            }

            return { success: true, message: response.message };
        } catch (error) {
            this.logger.error(`Error processing action: ${error}`);
            return { success: false, message: 'Failed to process action' };
        }
    }

    /**
     * Start a new hand using CSPRNG shuffle.
     * Executes next_hand.lua atomically.
     */
    public async startNewHand(tableId: string): Promise<void> {
        this.logger.log(`Starting new hand on table ${tableId}`);

        try {
            // PHASE GUARD: Re-check phase from Redis to prevent double-start
            // Allow 'waiting' (normal) and 'showdown' (completed hand, needs reset)
            const redis = this.luaRunner.getClient();
            const currentPhase = await redis.hget(`table:${tableId}`, 'phase');
            if (currentPhase && currentPhase !== 'waiting' && currentPhase !== 'showdown') {
                this.logger.warn(`startNewHand aborted for ${tableId}: phase is '${currentPhase}', not 'waiting' or 'showdown'`);
                return;
            }

            // ============================================================
            // AUTO-REBUY ORCHESTRATOR
            // Sweep all busted players with autoRebuy=true BEFORE dealing.
            // Fires gameService.rebuy() which handles Postgres + Redis atomically.
            // ============================================================
            try {
                const configData = await redis.hgetall(`table:${tableId}:config`);
                const minBuyIn = Number(configData.minBuyIn) || 1000;

                for (let i = 0; i < 10; i++) {
                    const pData = await redis.hget(`table:${tableId}:players`, `seat_${i}`);
                    if (!pData) continue;
                    const player = JSON.parse(pData);

                    if (player.autoRebuy && (player.chips === 0 || player.chips === '0') &&
                        player.status !== 'left' && player.status !== 'disconnected') {
                        try {
                            this.logger.log(`🤖 AUTO-REBUY: Firing rebuy for ${player.username} (seat ${i}) — $${minBuyIn}`);
                            await this.gameService.rebuy(player.id, tableId, minBuyIn);
                        } catch (rebuyErr: any) {
                            // Rebuy failed (insufficient Postgres funds, etc.)
                            // Disable autoRebuy to prevent infinite loop
                            this.logger.warn(`🤖 AUTO-REBUY FAILED for ${player.username}: ${rebuyErr.message}. Disabling flag.`);
                            player.autoRebuy = false;
                            await redis.hset(`table:${tableId}:players`, `seat_${i}`, JSON.stringify(player));
                        }
                    }
                }
            } catch (autoRebuyErr) {
                this.logger.error(`Auto-rebuy sweep error on ${tableId}: ${autoRebuyErr}`);
                // Non-fatal: continue to deal hand regardless
            }

            // Generate cryptographically secure shuffled deck
            const deck = createShuffledDeck();

            // Execute next_hand.lua
            const result = await this.luaRunner.runScript<string>(
                'next_hand',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                    `table:${tableId}:deck`,
                ],
                [JSON.stringify(deck)]
            );

            const response: LuaResponse = JSON.parse(result);

            if (response.success && response.tableState) {
                // Broadcast new hand state
                await this.broadcastTableState(tableId, response.tableState);

                // Persist to admin log — increment hand counter in Redis
                const redis = this.luaRunner.getClient();
                const handNum = await redis.hincrby(`table:${tableId}`, 'handNumber', 1);
                this.pushAdminLog(tableId, `Hand #${handNum} dealt`, 'deal', handNum, 'preflop');

                // Notify who's turn it is
                const turnSeat = response.tableState.table?.turnSeat;
                if (typeof turnSeat === 'number' && turnSeat >= 0) {
                    const turnTimeMs = await this.getDynamicTurnTime(tableId);
                    this.server.to(`table:${tableId}`).emit('your_turn', {
                        tableId,
                        seat: turnSeat,
                        timeoutMs: turnTimeMs,
                        serverTime: Date.now(),
                    });

                    // START TIMER (Yellow Cable)
                    await this.timerService.scheduleTimeout(tableId, turnSeat, turnTimeMs);
                }

                // LNBB: Fully remove the kicked player AFTER the hand starts
                if ((response as any).lnbbKickedSeat != null && (response as any).lnbbKickedUserId) {
                    const kickedSeat = Number((response as any).lnbbKickedSeat);
                    const kickedUserId = String((response as any).lnbbKickedUserId);
                    this.logger.log(`🚪 LNBB: Force standing up player ${kickedUserId} from seat ${kickedSeat} on table ${tableId}`);
                    // Non-blocking: don't await — the hand should continue
                    this.forceStandUp(tableId, kickedSeat, kickedUserId).catch(err =>
                        this.logger.error(`LNBB forceStandUp failed: ${err.message}`)
                    );
                }
            } else if ((response as { waitingForPlayers?: boolean }).waitingForPlayers && response.tableState) {
                // Ghost Protocol: Even if hand can't start, broadcast state so sitting_out players see rebuy modal
                this.logger.log(`Table ${tableId} waiting for players - broadcasting sitting_out state`);
                await this.broadcastTableState(tableId, response.tableState);
                // CLEAR LOCK: Allow future reconnects to retry auto-start
                this.pendingStart.delete(tableId);

                // LNBB: Fully remove the kicked player even when not enough players remain
                if ((response as any).lnbbKickedSeat != null && (response as any).lnbbKickedUserId) {
                    const kickedSeat = Number((response as any).lnbbKickedSeat);
                    const kickedUserId = String((response as any).lnbbKickedUserId);
                    this.logger.log(`🚪 LNBB: Force standing up player ${kickedUserId} from seat ${kickedSeat} on table ${tableId}`);
                    this.forceStandUp(tableId, kickedSeat, kickedUserId).catch(err =>
                        this.logger.error(`LNBB forceStandUp failed: ${err.message}`)
                    );
                }
            }
        } catch (error) {
            this.logger.error(`Error starting new hand: ${error}`);
        }
    }

    /**
     * Advance to next street (flop, turn, river, showdown).
     * Executes next_street.lua atomically.
     */
    public async advanceStreet(tableId: string): Promise<void> {
        this.logger.log(`Advancing street on table ${tableId}`);

        // PHASE GUARD: Don't advance if hand was already resolved (e.g. player left)
        try {
            const redis = this.luaRunner.getClient();
            const currentPhase = await redis.hget(`table:${tableId}`, 'phase');
            if (currentPhase === 'waiting' || currentPhase === 'finished') {
                this.logger.warn(`[advanceStreet] Aborting: Table ${tableId} is in phase '${currentPhase}'`);
                this.autoAdvanceTimers.delete(tableId);
                return;
            }
        } catch (phaseErr) {
            this.logger.error(`[advanceStreet] Phase check failed: ${phaseErr}`);
        }

        try {
            // Execute next_street.lua
            const result = await this.luaRunner.runScript<string>(
                'next_street',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                    `table:${tableId}:deck`,
                ],
                []
            );

            const response: LuaResponse = JSON.parse(result);

            // === DEBUG: Log the next_street.lua response ===
            this.logger.warn(`[ALL-IN DEBUG] next_street.lua response for table ${tableId}: ` +
                JSON.stringify({
                    success: response.success,
                    phase: (response as any).phase,
                    isShowdown: response.isShowdown,
                    allPlayersAllIn: response.allPlayersAllIn,
                }));

            if (response.success && response.tableState) {
                await this.broadcastTableState(tableId, response.tableState);

                // Log phase transition to admin timeline
                const newPhase = String(response.tableState.table?.phase || (response as any).phase || 'unknown');
                const phaseLabel = newPhase === 'flop' ? '♣ FLOP' : newPhase === 'turn' ? '♦ TURN' : newPhase === 'river' ? '♥ RIVER' : newPhase === 'showdown' ? '⚔ SHOWDOWN' : newPhase.toUpperCase();
                {
                    const _r = this.luaRunner.getClient();
                    const _hid = await _r.hget(`table:${tableId}`, 'handNumber');
                    this.pushAdminLog(tableId, phaseLabel, 'phase', Number(_hid) || 0, newPhase);
                }

                // If showdown, trigger hand evaluation
                if (response.isShowdown) {
                    this.logger.log(`[ALL-IN DEBUG] Showdown reached on table ${tableId}, evaluating hands...`);
                    await this.handleShowdown(tableId);
                } else if (response.allPlayersAllIn) {
                    // All remaining players are all-in - cinematic runout with 2s delay per street
                    this.logger.log(`[ALL-IN DEBUG] All players all-in on table ${tableId}, cinematic advance in 2s...`);
                    const advTimer = setTimeout(() => {
                        this.autoAdvanceTimers.delete(tableId);
                        this.advanceStreet(tableId);
                    }, 2000);
                    this.autoAdvanceTimers.set(tableId, advTimer);
                } else {
                    // Notify who's turn it is
                    const turnSeat = response.tableState.table?.turnSeat;
                    if (typeof turnSeat === 'number' && turnSeat >= 0) {
                        const turnTimeMs = await this.getDynamicTurnTime(tableId);
                        this.server.to(`table:${tableId}`).emit('your_turn', {
                            tableId,
                            seat: turnSeat,
                            timeoutMs: turnTimeMs,
                            serverTime: Date.now(),
                        });

                        // START TIMER (Yellow Cable)
                        await this.timerService.scheduleTimeout(tableId, turnSeat, turnTimeMs);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error advancing street: ${error}`);
        }
    }

    /**
     * Handle showdown - evaluate hands and award pot.
     * Uses Brain (HandEvaluatorService) vs Muscle (showdown.lua) pattern.
     */
    private async handleShowdown(tableId: string): Promise<void> {
        this.logger.log(`Showdown on table ${tableId}`);

        // PHASE GUARD: Don't evaluate if hand was already resolved
        try {
            const phaseCheck = await (this.luaRunner.getClient()).hget(`table:${tableId}`, 'phase');
            if (phaseCheck !== 'showdown') {
                this.logger.warn(`[handleShowdown] Aborting: Table ${tableId} phase is '${phaseCheck}', not showdown`);
                return;
            }
        } catch (phaseErr) {
            this.logger.error(`[handleShowdown] Phase check failed: ${phaseErr}`);
        }

        try {
            // Fetch current table state from Redis
            const redis = this.luaRunner.getClient();
            const tableData = await redis.hgetall(`table:${tableId}`);
            const pot = parseInt(tableData.pot || '0', 10);
            const communityCards: string[] = JSON.parse(tableData.communityCards || '[]');

            // Fetch all players
            const playersData = await redis.hgetall(`table:${tableId}:players`);
            const players: { seat: number; cards: string[]; chips: number; status: string }[] = [];

            for (const [key, value] of Object.entries(playersData)) {
                if (key.startsWith('seat_')) {
                    const player = JSON.parse(value as string);
                    players.push({
                        seat: player.seatNumber,
                        cards: player.cards || [],
                        chips: player.chips || 0,
                        status: player.status || 'folded',
                        totalContribution: player.totalContribution || 0,
                        autoMuck: player.autoMuck || false,
                    } as any);
                }
            }
            // Emit showdown start event (reveal cards)
            // AUTO-MUCK: Strip cards for autoMuck players before reveal
            {
                const _r2 = this.luaRunner.getClient();
                const _hid2 = await _r2.hget(`table:${tableId}`, 'handNumber');
                this.pushAdminLog(tableId, `Showdown — ${players.filter(p => p.status === 'active' || p.status === 'all-in').length} players`, 'system', Number(_hid2) || 0, 'showdown');
            }
            this.server.to(`table:${tableId}`).emit('showdown', {
                tableId,
                message: 'Showdown - revealing hands...',
                players: players
                    .filter(p => p.status === 'active' || p.status === 'all-in')
                    .map(p => ({
                        ...p,
                        cards: (p as any).autoMuck ? [] : p.cards,
                    })),
                communityCards,
            });

            // THE BRAIN: Evaluate hand scores (The Plan)
            const handScores = this.handEvaluator.evaluateHandScores(players as any, communityCards);

            if (handScores.length === 0) {
                this.logger.warn('No active players with scores for showdown');
                const fallbackTimer = setTimeout(() => {
                    this.autoAdvanceTimers.delete(tableId);
                    this.startNewHand(tableId);
                }, 3000);
                this.autoAdvanceTimers.set(tableId, fallbackTimer);
                return;
            }

            // THE MUSCLE: Execute atomic pot settlement (The Execution)
            // Hot Sync: Read rake config from Redis (seeded from Postgres)
            const configKey = `table:${tableId}:config`;
            const [rakePercentStr, rakeCapStr] = await Promise.all([
                redis.hget(configKey, 'rakePercent'),
                redis.hget(configKey, 'rakeCap'),
            ]);
            // Convert from percentage (e.g., 5) to decimal (e.g., 0.05) for Lua
            const rakePercent = parseFloat(rakePercentStr || '5') / 100;
            const rakeCap = parseInt(rakeCapStr || '500', 10);

            const result = await this.luaRunner.runScript<string>(
                'showdown',
                [
                    `table:${tableId}`,
                    `table:${tableId}:players`,
                ],
                [
                    JSON.stringify(handScores),
                    rakePercent.toString(),
                    rakeCap.toString()
                ]
            );

            const response: LuaResponse = JSON.parse(result);

            if (response.success) {
                // Build the enriched hand_result payload for showdown choreography
                // The Brain (handScores) has the winning 5-card subsets; the Muscle (response.winners) has the payouts.
                const enrichedWinners = (response.winners || []).map((w: Winner) => {
                    const scoreData = handScores.find(s => s.seat === w.seat);
                    return {
                        ...w,
                        handDescription: scoreData?.handDescription || w.handDescription,
                        winningCards: scoreData?.winningCards ?? [],
                    };
                });

                // Top hand name for the golden banner
                const sortedScores = [...handScores].sort((a, b) => b.score - a.score);
                const handName = sortedScores[0]?.handDescription || '';

                // Build winner seat set so we know who NOT to muck
                const winnerSeats = new Set(enrichedWinners.map((w: Winner) => w.seat));

                // All revealed hands for the card flip phase (includes losers' hand descriptions)
                // AUTO-MUCK: Scrub cards for non-winning players with autoMuck=true
                const revealedHands = players
                    .filter(p => p.status === 'active' || p.status === 'all-in')
                    .map(p => {
                        const scoreData = handScores.find(s => s.seat === p.seat);
                        const isMucked = !winnerSeats.has(p.seat) && (p as any).autoMuck === true;
                        return {
                            seat: p.seat,
                            cards: isMucked ? [] : p.cards,
                            handDescription: isMucked ? '' : (scoreData?.handDescription || ''),
                        };
                    });

                // Aggregate multi-pot wins: sum amounts per seat so each seat
                // appears once in the payload (e.g., main pot + side pot = one entry)
                const aggregatedWinners = Object.values(
                    enrichedWinners.reduce((acc: Record<number, typeof enrichedWinners[0]>, w: typeof enrichedWinners[0]) => {
                        if (!acc[w.seat]) {
                            acc[w.seat] = { ...w };
                        } else {
                            acc[w.seat].amount += w.amount;
                            acc[w.seat].displayAmount = (acc[w.seat].displayAmount || 0) + (w.displayAmount || w.amount);
                            // Keep type="win" if ANY slice is a real win (not just a refund)
                            if (w.type === 'win') acc[w.seat].type = 'win';
                        }
                        return acc;
                    }, {} as Record<number, typeof enrichedWinners[0]>)
                );

                // Broadcast hand result using Muscle's verified data + Brain's hand details
                this.server.to(`table:${tableId}`).emit('hand_result', {
                    tableId,
                    winners: aggregatedWinners,
                    handName,
                    revealedHands,
                    message: `Hand over. Pots distributed.`,
                    nextHandDelay: CELEBRATION_DELAY_MS,
                    nextHandTimestamp: Date.now() + CELEBRATION_DELAY_MS,
                });

                // Log winners to admin timeline
                {
                    const _r3 = this.luaRunner.getClient();
                    const _hid3 = await _r3.hget(`table:${tableId}`, 'handNumber');
                    const winnerMeta = (aggregatedWinners as any[]).map((w: any) => ({
                        name: w.username || `Seat ${w.seat}`,
                        amount: w.displayAmount || w.amount || 0,
                        hand: w.handDescription || '',
                    }));
                    const winnerSummary = winnerMeta.map((w: any) => `${w.name} $${w.amount}`).join(', ');
                    this.pushAdminLog(tableId, `🏆 ${winnerSummary}`, 'winner', Number(_hid3) || 0, 'showdown', { winners: winnerMeta });
                }

                // DO NOT broadcast the reset table state immediately.
                // showdown.lua resets communityCards=[] and pot=0 — broadcasting
                // this now would wipe the community cards before players can see
                // the winning cards glow. The next hand's broadcastTableState handles it.
            }

            // Start new hand after celebration delay
            const showdownTimer = setTimeout(() => {
                this.autoAdvanceTimers.delete(tableId);
                this.startNewHand(tableId);
            }, CELEBRATION_DELAY_MS);
            this.autoAdvanceTimers.set(tableId, showdownTimer);

        } catch (error) {
            this.logger.error(`Error handling showdown: ${error}`);
            // Attempt recovery by starting new hand
            const recoveryTimer = setTimeout(() => {
                this.autoAdvanceTimers.delete(tableId);
                this.startNewHand(tableId);
            }, 5000);
            this.autoAdvanceTimers.set(tableId, recoveryTimer);
        }
    }

    // ============================================================
    // WAITLIST: Join / Leave the table waiting queue
    // ============================================================

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_waitlist')
    async handleJoinWaitlist(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody(new WsZodPipe(JoinWaitlistEventSchema)) data: JoinWaitlistEvent,
    ): Promise<void> {
        const { tableId } = data;
        const userId = client.user?.id;
        const username = client.user?.username || 'Unknown';

        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            const payload = JSON.stringify({
                userId,
                username,
                avatarId: client.user?.avatarId || 'avatar_1',
                avatarUrl: client.user?.avatarUrl || null,
            });

            const result = await this.luaRunner.runScript<string>(
                'waitlist',
                [`table:${tableId}:waitlist`],
                ['join', payload]
            );

            const response = JSON.parse(result);
            if (!response.success) {
                client.emit('error', { message: response.message });
                return;
            }

            // Ensure client is in the room to receive broadcasts
            client.join(`table:${tableId}`);

            // Broadcast updated state so all clients see the new waitlist
            const redis = this.luaRunner.getClient();
            const tableState = await this.getTableStateFromRedis(redis, tableId);
            if (tableState) {
                await this.broadcastTableState(tableId, tableState);
            }

            this.logger.log(`User ${username} joined waitlist for table ${tableId}`);
        } catch (error) {
            this.logger.error(`Error joining waitlist: ${error}`);
            client.emit('error', { message: 'Failed to join waitlist' });
        }
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leave_waitlist')
    async handleLeaveWaitlist(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody(new WsZodPipe(LeaveWaitlistEventSchema)) data: LeaveWaitlistEvent,
    ): Promise<void> {
        const { tableId } = data;
        const userId = client.user?.id;

        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            await this.luaRunner.runScript<string>(
                'waitlist',
                [`table:${tableId}:waitlist`],
                ['leave', userId]
            );

            // Broadcast updated state
            const redis = this.luaRunner.getClient();
            const tableState = await this.getTableStateFromRedis(redis, tableId);
            if (tableState) {
                await this.broadcastTableState(tableId, tableState);
            }

            this.logger.log(`User ${userId} left waitlist for table ${tableId}`);
        } catch (error) {
            this.logger.error(`Error leaving waitlist: ${error}`);
            client.emit('error', { message: 'Failed to leave waitlist' });
        }
    }

    /**
     * Fetch full table state from Redis hashes.
     * Reusable helper to avoid repeating hgetall + parse logic.
     */
    private async getTableStateFromRedis(redis: ReturnType<LuaRunnerService['getClient']>, tableId: string): Promise<Record<string, unknown> | null> {
        const tableData = await redis.hgetall(`table:${tableId}`);
        if (!tableData || Object.keys(tableData).length === 0) return null;

        const playersData = await redis.hgetall(`table:${tableId}:players`);
        const players: Record<string, unknown>[] = [];
        for (const key of Object.keys(playersData)) {
            if (key.startsWith('seat_')) {
                try {
                    players.push(JSON.parse(playersData[key]));
                } catch { /* skip invalid */ }
            }
        }

        return {
            table: {
                phase: 'waiting',
                pot: '0',
                currentBet: '0',
                turnSeat: '-1',
                dealerSeat: '0',
                communityCards: '[]',
                ...tableData,
            },
            players,
        };
    }

    /**
     * Broadcast table state to all players at a table.
     * Filters private cards - each player only sees their own.
     * Injects the current waitlist from Redis into every broadcast.
     */
    async broadcastTableState(tableId: string, state: Record<string, unknown>): Promise<void> {
        // Inject the waitlist into the state payload
        try {
            const waitlistResult = await this.luaRunner.runScript<string>(
                'waitlist',
                [`table:${tableId}:waitlist`],
                ['list']
            );
            const waitlistData = JSON.parse(waitlistResult);
            if (waitlistData.success && Array.isArray(waitlistData.waitlist)) {
                state.waitlist = waitlistData.waitlist;
            } else {
                state.waitlist = [];
            }
        } catch {
            state.waitlist = [];
        }

        // Get all sockets in the room
        const sockets = await this.server.in(`table:${tableId}`).fetchSockets();

        // Collect seated player IDs for exclusion
        const seatedPlayerIds = new Set<string>();
        if (state.players && Array.isArray(state.players)) {
            for (const p of state.players as Array<Record<string, unknown>>) {
                if (p.id) seatedPlayerIds.add(p.id as string);
            }
        }

        // Build observers list: non-seated sockets with user info
        const observersSeen = new Set<string>();
        const observers: Array<{ userId: string; username: string; avatarId: string; avatarUrl: string | null }> = [];
        for (const socket of sockets) {
            const authSocket = socket as unknown as AuthenticatedSocket;
            const userId = authSocket.user?.id;
            if (!userId) continue;
            // Skip seated players and duplicates
            if (seatedPlayerIds.has(userId)) continue;
            if (observersSeen.has(userId)) continue;
            observersSeen.add(userId);
            observers.push({
                userId,
                username: authSocket.user?.username || 'Observer',
                avatarId: authSocket.user?.avatarId || 'avatar_1',
                avatarUrl: authSocket.user?.avatarUrl || null,
            });
        }
        state.observers = observers;

        for (const socket of sockets) {
            // PRIMARY: Look up seat from session map
            let seat = this.getSession(socket.id, tableId)?.seat;

            // FALLBACK: If session map miss, use socket's userId to find seat from player data
            if (seat === undefined) {
                const authSocket = socket as unknown as AuthenticatedSocket;
                const userId = authSocket.user?.id;
                if (userId && state.players && Array.isArray(state.players)) {
                    const matchedPlayer = (state.players as Array<Record<string, unknown>>)
                        .find(p => p.id === userId);
                    if (matchedPlayer && typeof matchedPlayer.seatNumber === 'number') {
                        seat = matchedPlayer.seatNumber;
                        // Repair the session map while we're at it
                        this.setSession(socket.id, tableId, { tableId, seat, userId });
                        this.logger.debug(`broadcastTableState: repaired session for ${userId} at seat ${seat}`);
                    }
                }
            }

            // Create filtered state for this player
            const filteredState = this.filterStateForPlayer(state, seat);
            socket.emit('table_state', filteredState);
        }
    }

    /**
     * Push a log entry to the admin inspector's activity feed.
     * Persists to `table:{id}:log` Redis list (last 50 entries).
     */
    private pushAdminLog(
        tableId: string,
        action: string,
        type: string,
        handId: number = 0,
        phase: string = 'preflop',
        meta?: Record<string, unknown>,
    ): void {
        const redis = this.luaRunner.getClient();
        const entry = JSON.stringify({
            action,
            time: new Date().toISOString(),
            type,
            handId,
            phase,
            ...(meta ? { meta } : {}),
        });
        const logKey = `table:${tableId}:log`;
        redis.lpush(logKey, entry).catch(() => {});
        redis.ltrim(logKey, 0, 199).catch(() => {});
    }

    /**
     * Filter table state to hide other players' hole cards.
     */
    private filterStateForPlayer(
        state: Record<string, unknown>,
        playerSeat?: number
    ): Record<string, unknown> {
        const filtered = JSON.parse(JSON.stringify(state));

        if (filtered.players && Array.isArray(filtered.players)) {
            filtered.players = filtered.players.map((player: Record<string, unknown>) => {
                if (player.seatNumber !== playerSeat) {
                    // Hide other players' cards (unless showdown)
                    const table = filtered.table as Record<string, unknown> | undefined;
                    if (table?.phase !== 'showdown') {
                        return { ...player, cards: player.cards ? ['??', '??'] : [] };
                    }
                }
                return player;
            });
        }

        return filtered;
    }

    /**
     * Look up a session by userID and tableId.
     * Used by GameService for HTTP-triggered rebuys.
     */
    public getSessionByUserId(userId: string, tableId: string) {
        for (const session of this.sessions.values()) {
            if (session.userId === userId && session.tableId === tableId) {
                return session;
            }
        }
        return null;
    }
}
