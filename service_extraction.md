# Service Architecture Extraction

This document details the functional scope of the 20 recommended services, mapping specific **Features** (API endpoints, logic, data) to the **Pages** that consume them.

> **Note:** "All Pages" implies the service is used globally (e.g., Gateway, Config).

---

## 1. AuthService
*   **Role:** Identity & Access Management.
*   **Features:**
    *   **Login/Logout:** Validating credentials, issuing JWTs.
    *   **Registration:** creating new accounts with default roles.
    *   **Password Management:** Forgot password flows, reset tokens.
    *   **Session Validation:** Verifying tokens for protected routes.
*   **Pages Used:**
    *   `/login` (Login, Signup, Forgot Password)
    *   `/profile` (Change Password, Logout)
    *   *Implicitly used by all protected pages via Middleware.*

## 2. UserService
*   **Role:** User Profile & State Management.
*   **Features:**
    *   **Profile Data:** Fetching username, avatar, bio, join date.
    *   **Status Management:** Banning, suspending, or activating users.
    *   **Impersonation:** Allowing admins to log in as users.
    *   **KYC Status:** Tracking verification levels.
*   **Pages Used:**
    *   `/profile` (View/Edit Profile)
    *   `/admin/users` (List Users, Ban/Unban, Impersonate)
    *   `/` (Lobby - Display user avatar/balance summary)

## 3. WalletService
*   **Role:** Financial Ledger & Balance Management.
*   **Features:**
    *   **Balance Queries:** Real (drawable) vs. Credit (bonus) balances.
    *   **Transactions:** Deposit/Withdraw requests and history logs.
    *   **Funds Locking:** Reserving funds for table buy-ins/tournament fees.
*   **Pages Used:**
    *   `/wallet` (Deposit/Withdraw, History)
    *   `/` (Lobby - Balance Modal)
    *   `/tournaments` (Lobby - Check balance for buy-in)
    *   `/admin/finance` (Approve/Reject requests, Manual Adjustments)
    *   `/admin/analytics` (Transaction logs)

## 4. PaymentService (Manual)
*   **Role:** Manual Transaction Workflow & Evidence Management.
*   **Features:**
    *   **Deposit Request:** User creates "Intent to Pay"; upload proof/receipt.
    *   **Withdrawal Request:** User requests payout; Admin marks "Processed" after manual transfer.
    *   **Status Workflow:** Pending -> Reviewed -> Approved/Rejected.
    *   **Evidence:** Storing transaction screenshots or IDs.
*   **Pages Used:**
    *   `/wallet` (User: "I made a transfer", Upload Proof)
    *   `/admin/finance` (Admin: View Proof, Approve meant to trigger WalletService)

## 5. GameEngine (Stateful)
*   **Role:** Real-time Game Logic (The "Dealer").
*   **Features:**
    *   **Core Mechanics:** Dealing cards, calculating pot, handling side-pots.
    *   **Player Actions:** Validating Fold, Check, Call, Raise.
    *   **Timers:** Enforcing turn limits.
    *   **State Broadcasting:** Emitting socket events for UI updates.
*   **Pages Used:**
    *   `/game/[tableId]` (The entire active poker table experience)

## 6. GameService (Stateless)
*   **Role:** Table Discovery, Metadata, & History.
*   **Features:**
    *   **Table CRUD:** Creating, Updating, Closing tables.
    *   **Lobby Listing:** Providing the list of active tables and player counts.
    *   **Waitlist Management:** Queuing users for full tables.
    *   **Hand Replays:** Fetching serialized game logs for playback (e.g., "See how you lost with AA").
*   **Pages Used:**
    *   `/` (Lobby - Cash Game List, Waitlist Join)
    *   `/admin/game-management` (Create/Close Tables)
    *   `/profile` (User: Watch Replay of past hands)

## 7. TournamentService
*   **Role:** Tournament Lifecycle Management.
*   **Features:**
    *   **Registry:** Listing available tournaments.
    *   **Registration:** Handling Buy-ins, Unregistering.
    *   **Lifecycle:** Starting tournament (triggering GameEngine), balancing tables, payouts.
*   **Pages Used:**
    *   `/` (Lobby - Tournament List)
    *   `/tournaments` (Dedicated Tournament Lobby)
    *   `/admin/tournaments` (Create/Cancel, Monitor Status)

## 8. PromotionService
*   **Role:** Bonuses, Campaigns, & Wagering Requirements.
*   **Features:**
    *   **Campaign Management:** defining rules for bonuses.
    *   **Redemption:** Validating promo codes.
    *   **Progress Tracking:** Checking wagering requirements (e.g., "Bet $500 more to unlock").
*   **Pages Used:**
    *   `/promotions` (List Promos, Claim Rewards, Enter Codes)
    *   `/admin/bonuses` (Create/Edit Bonuses, View Stats)

## 9. ChatService
*   **Role:** Real-time Messaging & History.
*   **Features:**
    *   **Ephemeral Chat:** Table chat rooms (auto-cleared after game).
    *   **History:** Fetching last N messages for a room.
    *   **Moderation:** Word filtering (profanity filter).
*   **Pages Used:**
    *   `/game/[tableId]` (Table Chat)
    *   `/` (Lobby - Global Chat, if enabled)

## 10. SupportService
*   **Role:** Helpdesk & Ticketing.
*   **Features:**
    *   **Ticket Management:** CRUD for support tickets.
    *   **Live Support:** Real-time chat between Admin and User.
    *   **Attachments:** Handling screenshot uploads.
