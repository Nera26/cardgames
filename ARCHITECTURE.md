# PokerHub Platform Architecture

> **Objective:** Build a Production-Ready, Real-Money Poker Platform.
> **Architecture:** SSS-Grade (Security, Speed, Stability).
> **Status:** Phase 1 Initialization.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `docker-compose -f docker-compose.dev.yml up` | Start Development |
| `docker-compose -f docker-compose.prod.yml up --build` | Start Production |

| Port | Service |
|------|---------|
| 3000 | Frontend (Next.js) |
| 3001 | Backend (NestJS) |
| 5432 | PostgreSQL |
| 6379 | Redis |

---

## 1. Architecture Overview (The Four Cables)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    Next.js 16 (App Router)                      │
│            🟣 Purple Cable (Local State / Context)              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ 🔵 REST  │   │ 🔴 Socket│   │ 🟡 Queue │
    │   API    │   │  Events  │   │  Workers │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
```

---

## 📜 2. The Law of the Four Cables (Standardization)

### 🔵 Blue Cable (REST API)
**Reliability | HTTP | PostgreSQL Transactions**
**Services:** AuthService, UserService, WalletService, PaymentService, ConfigService, AuditService.

#### The 5 Commandments of Blue
1.  **Thou Shalt Use Transactions:** Any state change (Money, Inventory) MUST use `prisma.$transaction`.
2.  **Thou Shalt Validate Inputs:** Controllers MUST use `ZodValidationPipe` with schemas imported from `@poker/shared`.
3.  **Thou Shalt Not Expose Raw Entities:** Return DTOs (`UserResponse`). Never return a raw Prisma object (leaks password hash).
4.  **Thou Shalt Guard By Default:** `@UseGuards(JwtAuthGuard)` is mandatory on all Controllers.
5.  **Thou Shalt Use Standard JSON:** `{ "message": "Success", "data": ... }` - No plain strings.

#### Service Anatomy
```text
apps/api/src/wallet/
├── wallet.module.ts      # Registers Controller & Service
├── wallet.controller.ts  # HTTP Endpoints (Validation, Auth)
├── wallet.service.ts     # Business Logic (Transactions, DB)
└── guards/               # Service-specific guards
```

### 🔴 Red Cable (Real-Time Engine)
**Speed < 50ms | WebSockets | Redis Only**
**Services:** GameEngine, ChatService, BroadcastService.

#### The 3 Commandments of Red
1.  **Redis is Truth:** Live game state (Pots, Hands) lives in Redis. Postgres is too slow.
2.  **Lua is the Judge:** All state mutations (Bet, Fold) must be atomic Lua scripts. No `GET` -> `SET` race conditions.
3.  **Broadcast State:** Send the full table state (or smart delta) to clients. Do not just send "actions".

#### The Red-Blue Contract
*   **Validation:** All Socket Events must use Zod Schemas defined in `libs/shared`.
*   **Gateway:** The Socket Gateway must validate every event against this schema before it hits the handler.

### 🟡 Yellow Cable (The Manager)
**Async | BullMQ | Scheduled Jobs**
**Services:** SchedulerService, StatsService, AnalyticsService, NexusService.

#### The 3 Commandments of Yellow
1.  **Idempotency:** Jobs must be safe to run twice (e.g., don't pay a user twice if the job retries).
2.  **Logging:** Every job execution (Start/Fail/Success) is logged to AuditService.
3.  **No Blocking:** Heavy calculations run in isolated Worker processes, never on the Main API thread.

### 🟣 Purple Cable (The Nervous System)
**Responsiveness | Client State | LocalStorage**
**Services:** SoundContext, ThemeContext, OptimisticStore, ChatHook.

#### The 3 Commandments of Purple
1.  **User Preference First:** If it’s a UI toggle (Mute, Theme, Size), it belongs in Purple. Do not wait for Blue (Server) to update a checkbox.
2.  **Persist for Comfort:** Essential UI states must live in `localStorage` to survive page reloads.
3.  **The Fast Track:** Use Purple for "Optimistic UI" - update the screen immediately, and let Blue/Red catch up in the background.

---

---

## 🏗️ Phase 1: The "Iron" Foundation (Security & Testing)
**Goal:** Prepare the safety nets *before* writing complex logic.

### 1.1 The Lua Sandbox (Testcontainers)
*   **Tech:** `testcontainers`, `ioredis`, `jest`.
*   **Requirement:** Every `.lua` script must have a corresponding `.spec.ts` file that spins up a disposable Redis instance.

### 1.2 The Iron Dome (Rate Limiting)
*   **Tech:** `@nestjs/throttler` backed by Redis.
*   **Rules:**
    *   Login/Register: Strict Limit (5 req/min).
    *   Socket Actions: Game Speed Limit (e.g., max 2 folds/sec).

### 1.3 The Audit Vault
*   **Tech:** PostgreSQL `AuditLog` table.
*   **Rule:** API Database User has `INSERT` only permissions. No `UPDATE` or `DELETE`.

---

## 🔴 Phase 2: The "Red Cable" Core (Game Engine)
**Goal:** Build the Poker Logic in isolation. 100% Redis.

### 2.1 The Gateway
*   **Tech:** `socket.io` with `@nestjs/platform-socket.io` + Redis Adapter.
*   **Security:** `WsJwtGuard` (Handshake validation) + Zod Schema Validation (Red-Blue Contract).

### 2.2 Redis Schema (The "Red" Database)
Strict hierarchical hash structure.

| Key Pattern | Type | Content |
|:---|:---|:---|
| `table:{id}` | Hash | `state`, `pot`, `turn_seat`, `dealer_seat`, `public_cards` |
| `table:{id}:players` | Hash | `seat_1` → `{ id, chips, status, cards }` (JSON) |
| `table:{id}:deck` | List | `["As", "Kd", ...]` |
| `user:{id}:session` | String | `socket_id` |

### 2.3 The Lua Library (Atomic Logic)
1.  **`join_table.lua`**: Check max players, add to seat.
2.  **`leave_table.lua`**: Remove player, trigger refund.
3.  **`bet.lua`**: Validate turn/balance, update pot, move turn.
4.  **`fold.lua`**: Set folded, move turn.
5.  **`next_hand.lua`**: Reset pot, deal cards (from input list).
6.  **`showdown.lua`**: Distribute pot to winners (from input).

---

## 🟡 Phase 3: The "Yellow Cable" (The Manager)
**Goal:** Automate flow and secure the money.

### 3.1 The Reconciliation Loop (Drift Check)
*   **Objective:** Ensure Redis Chips == Postgres Money.
*   **Mechanism:** Scheduled Job (Every 5 mins) -> `gauge_financial_drift_amount`.
*   **Alerting:** Fire PagerDuty if drift != 0.

### 3.2 The State Sync (Write-Behind)
1.  Lua emits `HAND_END` to Redis Stream.
2.  BullMQ Worker reads Stream.
3.  Worker performs `prisma.$transaction` to insert `HandHistory`.

---

## 💀 14. The Hand Skeleton (Data Flow)

To prevent "logic leaks" between the Backend and Engine, we define the exact flow of a single hand.

### 14.1 The Great Handoff
1.  **Initialization (Blue)**: `GameService` creates the table in Postgres.
2.  **Handoff**: Control is passed to `GameEngine` (Red). Redis becomes the **Primary Source of Truth**.
3.  **The Hand**: All bets, folds, and actions happen *exclusively* in Redis (Lua). Postgres is **NOT** touched.
4.  **Settlement**: When the hand ends, `GameEngine` calculates winners.
5.  **Reconciliation**: `GameEngine` pushes the *final result* (Pot distribution) to `WalletService` (Blue) to update balances in Postgres transactions.

---

## ✨ Phase 4: The "Vibe" Layer (Polish)
**Goal:** Make it feel alive.

*   **Chat:** Ephemeral Redis chat.
*   **Notifications:** "Your Turn" toasts.
*   **Sound FX:** Socket events `play_sound: 'check'`.
*   **Visuals:** "Poker Chip Flip" Loading Screens.

---



---

## 📜 17. The Law of Lua

Since we rely on Lua for atomicity, we must treat it as production code.

### 17.1 Validation First
**Rule:** Lua scripts must verify all preconditions (e.g., `balance >= betAmount`) **BEFORE** modifying any key.
**Why:** There is no "Rollback" in Redis. Once a key change happens, it propagates.

### 17.2 The Event Log (Redis Streams)
**Rule:** Every Lua mutation must `XADD` an event to a Redis Stream (e.g., `stream:table:123`).
**Why:** Yellow Cable workers consume this stream to process:
1.  Hand History archival (Postgres).
2.  Real-time Analytics.
3.  Audit Logs.

### 17.3 Lua Unit Testing (The Sandbox)
**Rule:** Lua scripts must be written in `.lua` files (not TS strings) and tested via **Testcontainers**.
**Test flow:** `it('should atomically transfer chips')` -> Spin up Redis Container -> Load Lua -> Assert Result.
**Why:** Allows refactoring game logic without starting the entire frontend or backend.

---

## 🤖 18. The Agent Protocol (Feature Workflow)

To prevent "Chicken and Egg" problems, all Agents must follow this strict Order of Operations when building a new feature.

### Step 1: The Contract (libs/shared)
**"Define the shape before the substance."**
1.  **Define:** Create/Update Zod Schemas (`.ts`) in `libs/shared`.
2.  **Export:** TypeScript Interfaces (`z.infer`).
3.  **Check:** Does this cover both Request and Response?

### Step 2: The Vault (Database)
**"Prepare the storage."**
1.  **Schema:** Update `schema.prisma`.
2.  **Migrate:** Run `npx prisma migrate dev`.
3.  **Check:** Are indices added for performance?

### Step 3: The Logic (Backend)
**"Build the engine."**
1.  **Service:** Write business logic with `prisma.$transaction`.
2.  **Controller:** Use `ZodValidationPipe` with Shared Schemas.
3.  **Test:** Create a `test/feature.spec.ts` file. Run `npm test`. **Do not open Postman.**

### Step 4: The Face (Frontend)
**"Paint the pixels."**
1.  **Hook:** Create `useFeature.ts` wrapping the API.
2.  **Component:** Scaffolds the UI using the shared types.
3.  **Integration:** Connect Hook to Component.

### 🔴 Red Cable Adaptation (Game Engine)
*The Vault is Redis, Logic is Lua.*
1.  **Contract:** Define `ClientToServerEvents` (Zod) in `libs/shared`.
2.  **Vault:** Define Redis Key Structure (e.g., `table:{id}`) in docs.
3.  **Logic:** Write `GameGateway` (Socket) + `action.lua` (Script).
4.  **Face:** Update `SocketContext` + Event Listeners.

### 🟡 Yellow Cable Adaptation (Workers)
*The Contract is the Job Payload.*
1.  **Contract:** Define `JobPayloadSchema` (Zod) in `libs/shared`.
2.  **Vault:** Update `schema.prisma` (if saving results).
3.  **Logic:** Write BullMQ `@Processor` (Worker).
4.  **Face:** N/A (Internal).

---

## 🛡️ SSS-Grade Security Checklist (Zero Trust)

1.  **Distributed Throttling:** Can a bot crash us? (Tested via `artillery`)
2.  **Packet Sniffing Defense:** Do we send hole cards to opponents? (Strict DTO separation).
3.  **CSPRNG:** Do we use `crypto.randomInt` for shuffling? (No `Math.random`).
4.  **Audit Logs:** Is the Audit Table write-only?
5.  **Secrets:** Are we using Docker Secrets (No `.env` in prod)?
