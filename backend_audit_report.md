# Backend Service Architecture Audit

## 1. Executive Summary
The proposed list of 16 services covers the majority of the application's core functionality, including game logic, user management, and administrative oversight. However, for a production-ready, fully dynamic "real money" application, crucial infrastructure components regarding **security (Auth)**, **financial integrations (Payments)**, and **automation (Scheduler)** are missing. Additionally, there is opportunities for consolidation to reduce maintenance overhead.

## 2. Service Analysis & Coverage

### Core Business Logic (Well Covered)
- **GameEngine**: Correctly separated for handling high-frequency state changes (poker logic, timers) using Redis.
- **GameService**: Handles metadata, table CRUD, and lobby listings. Good separation from the engine.
- **TournamentService**: Essential for managing lifecycle, registration, and prize pools.
- **WalletService**: Centralized point for balance management. **Critical:** Needs strict ACID compliance.
- **ChatService**: Handles ephemeral communication.

### User & Support (Well Covered)
- **UserService**: Standard profile and account management.
- **SupportService**: Ticket handling and support chat.
- **NotificationService**: Centralized push notifications.

### Data & Analytics (Potential Overlap)
- **StatsService**: User-facing stats (leaderboards, profile stats).
- **AdminStatsService**: Dashboard aggregates.
- **AnalyticsService**: Deep-dive trends and reports.
- **AuditService**: Security logs.
*Coverage is good, but see Consolidation Recommendations.*

### Marketing (Redundant)
- **PromoService**
- **BonusService**
*Both serve effectively the same domain.*

## 3. Critical Gaps (Missing Services)

### 🚨 1. AuthService (Authorization & Authentication)
**Why it's needed:** The user list is missing a dedicated `AuthService`.
- **Responsibilities:** Login, Signup, Password Recovery, JWT generation/validation, 2FA, Session Management.
- **Impact:** Without this, security logic is scattered or nonexistent.

### 💰 2. PaymentGatewayService (External Integrations)
**Why it's needed:** `WalletService` manages internal ledgers, but who talks to the bank?
- **Responsibilities:** Interfacing with Stripe/PayPal/Crypto/Bank APIs, handling webhooks, initial verification of deposits.
- **Impact:** You cannot process real money without this strict isolation layer.

### ⏱️ 3. SchedulerService (Job Queue)
**Why it's needed:** The blueprints mention "Periodic auto-refresh", "Tournament Start Times", "Bonus Expiration".
- **Responsibilities:** CRON jobs, delayed tasks, tournament state transitions, cleanup jobs.
- **Impact:** Essential for a dynamic system that runs without manual intervention.

### ⚙️ 4. ConfigService
**Why it's needed:** Admin pages like `/admin/finance/iban` imply dynamic system configuration.
- **Responsibilities:** Hot-reloading system settings (maintenance mode, fee structures, banner texts) without code deploys.

## 4. Consolidation Recommendations

1.  **Merge `BonusService` and `PromoService`** -> **`PromotionService`**
    *   *Reason:* Campaigns, checking codes, and wagering requirements are tightly coupled logic.
2.  **Merge `AdminStatsService` into `AnalyticsService`**
    *   *Reason:* `AdminStatsService` typically just runs lighter queries or cached views of the data `AnalyticsService` owns.
3.  **Formalize `NotificationGateway`**
    *   *Reason:* `NotificationService` handles internal logic. You likely need a dedicated gateway (or provider integration like SendGrid/Twilio) for Email and SMS delivery.

## 5. Final Recommended Service List (Dynamic Ready)

1.  **AuthService** (NEW)
2.  **UserService**
3.  **WalletService**
4.  **PaymentGatewayService** (NEW)
5.  **GameEngine** (Stateful/Socket)
6.  **GameService** (Stateless/API)
7.  **TournamentService**
8.  **PromotionService** (Merged Bonus+Promo)
9.  **ChatService**
10. **SupportService**
11. **NotificationService**
12. **AnalyticsService** (Merged AdminStats)
13. **StatsService** (User Leaderboards)
14. **AuditService**
15. **MonitoringService**
16. **BroadcastService**
17. **SchedulerService** (NEW)
18. **ConfigService** (NEW)
