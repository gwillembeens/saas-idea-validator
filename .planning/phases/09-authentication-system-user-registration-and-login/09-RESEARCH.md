# Phase 9 Research — Authentication System

## Executive Summary

This document captures implementation decisions for Phase 9: Authentication System. The recommended tech stack prioritizes maintainability and modern best practices for a React 18 + Express (ES modules) + Postgres SaaS.

**Key recommendations:**
1. **Auth library:** Custom implementation (not Passport.js or Better Auth) — simpler for this phase scope
2. **Password hashing:** bcrypt (proven, simpler than Argon2 for this scale)
3. **JWT strategy:** HS256 + httpOnly cookie refresh tokens with rotation
4. **Email service:** Resend (@resend/email package)
5. **OAuth:** Google + GitHub via manual OAuth 2.0 flow (no third-party SDK required at this stage)

---

## Recommended Library Stack

### Auth Library Choice: Custom Implementation

**Decision:** Implement custom auth rather than using Passport.js or Better Auth.

**Rationale:**
- **Passport.js**: Low-level, requires building session management, password reset, email verification, and OAuth orchestration yourself. Better for highly flexible enterprise needs.
- **Better Auth**: Modern, TypeScript-first, but designed for full-stack frameworks (Next.js, Nuxt). Adds unnecessary abstraction layers for a simple Express + React split-stack app. Smaller community for bug fixes.
- **Custom**: For Phase 9 scope (email/password register, login, logout, email verification, password reset, Google/GitHub OAuth), custom is clearer, lighter, and gives full control over the exact UX flow (auth modal, redirect behavior, session handling).

**What "custom" means:** Hand-write the registration route, login route, token refresh route, and OAuth callback handlers using standard Express patterns. Use established packages for JWT signing and password hashing only.

### Password Hashing: bcrypt

**Decision:** Use bcrypt (not Argon2).

**Rationale:**
- **bcrypt**: Industry standard since 1999, proven secure with cost factor 12–14 (250–500ms per hash). Simpler integration, smaller attack surface, faster iteration for startups.
- **Argon2**: Winner of Password Hashing Competition (2015). Superior resistance to GPU attacks. Overkill for a Phase 9 SaaS without millions of users. Adds complexity.

**Implementation:**
```bash
npm install bcrypt
```

**Usage:**
```javascript
import bcrypt from 'bcrypt'

// Hash password on registration
const hash = await bcrypt.hash(password, 12)

// Verify on login
const isValid = await bcrypt.compare(inputPassword, storedHash)
```

### JWT Signing: jsonwebtoken

**Decision:** Use the standard `jsonwebtoken` package.

**Package:**
```bash
npm install jsonwebtoken
```

**Algorithm choice: HS256 (Symmetric)**

**Rationale:**
- HS256 uses one shared secret key for both signing and verification.
- RS256 uses public/private key pairs and scales better in distributed systems, but adds complexity (key rotation, management).
- For a monolithic Express backend + Vercel frontend (both under your control), HS256 is faster, simpler, and sufficient.

**Token lifetimes (recommended):**
- **Access token**: 15 minutes (short-lived, low risk if leaked)
- **Refresh token**: 30 days (long-lived, stored securely in httpOnly cookie)

**Cookie configuration (development):**
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: false,        // local dev, no HTTPS
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
})
```

**Cookie configuration (production on Railway/Vercel):**
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,         // HTTPS enforced
  sameSite: 'strict',   // prevent CSRF; consider 'lax' if cross-domain
  path: '/api/auth',
  domain: '.yourdomain.com',  // enables cookie across subdomains
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
})
```

**Note on cross-origin in production:** If frontend is `myapp.vercel.app` and backend is `myapp.railway.app`, they're technically different origins. Cookies won't auto-send unless you:
1. Set frontend Vite proxy to `/api` → backend in dev (already done).
2. In production, configure Vite to make API calls to the backend's full URL and include `credentials: 'include'` in fetch calls.
3. Configure CORS on Express: `credentials: true`, and set `Access-Control-Allow-Origin` to the exact frontend domain (not `*`).

