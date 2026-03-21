---
plan: 09-01
phase: 9
title: "Backend — Database Schema & Core Auth Routes"
wave: 1
status: completed
completed_at: "2026-03-21"
---

# Plan 09-01 Execution Summary

## What Was Built

Complete server-side authentication infrastructure including PostgreSQL database schema, JWT utilities, middleware, and all seven authentication route handlers.

### Files Created

1. **server/db/schema.sql** — PostgreSQL schema with 5 tables:
   - `users` (id, email, password_hash, email_verified, timestamps)
   - `oauth_accounts` (OAuth provider integration)
   - `email_verification_tokens` (24h expiry)
   - `password_reset_tokens` (1h expiry)
   - `refresh_tokens` (30d expiry)

2. **server/db/init.js** — Database connection pool
   - pg Pool with dynamic SSL configuration
   - Production: SSL with rejectUnauthorized: false
   - Development: No SSL

3. **server/utils/jwt.js** — JWT token utilities
   - `signAccessToken()` → 15-minute HS256 tokens
   - `signRefreshToken()` → 30-day HS256 tokens
   - `verifyAccessToken()` / `verifyRefreshToken()` verification functions

4. **server/utils/crypto.js** — Secure token generation
   - `generateToken(bytes)` using crypto.randomBytes

5. **server/middleware/requireAuth.js** — JWT middleware
   - Reads `Authorization: Bearer <token>` header
   - Attaches decoded payload to `req.user`

6. **server/routes/auth.js** — Seven auth route handlers
   - `registerRoute` — POST /api/auth/register (bcrypt 12 rounds, email verification)
   - `loginRoute` — POST /api/auth/login (password validation, email verification check)
   - `logoutRoute` — POST /api/auth/logout (refresh token deletion)
   - `refreshRoute` — POST /api/auth/refresh (token rotation)
   - `verifyEmailRoute` — GET /api/auth/verify-email?token= (email verification)
   - `forgotPasswordRoute` — POST /api/auth/forgot-password (no email enumeration)
   - `resetPasswordRoute` — POST /api/auth/reset-password (token validation, token revocation)

7. **server/routes/auth.test.js** — Test stub (Wave 0)
   - All 7 test cases pass with `node --test`

### Files Modified

1. **server/index.js** — Express integration
   - Added `cookie-parser` middleware
   - Updated CORS with `credentials: true` and dynamic origin
   - Mounted all 7 auth routes at `/api/auth/*`

2. **.env.example** — Environment variable template
   - Added DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, RESEND_API_KEY
   - Added OAuth client IDs/secrets (Google, GitHub)
   - Added FRONTEND_URL, BACKEND_URL, NODE_ENV

### Npm Packages Installed

- bcrypt — password hashing (12 rounds)
- jsonwebtoken — JWT signing/verification
- pg — PostgreSQL client
- uuid — UUID generation
- resend — transactional email
- cookie-parser — HTTP cookie parsing

## Key Implementation Details

### Cookie Configuration

```javascript
COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === 'production' ? true : false,
  sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}
```

### Password Hashing

- bcrypt with 12 rounds cost factor
- Passwords validated at registration (min 8 chars)
- Passwords hashed at registration and reset

### Token Rotation

- `refreshRoute` implements token rotation:
  1. Delete old refresh token from DB
  2. Issue new refresh token
  3. Set new token in httpOnly cookie
  4. Return new accessToken

### Email Verification

- Registration creates email_verification_token (24h expiry)
- Resend API sends verification link
- verifyEmailRoute marks user.email_verified = true
- loginRoute blocks login if email_verified = false

### Password Reset

- forgotPasswordRoute returns 200 always (no email enumeration)
- resetPasswordRoute validates token expiry and used flag
- After password reset, all refresh tokens for user are deleted (security)

### Database

- Using pg Pool for connection pooling
- SSL required in production (Railway standard)
- Development mode uses no SSL
- UUID primary keys generated via PostgreSQL pgcrypto extension

## Deviations from Plan

None — plan executed exactly as specified.

## Self-Check

- [x] server/db/schema.sql exists with 5 tables
- [x] server/db/init.js exports pool
- [x] server/utils/jwt.js exports sign/verify functions
- [x] server/utils/crypto.js exports generateToken
- [x] server/middleware/requireAuth.js exports requireAuth
- [x] server/routes/auth.js exports all 7 route handlers
- [x] server/index.js mounts all auth routes with cookie-parser + credentials CORS
- [x] .env.example updated with all new keys
- [x] server/routes/auth.test.js test stubs pass

**Status:** PASSED

All nine tasks completed successfully. Authentication infrastructure is ready for frontend integration in phase 09-02.
