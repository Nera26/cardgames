# 🗺️ The Vibe Stack: Master Battle Plan (Truth Edition)

> **Current Status:** Phase 10 COMPLETE ✅ + Smooth Gameplay Patch Applied
> **Overall Progress:** ~78% (S-Grade Core: 100% • Financial Hardening: 100% • UI: 100% • Ecosystem: 50%)
> **Last Updated:** 2026-02-25

---

## 📊 Executive Summary

While the **Game Engine (Red)** and **Foundation (Blue)** are production-grade, a deep audit reveals that the surrounding **Tournament, Leaderboard, Admin, and Promotion** ecosystems are current "Mocked Shells".

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Blue Cable (Foundation) | ✅ S-Grade | 100% |
| Phase 2: Red Cable (Engine) | ✅ S-Grade | 100% |
| Phase 3: Yellow Cable (Historian) | ✅ S-Grade | 100% |
| Phase 4: Purple Cable (Vibe) | ✅ S-Grade | 100% |
| Phase 5: Broadcast Ecosystem | ✅ S-Grade | 100% |
| Phase 6: Admin Suite (12 Pages) | ✅ S-Grade | 85% |
| **Phase 6.5: Hot Sync Protocol** | ✅ S-Grade | 100% |
| Phase 7: Tournament Ecosystem | 🔴 Mocked | 5% |
| Phase 8: Leaderboard Ecosystem | 🔴 Mocked | 5% |
| Phase 9: Promotion Ecosystem | 🔴 Mocked | 5% |
| **Phase 10: Lobby & Table UI** | ✅ S-Grade | 100% |

---

## 🎰 Phase 10: Lobby & Table UI (NEW)
*Status: Active Development*

### Lobby (COMPLETE ✅)

#### Core Features
- [x] **PremiumTableCard**: Neon Glass design with visual seat bar
- [x] **Omaha Badge System**: PLO-4 (Classic), PLO-5 (5-CARD), PLO-6 (6-CARD)
- [x] **Toggle Chip Navigation**: Pinterest-style (click active = show all)
- [x] **Vertical Stack Layout**: Cash Tables + Tournaments on default view
- [x] **Midnight Gold Styling**: Amber-500 active state for chips

#### Private Tables (NEW ✅)
- [x] **Lock Icon**: Inline with table name for private tables
- [x] **Amber Button**: "🔒 Enter Password" (distinct from green Join)
- [x] **Border Glow**: Subtle amber border for private table cards

#### Table Status Handling (NEW ✅)
- [x] **PAUSED Badge**: Orange badge in top-right corner
- [x] **Disabled Button**: Gray "⏸ Paused" when table is paused
- [x] **Muted Styling**: Seat pills and text muted for paused tables

#### Cable Architecture (Lobby)
```
┌─────────────────────────────────────────────────────────────────┐
│                        LOBBY DATA FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│  🔵 BLUE CABLE (REST)                                           │
│  ┌──────────────┐    GET /game/tables    ┌──────────────────┐   │
│  │ Lobby Page   │ ───────────────────────▶│ game.controller  │   │
│  │ (useQuery)   │                         │ getTables()      │   │
│  └──────────────┘                         └────────┬─────────┘   │
│                                                    │             │
│                                           ┌────────▼─────────┐   │
│                                           │ game.service     │   │
│                                           │ mapToLobbyTable  │   │
│                                           └────────┬─────────┘   │
│                                                    │             │
│  ┌──────────────┐◀───── LobbyTableDto ────────────┘             │
│  │ PremiumTable │  Fields:                                      │
│  │ Card.tsx     │  - isPrivate: !!password                      │
│  └──────────────┘  - status: 'WAITING'|'PLAYING'|'PAUSED'       │
│                    - rakePercent: Number                        │
└─────────────────────────────────────────────────────────────────┘
```