### Email Service: Resend

**Package:**
```bash
npm install resend
```

**Usage from Express:**
```javascript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Send verification email
await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: user.email,
  subject: 'Verify your email',
  html: `<p>Click <a href="...">here</a> to verify.</p>`,
})
```

**Configuration:**
- Add `RESEND_API_KEY` to `.env`
- Use a verified sender domain (e.g., `noreply@yourdomain.com`)
- Free tier: 100 emails/day; sufficient for early phase

---

## Database Schema

### SQL Create Table Statements

All tables use `uuid` for IDs (PostgreSQL's `uuid_generate_v4()`) and include timestamps.

#### `users` Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255), -- NULL if OAuth-only user
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Fields explanation:**
- `id`: Unique identifier, UUID v4
- `email`: Unique, required for all users (email/password or OAuth)
- `password_hash`: NULL if user signs up via OAuth only; present if email/password signup
- `email_verified`: FALSE until user clicks verification link
- `email_verified_at`: Timestamp of when email was verified
- `created_at`, `updated_at`: Audit trail

#### `oauth_accounts` Table

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google' or 'github'
  provider_account_id VARCHAR(255) NOT NULL, -- OAuth provider's user ID
  access_token TEXT, -- optional; store if you need to call provider API later
  refresh_token TEXT, -- optional; store if provider supports it
  expires_at TIMESTAMP, -- when access_token expires
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider_id ON oauth_accounts(provider, provider_account_id);
```

**Fields explanation:**
- `user_id`: FK to users, one user can have multiple OAuth providers
- `provider`: 'google' or 'github'
- `provider_account_id`: Unique ID from OAuth provider (Google subject, GitHub user ID)
- `access_token`: Optional; useful if you plan to call the provider's API on behalf of the user
- `refresh_token`: Optional; some providers return this
- `expires_at`: When the access_token is no longer valid
- UNIQUE constraint ensures one user can't link the same provider account twice

#### `email_verification_tokens` Table

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE, -- random token, hashed or plaintext
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token ON email_verification_tokens(token);
```

**Fields explanation:**
- `token`: Random string (e.g., 32 random bytes, base64-encoded)
- `expires_at`: Typically 24 hours after creation
- Cleanup: Periodically delete expired tokens to keep table lean

**Verification flow:**
1. User signs up with email, create a users row with `email_verified = FALSE`
2. Generate a random token, store in `email_verification_tokens` with `expires_at = now + 24h`
3. Send verification email with link like `/api/auth/verify-email?token=...`
4. User clicks link, backend validates token exists, hasn't expired, and matches a user
5. Update users row: `email_verified = TRUE`, `email_verified_at = now()`
6. Delete the verification token

#### `password_reset_tokens` Table

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
```

**Fields explanation:**
- Similar to email verification tokens
- Used for password reset flow (forgot password)
- Typically expire after 1 hour

**Password reset flow:**
1. User clicks "Forgot Password" → enters email
2. If user exists, generate a random token, store in `password_reset_tokens` with `expires_at = now + 1h`
3. Send password reset email with link like `/api/auth/reset-password?token=...`
4. User clicks link, is taken to reset form (frontend validates token server-side before showing form)
5. User submits new password, backend validates token, updates users row `password_hash`, deletes token

#### `refresh_tokens` Table (Optional)

If you want to support token revocation (logout invalidates the token immediately), add:

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- hash of the actual token, never store plaintext
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);
```

**Rationale:**
- If you store tokens in the DB, logout becomes immediate (set `revoked = TRUE`)
- Without DB-backed tokens, logout is soft (clear the cookie; token is still valid until expiry)
- For Phase 9, soft logout is acceptable; skip this table to keep it simple

---

## JWT + Cookie Configuration

### Token Structure

**Access Token Payload (JWT):**
```json
{
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568490
}
```

**Refresh Token Payload (JWT):**
```json
{
  "sub": "uuid-of-user",
  "tokenId": "unique-token-id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

The `tokenId` is optional and used for token rotation: each refresh generates a new `tokenId`, and you can optionally store the token hash in the DB to revoke it.

### Signing & Verification

**Environment variables:**
```bash
JWT_SECRET=your-very-long-random-secret-key-at-least-32-bytes
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=30d
```

**Sign access token:**
```javascript
import jwt from 'jsonwebtoken'

function signAccessToken(userId, email) {
  return jwt.sign(
    { sub: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  )
}
```

**Sign refresh token:**
```javascript
function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d', algorithm: 'HS256' }
  )
}
```

**Verify token:**
```javascript
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch (err) {
    return null
  }
}
```

### Refresh Token Rotation Pattern

To prevent token replay attacks:

1. **Login endpoint** returns both access token (in memory) and refresh token (in httpOnly cookie)
2. **Refresh endpoint** (`POST /api/auth/refresh`):
   - Read refresh token from cookie
   - Verify it's valid
   - Issue a **new** access token
   - Issue a **new** refresh token and set new cookie
   - (Optional) Revoke the old refresh token if DB-backed
3. **Logout endpoint** (`POST /api/auth/logout`):
   - Clear the refresh token cookie
   - (Optional) Set `revoked = TRUE` in the database for immediate revocation

---

## OAuth Flow Architecture

### Google OAuth Setup

**Prerequisites:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the "Google+ API"
4. Create OAuth 2.0 credentials (Web Application type)
5. Set **Authorized Redirect URIs** to:
   - Dev: `http://localhost:3001/api/auth/google/callback`
   - Prod: `https://myapp.railway.app/api/auth/google/callback`