*   **Pages Used:**
    *   `/` (Lobby - Support Widget/Chat)
    *   `/admin/support` (Admin Ticket Dashboard, Reply Interface)

## 11. NotificationService
*   **Role:** User Alerts & Communication.
*   **Features:**
    *   **In-App Alerts:** "Your turn", "Deposit Successful".
    *   **Push/Email:** Dispatching external messages (via Gateway).
    *   **Read Receipts:** Marking notifications as read.
*   **Pages Used:**
    *   `/notifications` (View List, Mark Read)
    *   *All Pages* (Toast popups for urgent events)

## 12. AnalyticsService
*   **Role:** Deep Data Analysis & Reporting.
*   **Features:**
    *   **Revenue Reports:** Calculating GGR (Gross Gaming Revenue), NGR.
    *   **Game Performance:** Most popular tables/hours.
    *   **Export:** Generating CSV/PDF reports.
*   **Pages Used:**
    *   `/admin` (Dashboard Charts)
    *   `/admin/analytics` (Detailed graphs, Export tools)

## 13. StatsService
*   **Role:** Player Statistics & Leaderboards.
*   **Features:**
    *   **Aggregations:** "Hands Won", "Biggest Pot" per user.
    *   **Rankings:** Global leaderboards by earnings/activity.
*   **Pages Used:**
    *   `/leaderboard` (Global High Scores)
    *   `/profile` (Personal Stats Tab)

## 14. AuditService
*   **Role:** Security & Compliance Logging.
*   **Features:**
    *   **Activity Logging:** "Admin X changed Setting Y".
    *   **Search:** Filtering logs by IP, User, Action.
*   **Pages Used:**
    *   `/admin/audit` (View/Search System Logs)
    *   `/admin/finance/iban` (History of IBAN changes)

## 15. MonitoringService
*   **Role:** Infrastructure Health.
*   **Features:**
    *   **Health Checks:** CPU/RAM usage of nodes.
    *   **Latency Options:** Real-time ping maps.
*   **Pages Used:**
    *   `/admin/monitoring` (Server Status, Latency Map)

## 16. BroadcastService
*   **Role:** System-wide Announcements.
*   **Features:**
    *   **Announcements:** Sending "Server Restart in 5 mins" to all sockets.
    *   **History:** Storing sent broadcasts.
*   **Pages Used:**
    *   `/admin/broadcast` (Compose Message, View History)
    *   *All Pages* (Receiving the broadcast overlay)

## 17. SchedulerService
*   **Role:** Time-based Job Automation.
*   **Features:**
    *   **CRON Jobs:** "Pay out daily leaderboard rewards at 00:00 UTC".
    *   **One-off Tasks:** "Start Tournament X at 20:00".
    *   **Cleanup:** "Archive old chat logs".
*   **Pages Used:**
    *   *Backend Only:* Orchestrates logic for `TournamentService`, `StatsService`.
    *   `/admin` (Indirectly controls tournament start times)

## 18. ConfigService
*   **Role:** Dynamic System Configuration.
*   **Features:**
    *   **Bank Details:** Admin-managed IBANs, Crypto Wallet Addresses, Instructions.
    *   **Feature Flags:** "Enable New Poker Mode".
    *   **System Variables:** "Max Deposit Limit", "Rake Percentage".
    *   **Client Assets:** Serving logo URLs, primary color codes.
*   **Pages Used:**
    *   `/admin/finance/iban` (Admin: Edit Bank Details)
    *   `/wallet` (User: View Bank Details for Deposit)
    *   *All Pages* (Bootstrapping app with config.json)

## 19. ContentService (NEW)
*   **Role:** Dynamic Content Management (CMS).
*   **Features:**
    *   **Static Pages:** Serving JSON for "Terms", "Privacy", "About Us".
    *   **Banners:** Managing valid Home Page banners (Image URL + Link).
    *   **Localization:** Serving `en.json`, `es.json` translation files.
*   **Pages Used:**
    *   `/` (Lobby Banners)
    *   `/promotions` (Promo Content/Images)
    *   *New Page:* `/cms/[slug]` (Generic page renderer)

## 20. GatewayService (NEW)
*   **Role:** API Routing & Load Balancing.
*   **Features:**
    *   **Routing:** `/api/chat` -> `ChatService`, `/api/wallet` -> `WalletService`.
    *   **Rate Limiting:** Protecting services from DDoS.
    *   **Protocol Translation:** HTTP -> Socket (if needed).
*   **Pages Used:**
    *   *All Pages:* Every API request hits this first.

## 21. Frontend Dynamic Requirements (The "No Static Shit" Rule)
*   **Role:** mandates that the Frontend **MUST NOT** contain hardcoded strings or logic.
*   **Requirements:**
    1.  **Bootstrapping:** App loads `GET /api/config/init` on start.
        *   Response: `{ "features": {...}, "theme": {...}, "routes": {...} }`.
    2.  **Navigation:** Navbar links ("Tournaments", "Promotions") come from `ContentService` (Menu JSON).
    3.  **Localization:** All text ("Join Table", "Waitlist") comes from `ContentService` (i18n JSON).
    4.  **Assets:** Logo URL, specific icons (e.g., `fa-spade`) come from `ConfigService`.
    5.  **Game Constants:** Chip values, bet slider increments, and timeouts come from `GameService` metadata, not JS `const` files.