### Green Felt (COMPLETE ✅)
- [x] **PokerTable.tsx**: Stadium-shaped felt with emerald gradient
- [x] **9-Max Seat Layout**: Oval orbit positioning
- [x] **Community Cards**: 5 card slots with AnimatedCard flip
- [x] **Pot Display**: Centered amber highlight with AnimatePresence
- [x] **Player Cards**: Hole card rendering with staggered deal animation
- [x] **Chip Animations**: Framer Motion integration (bet chips, pot explosions)
- [x] **Action Buttons**: Fold/Check/Call/Raise/All-In controls with phantom chips
- [x] **Showdown Choreography**: 4-phase spotlight (card reveal, highlight, banner, chip push)

### Smooth Gameplay — Performance Hardening (COMPLETE ✅)
- [x] **React.memo Shield**: `PlayerSeat` (17-field custom comparator), `PlayerAvatar`, `AnimatedCard`, `FlyingCard`, `CommunityCards`
- [x] **SocketContext useMemo**: Breaks cascade re-render chain (14-dep memoized provider value)
- [x] **GPU Optimization**: `backdrop-blur` → flat `rgba()` on all hot-path elements (9 composite layers saved)
- [x] **Dynamic willChange**: GPU layer promotion only during active animation, not idle
- [x] **Console Silence**: All high-frequency debug logs removed from game hot loop
- [x] **IIFE → useMemo**: Seat deal order pre-computed outside JSX

---

## 🏰 Admin Game Management (Command Center)
*Status: S-GRADE ✅*

### Features
- [x] **God Mode Dashboard**: Real-time table aggregation (Postgres + Redis)
- [x] **Create Table Modal**: Full form with password, rake, turn time
- [x] **Inspector Drawer**: Live monitor + Hot config editing
- [x] **Dynamic Pause/Resume**: Toggle button based on current status
- [x] **Private Table Indicator**: Lock icon in table list
- [x] **Force Actions**: Mute, Force Stand, Force Sit, Terminate