6. Copy `Client ID` and `Client Secret` to `.env`

### GitHub OAuth Setup

**Prerequisites:**
1. Go to GitHub Settings → Developer Settings → OAuth Apps → New OAuth App
2. Set **Authorization callback URL** to:
   - Dev: `http://localhost:3001/api/auth/github/callback`
   - Prod: `https://myapp.railway.app/api/auth/github/callback`
3. Copy `Client ID` and `Client Secret` to `.env`

### OAuth Flow (Backend-Initiated)

**Step 1: Frontend initiates login**
```
User clicks "Sign in with Google"
→ Frontend redirects to: https://myapp.railway.app/api/auth/google
```

**Step 2: Backend starts OAuth**
```javascript
// GET /api/auth/google
export async function initGoogleOAuthRoute(req, res) {
  const state = crypto.randomBytes(32).toString('hex')
  req.session.oauthState = state // or store in DB

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', `${process.env.BACKEND_URL}/api/auth/google/callback`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)

  res.redirect(authUrl.toString())
}
```

**Step 3: Google redirects back to backend**
```
Google → https://myapp.railway.app/api/auth/google/callback?code=...&state=...
```

**Step 4: Backend exchanges code for tokens**
```javascript
// GET /api/auth/google/callback
export async function googleCallbackRoute(req, res) {
  const { code, state } = req.query

  // Verify state matches
  if (state !== req.session.oauthState) {
    return res.status(401).json({ error: 'Invalid state' })
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    }),
  })

  const { access_token } = await tokenRes.json()

  // Get user info
  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  const googleUser = await userRes.json()

  // Find or create user
  let user = await db.query('SELECT * FROM users WHERE email = $1', [googleUser.email])
  if (!user.rows.length) {
    user = await db.query(
      'INSERT INTO users (email, email_verified, email_verified_at) VALUES ($1, TRUE, NOW()) RETURNING *',
      [googleUser.email]
    )
  }
  user = user.rows[0]

  // Link OAuth account
  await db.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_account_id, access_token, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')
     ON CONFLICT (provider, provider_account_id) DO NOTHING`,
    [user.id, 'google', googleUser.sub, access_token]
  )

  // Create JWT and set cookie
  const accessToken = signAccessToken(user.id, user.email)
  const refreshToken = signRefreshToken(user.id)

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })

  // Redirect to frontend with access token in query (frontend stores in memory)
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(accessToken)}&email=${encodeURIComponent(user.email)}`)
}
```

