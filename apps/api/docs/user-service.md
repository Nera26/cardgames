# UserService Documentation

**Path**: `apps/api/src/user/user.service.ts`

## 📖 Overview
The `UserService` manages user data, profile updates, administrative actions (bans/role changes), and the loyalty tier system. It acts as the central hub for user-related business logic.

## 🔑 Key Features
*   **Profile Management**: Handles bio, avatar, and **Banking Details (IBAN/Bank Account)**.
*   **Tier System**: Automatically calculates and upgrades VIP tiers based on Lifetime Rake.
*   **Admin Controls**: Provides capabilities to Ban, Unban, and Promote users.
*   **Data Mapping**: Sanitizes database objects into secure `UserResponse` DTOs.

## 🛠️ API Methods

### 👤 User Actions

#### 1. `getProfile(userId: string)`
Retrieves the full profile for the authenticated user.
*   **Includes**: Wallet balance and calculated Tier progress.

#### 2. `updateProfile(userId: string, dto: UpdateProfileDto)`
Updates user profile fields.
*   **Fields Supported**:
    *   `bio`
    *   `avatarUrl`
    *   `bankAccount`
    *   `iban` (Validated via Shared DTO regex)

### 🛡️ Admin Actions

#### 3. `getAllUsers(query: UserListQuery)`
Fetches a paginated, filtered list of users.
*   **Filters**: Search (Email/Username), Role, Tier, Banned Status.
*   **Returns**: Paginated result set with metadata.

#### 4. `banUser` / `unbanUser`
Controls user access.
*   **Security**:
    *   Admins cannot ban other Admins.
    *   SuperAdmins cannot ban other SuperAdmins.

#### 5. `updateRole(adminId: string, targetId: string, dto: UpdateRoleDto)`
Promotes or demotes a user (SuperAdmin only).

### 🏆 Tier System

#### 6. `addRake(userId: string, amount: number)`
Internal method called by the Game Engine.
*   **Logic**: Adds to `lifetimeRake` and recalculates the user's Tier.
*   **Tiers**: Bronze -> Silver -> Gold -> Platinum -> Diamond.

## 🔄 Data Mapping (`mapToUserResponse`)
Converts raw Prisma `User` objects into clean JSON responses.
*   **Calculations**:
    *   `balance`: Sum of Real + Bonus balance.
    *   `nextTierProgress`: Percentage (0-100) to next VIP level.
    *   `rakeToNextTier`: Exact amount need to upgrade.

## ⚠️ Error Handling
*   **NotFoundException**: Thrown when acting on non-existent users.
*   **ForbiddenException**: Thrown on invalid permission attempts (e.g., Admin banning Admin).
*   **BadRequestException**: Thrown on invalid rake calculations.
