# AuthService Documentation

**Path**: `apps/api/src/auth/auth.service.ts`

## 📖 Overview
The `AuthService` handles all authentication-related logic, including user registration, login, token management (JWT Access & Refresh Tokens), and password resets. It serves as the primary security gatekeeper for the application.

## 🔑 Key Features
*   **Registration**: Creates User and associated Wallet transactionally.
*   **JWT Management**: Issues short-lived Access Tokens and long-lived Refresh Tokens.
*   **Token Rotation**: Implements secure refresh token rotation (deletes old token on use).
*   **Password Security**: Uses `bcrypt` for password hashing.
*   **Password Reset**: Handles secure 6-digit code generation and email dispatch.

## 🛠️ API Methods

### 1. `register(dto: RegisterDto)`
Registers a new user and initializes their wallet.
*   **Checks**: Verifies if email or username is already taken.
*   **Transaction**:
    1.  Creates `User` record.
    2.  Creates `Wallet` record with initial bonus (1000).
*   **Returns**: Access Token, Refresh Token, and User Profile.

### 2. `login(dto: LoginDto)`
Authenticates a user.
*   **Validation**: Verifies email existence and password match.
*   **Returns**: New Access Token and Refresh Token.

### 3. `logout(userId: string, refreshToken: string)`
Securely logs out a user.
*   **Action**: Deletes the specific refresh token from the database.

### 4. `refresh(refreshToken: string)`
Issues new tokens using a valid refresh token.
*   **Security**: Checks for token existence and expiration.
*   **Rotation**: Deletes the used refresh token and issues a fresh one.

### 5. `forgotPassword(email: string)`
Initiates password reset flow.
*   **Action**: Generates a 6-digit code (valid for 10 mins) and emails it to the user.
*   **Security**: Returns a generic success message even if the email doesn't exist (to prevent enumeration).

### 6. `resetPassword(code: string, newPassword: string)`
Completes password reset.
*   **Action**: Updates the user's password and clears the reset token.
*   **Security**: Invalidates **all** existing refresh tokens for that user (forces re-login on all devices).

## ⚠️ Error Handling
*   **ConflictException**: Thrown on duplicate email/username during registration.
*   **UnauthorizedException**: Thrown on invalid credentials or expired tokens.
*   **ForbiddenException**: Thrown if registration is disabled via config.
*   **BadRequestException**: Thrown for invalid reset tokens.

## 🔄 Dependencies
*   `PrismaService`: Database access.
*   `JwtService`: Token generation.
*   `EmailService`: Sending reset codes.
*   `ConfigService`: Checking global auth settings.