**Step 5: Frontend stores token and closes modal**
```javascript
// On /auth/callback?token=...&email=...
const searchParams = new URLSearchParams(location.search)
const token = searchParams.get('token')
const email = searchParams.get('email')

// Dispatch to Redux
dispatch(setAuth({ user: { id: '...', email }, status: 'authenticated' }))
sessionStorage.setItem('accessToken', token) // in-memory during session
history.replaceState({}, '', '/') // remove query params
```

**Cross-origin issue solution:**
- Backend OAuth callback redirects to `frontend-domain/auth/callback?token=...`
- Frontend reads the token and stores it (in memory or sessionStorage)
- Frontend makes subsequent `/api/validate` calls with `Authorization: Bearer token` header
- Backend verifies the token before processing validation

**Alternative (more secure):** After step 4, backend redirects to frontend with a short-lived auth code instead of the token itself. Frontend exchanges the code for a token via a backend route. This keeps tokens server-to-server and out of the URL.

---

## Express Route Structure

All auth routes mounted at `/api/auth/`:

### POST /api/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "User created. Please verify your email.",
  "email": "user@example.com"
}
```

**Logic:**
1. Validate email format and password strength (minimum 8 chars, mix of upper/lower/digit)
2. Check if email already exists
3. Hash password with bcrypt (cost 12)
4. Insert user into `users` table with `email_verified = FALSE`
5. Generate verification token, store in `email_verification_tokens`
6. Send verification email via Resend
7. Return 201

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Logged in successfully",
  "user": { "id": "uuid", "email": "user@example.com" },
  "accessToken": "eyJhbGc..."
}
```

Cookie: `refreshToken` (httpOnly, set automatically)

**Logic:**
1. Find user by email
2. Verify password with bcrypt.compare()
3. Check `email_verified = TRUE` (if not, return 403 "Email not verified")
4. Generate access token (15m expiry)
5. Generate refresh token (30d expiry), set httpOnly cookie
6. Return access token in response body and 200

### GET /api/auth/verify-email

**Query params:** `?token=...`

**Response (200):**
```json
{ "message": "Email verified successfully" }
```

**Logic:**
1. Find token in `email_verification_tokens`
2. Check expiry
3. Update users row: `email_verified = TRUE`, `email_verified_at = NOW()`
4. Delete the token
5. Return 200

**Error cases:**
- Token not found: 404
- Token expired: 410
- User already verified: 200 (idempotent)

### POST /api/auth/logout

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

**Logic:**
1. Clear the `refreshToken` cookie
2. (Optional) Set `revoked = TRUE` in `refresh_tokens` DB table
3. Return 200

### POST /api/auth/refresh

**Cookies:** Reads `refreshToken`

**Response (200):**
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "accessToken": "eyJhbGc..."
}
```

**Cookie:** New `refreshToken` (httpOnly, set automatically)

**Logic:**
1. Read refresh token from cookie
2. Verify signature with JWT
3. (Optional) Check `revoked = FALSE` in DB
4. Generate new access token
5. Generate new refresh token, set new cookie
6. (Optional) Revoke old token in DB
7. Return new access token

**Error cases:**
- No cookie: 401
- Invalid signature: 401
- Expired: 401
- Revoked (if DB-backed): 401

### POST /api/auth/forgot-password

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{ "message": "If the email exists, a reset link has been sent" }
```