### Cable Architecture (Admin)
```
┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN COMMAND CENTER FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│  🔵 BLUE CABLE (REST - Read)                                    │
│  ┌──────────────┐  GET /admin/tables/dashboard  ┌────────────┐  │
│  │ Game Mgmt    │ ─────────────────────────────▶│ Admin Ctrl │  │
│  │ Page.tsx     │                               │ getDash()  │  │
│  └──────────────┘                               └─────┬──────┘  │
│         ▲                                             │         │
│         │                    ┌────────────────────────┴───────┐ │
│         │                    │ Aggregator Pattern:            │ │
│         │                    │ 1. Postgres: GameTable config  │ │
│         │                    │ 2. Redis: Live stats/phase     │ │
│         │                    └────────────────────────────────┘ │
│         │                                                       │
│  GodModeTableDto ◀───────────────────────────────────────────── │
│  - isPrivate: boolean                                           │
│  - status: RUNNING|PAUSED|ERROR|WAITING                         │
│  - handsPerHour, avgPot, totalRake (from Redis cache)           │
├─────────────────────────────────────────────────────────────────┤
│  🔵 BLUE CABLE (REST - Write)                                   │
│  ┌──────────────┐   PATCH /admin/tables/:id     ┌────────────┐  │
│  │ Inspector    │ ─────────────────────────────▶│ Admin Ctrl │  │
│  │ Drawer.tsx   │   { status, password, rake }  │ updateCfg  │  │
│  └──────────────┘                               └─────┬──────┘  │
│                                                       │         │
│                              ┌─────────────────────────▼──────┐ │
│                              │ Hot Sync Protocol:             │ │
│                              │ 1. Update Postgres             │ │
│                              │ 2. Publish to Redis PubSub     │ │
│                              │ 3. Emit TABLE_CONFIG_UPDATED   │ │
│                              └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Cable Audit ✅
| Operation | Cable | Compliance |
|-----------|-------|------------|
| Fetch Dashboard | 🔵 Blue (REST) | ✅ Correct - Read-only |
| Create Table | 🔵 Blue (REST) | ✅ Correct - Persists to Postgres |
| Update Config | 🔵 Blue (REST) | ✅ Correct - Hot sync via Redis PubSub |
| Pause/Resume | 🔵 Blue (REST) | ✅ Correct - Status update + Redis phase |
| Live Stats | 🟡 Yellow (Cache) | ✅ Correct - Pre-aggregated in Redis |
| Force Stand | 🔴 Red (Gateway) | ✅ Correct - Direct Redis mutation |

---

## 🔵 Blue Cable: The Iron Vault
*Status: Production Ready*

- [x] **AuthService**: JWT, Role-based guards, standard schemas.
- [x] **WalletService**: ACID ledger with Decimal support for multi-currency.
- [x] **UserService**: Profile, Avatars, Tier progression.
- [x] **Auditor**: Immutable logging of all financial/critical actions.

---

## 🔴 Red Cable: The Game Nexus
*Status: Hardening / Refactoring*

- [x] **Atomic Side Pots**: **S-GRADE** - Split-pot math moved to `showdown.lua` for absolute atomicity.
- [x] **House Rake Engine**: **S-GRADE** - Atomic rake deduction (capped) in `showdown.lua`.
- [x] **Disconnect Protection**: **S-GRADE** - "Time Bank" logic and `disconnected` status preservation.
- [x] **Lua Engine**: 12+ scripts handling atomic state and financial transitions.
- [x] **State Sync**: Snapshotting critical data to Redis for 0-latency access.
- [x] **Hand Evaluation**: Full Omaha/Holdem support.
- [x] **Chat System**: Redis PubSub integrated with frontend `ChatPanel`.

---

## 🟡 Yellow Cable: The Historian
*Status: S-GRADE Production Ready*

- [x] **Nexus Consumer**: Listening to Redis Streams for all table events.
- [x] **Historian**: Archiving every hand and player result to Postgres.
- [x] **Blue-Red Sync**: **S-GRADE** - Direct wallet updates on hand-completion (HandHistoryProcessor).
- [x] **Settlement Engine**: Scheduled balance reconciliation (Redis vs DB) via `ReconciliationReport`.
- [x] **House Treasury**: **NEW** - Rake credits HOUSE_TREASURY wallet atomically.

---

## 🔥 Phase 6.5: Hot Sync Protocol (NEW)
*Status: S-GRADE Production Ready*

### Dynamic Table Configuration
- [x] **Redis Config Seeder**: Auto-seeds `table:{id}:config` on first join
- [x] **Hot Sync Listener**: Gateway subscribes to `table:{id}:config_update` PubSub
- [x] **Dynamic Rake**: `showdown.lua` reads rake % and cap from Redis (not hardcoded)
- [x] **Dynamic Timer**: `getDynamicTurnTime()` reads turn_time from Redis config

### The Bouncer (Buy-in Limits)
- [x] **Lua Enforcement**: `join_table.lua` validates against minBuyIn/maxBuyIn
- [x] **Error Codes**: Returns `ERR_MIN_BUYIN` / `ERR_MAX_BUYIN` with limits
- [x] **Frontend Toasts**: SocketContext handles bouncer errors gracefully

### The Timekeeper (Dynamic Timer)
- [x] **Gateway Helper**: Reads timeoutMs from config, defaults to 30s
- [x] **Frontend Sync**: `your_turn` event includes dynamic timeout

### Financial Hardening (Yellow Cable)
- [x] **UserType Enum**: PLAYER, HOUSE, BOT in schema
- [x] **HOUSE_TREASURY User**: Seeded with wallet for revenue collection
- [x] **Atomic Rake Credit**: `hand-history.processor.ts` credits house wallet
- [x] **RAKE Transactions**: Audit trail for every rake collection

### Architecture
```
┌────────────────────────────────────────────────────────────────┐
│                    HOT SYNC PROTOCOL                           │
├────────────────────────────────────────────────────────────────┤
│  🔵 BLUE CABLE (Admin writes config)                           │
│  Admin Panel ──▶ PATCH /admin/tables/:id ──▶ Postgres          │
│                                              │                 │
│                                    Redis PubSub (config_update)│
│                                              ▼                 │
│  🔴 RED CABLE (Engine reads config)                            │
│  game.gateway.ts ◀── Subscribes to table:{id}:config_update    │
│        │                                                       │
│        ▼                                                       │
│  showdown.lua ◀── Reads rake/cap from table:{id}:config        │
│  join_table.lua ◀── Reads minBuyIn/maxBuyIn from config        │
│                                              │                 │
│  🟡 YELLOW CABLE (Historian collects rake)   ▼                 │
│  hand-history.processor ──▶ HOUSE_TREASURY wallet              │
│                                                                │
│  🟣 PURPLE CABLE (UI respects config)                          │
│  GamePage.tsx ──▶ Fetches minBuyIn/maxBuyIn via API            │
│  JoinTableModal ──▶ Slider constrained to limits               │
└────────────────────────────────────────────────────────────────┘
```

---

## � Purple Cable: The Sensory Layer
*Status: Production Ready*

- [x] **Motion Layer**: `framer-motion` orchestration for chip movement.
- [x] **Sound Engine**: Positional audio triggers synced to game events.
- [x] **Local Skins**: Table customization persisted to LocalStorage.

---

## 🏛️ Phase 5: Broadcast Ecosystem (Iron Foundation)
*Status: Production Ready*

- [x] **Universal Alert Core**: Standardized `Notification` model for Global/Personal/System alerts.
- [x] **Real-Time Pipeline**: Dedicated `/notifications` socket namespace with Redis PubSub.
- [x] **Interactive UI**: Real-time Navbar Bell Icon, Sound Triggers, and Sonner Toasts.
- [x] **Inbox Hub**: Dedicated Notifications Page for historical review.

---

## 🏗️ The Missing Continents (ECOSYSTEM)

### 1. The Admin Citadel (12 Pages) 🏰
*Current Status: Frontend Shells with partial integration.*
- [x] **User Management**: Active (Search, Ban, Balance Adjustment).
- [ ] **Finance Dashboard**: Dashboard exists, IBAN management exists, but payout logic is shell.
- [x] **Game Management**: **S-GRADE** - Fully dynamic! Aggregator pattern (Postgres + Redis), Kill-switch, Pause, Inspector Drawer, Create/Delete tables.
- [ ] **Monitoring**: Server nodes UI exists, missing actual telemetry data.
- [x] **Audit Trail**: Rebuilt with dynamic filtering, date range, pagination.

### 2. Tournament Ecosystem 🏆
*Current Status: MOCKED*
- [ ] **Backend**: No Prisma models or controller logic for MTG/SNG.
- [ ] **Frontend**: `TOURNAMENTS` mock data used; registration is a simple alert.

### 3. Leaderboard Ecosystem 📈
*Current Status: MOCKED*
- [ ] **Backend**: No logic to aggregate stats across timeframes (Daily/Weekly/Monthly).
- [ ] **Frontend**: `LEADERBOARD_PLAYERS` mock data with simulated live updates.

### 4. Promotion Ecosystem 🎁
*Current Status: MOCKED*
- [ ] **Backend**: Missing achievement trackers, referral logic, and bonus credit engine.
- [ ] **Frontend**: `/promotions` page is static; missing achievement badges and referral dashboard.
- [ ] **Integration**: Tier progression (UserService) needs to trigger automated rewards.

---

## 🎯 Immediate "Production Grade" Roadmap

### Priority 1: Kill the "Static Shit" (The Ecosystem Logic)
- [ ] **LeaderboardService**: Aggregating live Postgres stats (Weekly/Monthly).
- [ ] **TournamentService**: MTG/SNG lifecycle logic + Prisma models (Replacing `@/data/mocks`).
- [ ] **Admin Monitoring**: Connecting server nodes UI to actual CPU/RAM/Redis telemetry.

### Priority 2: Financial & Operational Hardening ⬅️ NEXT
- [x] **Rake Processor**: ✅ COMPLETE - Credits HOUSE_TREASURY wallet atomically.
- [x] **Hot Sync Protocol**: ✅ COMPLETE - Dynamic rake/timer/buy-in limits.
- [ ] **Settlement Engine**: 🔴 NEXT — Scheduled balance reconciliation between Redis and Postgres.
- [ ] **Admin Finance**: Completing the Payout logic for IBAN/Bank withdrawals.
- [x] **Game Control**: Kill-switch and Pause/Resume in Admin ✅

### Priority 3: Frontend Integrity
- [ ] **Query Migration**: Replace all mock data imports with `useQuery`/`useMutation`.
- [ ] **SystemContext**: Dynamic feature flags and global maintenance state.