**Logic:**
1. Find user by email (don't reveal if user exists for security)
2. If user found, generate password reset token
3. Store in `password_reset_tokens` with `expires_at = now + 1h`
4. Send reset email via Resend with link: `/auth/reset-password?token=...`
5. Always return 200 (don't leak whether email exists)

### POST /api/auth/reset-password

**Request:**
```json
{
  "token": "...",
  "newPassword": "newsecurepassword123"
}
```

**Response (200):**
```json
{ "message": "Password reset successfully" }
```

**Logic:**
1. Find token in `password_reset_tokens`
2. Check expiry
3. Validate new password strength
4. Hash new password
5. Update users row: `password_hash = ...`
6. Delete the token
7. Return 200

### GET /api/auth/google

Initiates Google OAuth flow (see OAuth Flow Architecture section above).

### GET /api/auth/google/callback

Handles Google OAuth callback (see OAuth Flow Architecture section above).

### GET /api/auth/github

Initiates GitHub OAuth flow (same pattern as Google).

### GET /api/auth/github/callback

Handles GitHub OAuth callback (same pattern as Google).

---

## React Auth Patterns

### authSlice Redux Shape

```javascript
// client/src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, // { id, email } or null
    status: 'idle', // idle | loading | authenticated | error
    error: null,
    showAuthModal: false,
    authModalMode: 'login', // login | register
  },
  reducers: {
    setUser: (state, action) => { state.user = action.payload },
    setAuthStatus: (state, action) => { state.status = action.payload },
    setAuthError: (state, action) => { state.error = action.payload },
    showAuthModal: (state, action) => { state.showAuthModal = true; state.authModalMode = action.payload || 'login' },
    hideAuthModal: (state) => { state.showAuthModal = false },
    toggleAuthMode: (state) => { state.authModalMode = state.authModalMode === 'login' ? 'register' : 'login' },
    logout: (state) => { state.user = null; state.status = 'idle' },
  },
})

export const { setUser, setAuthStatus, setAuthError, showAuthModal, hideAuthModal, toggleAuthMode, logout } = authSlice.actions
export default authSlice.reducer
```

### Intercept Validate Click Pattern

**IdeaInput.jsx:**
```javascript
import { useSelector, useDispatch } from 'react-redux'
import { showAuthModal } from '../store/slices/authSlice'
import { useValidate } from '../hooks/useValidate'

export function IdeaInput() {
  const dispatch = useDispatch()
  const { user, status } = useSelector(s => ({
    user: s.auth.user,
    status: s.validator.status,
  }))
  const { validate } = useValidate()
  const idea = useSelector(s => s.validator.idea)

  const handleValidateClick = () => {
    if (!user) {
      // Preserve the idea text and show auth modal
      dispatch(showAuthModal('login'))
      return
    }
    // User is logged in, proceed with validation
    validate()
  }

  return (
    <Card decoration="tape" rotate={-1}>
      <TextArea placeholder="Paste your idea..." />
      <Button onClick={handleValidateClick} disabled={!idea.trim() || status === 'streaming'}>
        Validate
      </Button>
    </Card>
  )
}
```

**Key points:**
- Check `user` state before proceeding
- If not authenticated, dispatch `showAuthModal` instead of validating
- The idea text remains in Redux, untouched
- After login succeeds, the modal closes, and validation fires automatically (via a watcher or effect)

### Auto-Trigger Validation After Login

**AuthModal.jsx:**
```javascript
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useValidate } from '../hooks/useValidate'

export function AuthModal() {
  const dispatch = useDispatch()
  const { showAuthModal, user, status: authStatus } = useSelector(s => ({
    showAuthModal: s.auth.showAuthModal,
    user: s.auth.user,
    authStatus: s.auth.status,
  }))
  const { validate } = useValidate()
  const validatorStatus = useSelector(s => s.validator.status)

  // Auto-trigger validation after successful login
  useEffect(() => {
    if (user && authStatus === 'authenticated' && validatorStatus === 'idle') {
      setTimeout(() => {
        validate()
        dispatch(hideAuthModal())
      }, 500) // Small delay for UX smoothness
    }
  }, [user, authStatus, validatorStatus])

  return showAuthModal ? (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <LoginRegisterForm />
      </Card>
    </div>
  ) : null
}
```

### Login/Register Form Toggle

**LoginRegisterForm.jsx:**
```javascript
import { useDispatch, useSelector } from 'react-redux'
import { toggleAuthMode } from '../store/slices/authSlice'

export function LoginRegisterForm() {
  const dispatch = useDispatch()
  const mode = useSelector(s => s.auth.authModalMode) // 'login' or 'register'

  return (
    <div>
      {mode === 'login' ? (
        <LoginForm />
      ) : (
        <RegisterForm />
      )}

      <button
        onClick={() => dispatch(toggleAuthMode())}
        className="mt-4 text-blue underline text-center"
      >
        {mode === 'login'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
```

### Access Token Storage & Refresh

**useAuth.js Custom Hook:**
```javascript
import { useDispatch, useSelector } from 'react-redux'
import { setUser, setAuthStatus, setAuthError, logout } from '../store/slices/authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const { user, status, error } = useSelector(s => s.auth)

  // Restore session from refresh token on app load
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch('/api/auth/refresh', { credentials: 'include' })
        if (res.ok) {
          const { user, accessToken } = await res.json()
          sessionStorage.setItem('accessToken', accessToken)
          dispatch(setUser(user))
          dispatch(setAuthStatus('authenticated'))
        } else {
          dispatch(setAuthStatus('idle'))
        }
      } catch {
        dispatch(setAuthStatus('idle'))
      }
    }
    restoreSession()
  }, [])

  async function register(email, password) {
    dispatch(setAuthStatus('loading'))
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error(await res.text())
      // After registration, show message: "Check your email"
      dispatch(setAuthStatus('idle'))
    } catch (err) {
      dispatch(setAuthError(err.message))
    }
  }

  async function login(email, password) {
    dispatch(setAuthStatus('loading'))
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // send/receive cookies
      })
      if (!res.ok) throw new Error(await res.text())
      const { user, accessToken } = await res.json()
      sessionStorage.setItem('accessToken', accessToken)
      dispatch(setUser(user))
      dispatch(setAuthStatus('authenticated'))
    } catch (err) {
      dispatch(setAuthError(err.message))
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    sessionStorage.removeItem('accessToken')
    dispatch(logout())
  }

  return { user, status, error, register, login, handleLogout }
}
```

**Access token in fetch calls:**

```javascript
// For /api/validate and other protected endpoints
const accessToken = sessionStorage.getItem('accessToken')
const res = await fetch('/api/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ idea }),
  credentials: 'include', // send refresh token cookie
})
```

### Middleware for Token Refresh on 401

**In useValidate.js or a custom API interceptor:**

```javascript
async function apiFetch(url, options = {}) {
  let res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
    },
  })

  // If 401, try refreshing the token once
  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', { credentials: 'include' })
    if (refreshRes.ok) {
      const { accessToken } = await refreshRes.json()
      sessionStorage.setItem('accessToken', accessToken)

      // Retry original request
      res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    } else {
      // Refresh failed, user is logged out
      dispatch(logout())
    }
  }

  return res
}
```

---

## Resend Integration

### Installation

```bash
npm install resend
```

### Sending Verification Email

**server/utils/sendVerificationEmail.js:**
```javascript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to SaaS Idea Validator</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  })
}
```

### Sending Password Reset Email

**server/utils/sendPasswordResetEmail.js:**
```javascript
export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  })
}
```

### Environment Variables

Add to `.env`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173   # dev
BACKEND_URL=http://localhost:3001    # dev
```

In production (Railway):
```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://myapp.vercel.app
BACKEND_URL=https://myapp.railway.app
```

---

## Implementation Risks & Mitigations

### 1. Cross-Origin Cookie Issues (Vercel ↔ Railway)

**Risk:** Frontend on Vercel, backend on Railway—cookies don't auto-attach if domains differ.

**Mitigation:**
- Dev: Vite proxy handles this (no cross-origin locally)
- Prod: Use `credentials: 'include'` in fetch, set CORS headers on backend: `Access-Control-Allow-Credentials: true` and `Access-Control-Allow-Origin: https://myapp.vercel.app` (exact domain, not `*`)
- Cookie domain: Set `domain: '.yourdomain.com'` if using subdomains, or omit for same-origin only

### 2. Email Deliverability

**Risk:** Resend emails go to spam, users don't receive verification links.

**Mitigation:**
- Verify domain with Resend (DNS records)
- Use professional `from` address (not generic noreply)
- Include unsubscribe link in transactional emails (good practice)
- Monitor bounce rates in Resend dashboard

### 3. Token Rotation Edge Cases

**Risk:** Race condition if user quickly clicks refresh twice before new token is set.

**Mitigation:**
- Implement token rotation with a grace period (e.g., allow old token for 30 seconds after refresh)
- Or: Queue refresh requests to ensure serial execution (not parallel)
- Test the refresh endpoint under high frequency

### 4. OAuth State Parameter Validation

**Risk:** Attacker initiates OAuth flow for user A, redirects to user B's browser; user B clicks, account gets linked to wrong user.

**Mitigation:**
- Always validate `state` parameter matches session state before trusting the OAuth response
- Store state in session or DB, not in localStorage (localStorage visible to XSS attacks)
- Use short state expiry (5-10 minutes)

### 5. Refresh Token Compromise

**Risk:** If someone steals the refresh token cookie, they can maintain access indefinitely.

**Mitigation:**
- httpOnly flag prevents JavaScript access (XSS attacks can't steal it)
- Secure flag enforces HTTPS in production
- Implement token rotation: each refresh invalidates the old token
- Monitor for unusual refresh patterns (rate limit /api/auth/refresh)
- Optional: IP binding (store user IP in token, reject if mismatched; adds complexity)

### 6. Password Reset Token Leaked in URL

**Risk:** URL visible in browser history, referer headers, server logs.

**Mitigation:**
- Use POST instead of GET for reset form submission (keeps token in body, not URL)
- Or: Send token in response body after validation step (user must be on reset page first)
- Use short expiry (1 hour)
- Log tokens as hashed, never plaintext

---

## Validation Architecture

### Auth System Tests (for Phase 9 Test Planning)

**Registration:**
- [ ] Valid email/password creates user with email_verified = FALSE
- [ ] Duplicate email rejected with 400
- [ ] Weak password (< 8 chars) rejected with 400
- [ ] Verification email sent after signup
- [ ] Clicking verification link sets email_verified = TRUE

**Login:**
- [ ] Correct email/password returns access token and sets refresh cookie
- [ ] Wrong password returns 401
- [ ] Unverified email returns 403 (email not verified)
- [ ] Non-existent email returns 401 (generic error)

**Logout:**
- [ ] Refresh token cookie cleared
- [ ] Subsequent /api/validate calls without token return 401

**Token Refresh:**
- [ ] Valid refresh token returns new access token
- [ ] Expired refresh token returns 401
- [ ] New refresh token issued in cookie (rotation)

**Forgot Password:**
- [ ] Email field accepts any email (no enumeration leaks)
- [ ] If user exists, reset email sent
- [ ] Reset link in email works for 1 hour
- [ ] Clicking reset link allows password change
- [ ] Old password no longer works after reset

**Google OAuth:**
- [ ] Initiating /api/auth/google redirects to Google login
- [ ] Callback creates new user if email doesn't exist
- [ ] Callback links OAuth account to existing user if email matches
- [ ] User is logged in and redirected to frontend after successful OAuth
- [ ] Duplicate OAuth link attempt is idempotent (no duplicate rows)

**GitHub OAuth:**
- [ ] Same tests as Google OAuth

**Integration Tests (Auth + Validation):**
- [ ] Unauthenticated user clicks Validate → auth modal shows
- [ ] User registers in modal, email verified → modal closes, validation auto-triggers
- [ ] User logs in in modal → modal closes, validation auto-triggers
- [ ] Logged-in user clicks Validate → validation starts immediately
- [ ] Access token expires mid-validation → /api/validate auto-retries with refresh token

---

## RESEARCH COMPLETE

This document captures all critical decisions for Phase 9 implementation planning. Key recommendations:

1. **Custom auth** (not Passport/Better Auth) for simplicity
2. **bcrypt + HS256 JWT** for proven security at this scale
3. **httpOnly cookie refresh tokens** with rotation for UX + security
4. **Resend** for email (simpler DX than Nodemailer)
5. **OAuth via manual flow** (no SDK) for full control
6. **React Redux authSlice** mirroring validator patterns
7. **Auth modal with intercept pattern** (Validate click) to preserve typed idea

Ready for implementation planning.
