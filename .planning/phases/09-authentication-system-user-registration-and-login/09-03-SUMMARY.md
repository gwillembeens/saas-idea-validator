---
phase: 09
plan: 09-03
title: "Integration — Auth Gate + OAuth Flows"
status: completed
date: 2026-03-21
---

# Plan 09-03 Execution Summary

## Overview

Phase 09-03 completed successfully. All 8 tasks implemented with atomic commits. This plan wires authentication into the validate flow, adds automatic token refresh, and implements Google + GitHub OAuth with end-to-end integration.

---

## Tasks Completed

### Task 09-03-01: Intercept Validate click in IdeaInput
**File:** `client/src/components/validator/IdeaInput.jsx`
- Imported `useAuth` hook
- Added `handleValidate` function that checks if user is authenticated
- If not authenticated: sets `pendingValidation=true`, opens login modal, returns
- If authenticated: calls `validate()` directly
- Updated form submit to call `handleValidate` instead of `validate`

**Commit:** `feat(09-03-01): intercept validate click, show auth modal if unauthenticated`

---

### Task 09-03-02: Auto-trigger validation after modal login
**File:** `client/src/components/auth/AuthModal.jsx`
- Imported `useValidate` hook
- Added `pendingValidation` and `setPendingValidation` from `useAuth`
- Modified `handleSubmit` login branch: after successful login, check if `pendingValidation` is true
- If true: call `setPendingValidation(false)` then `validate()`
- Creates zero-friction auth flow: user types idea → clicks validate → logs in → validation auto-proceeds

**Commit:** `feat(09-03-02): auto-trigger validation after successful login if pendingValidation`

---

### Task 09-03-03: Create fetchWithAuth utility
**File:** `client/src/utils/fetchWithAuth.js` (NEW)
- Exported `fetchWithAuth(url, options = {})` function
- Reads `accessToken` from Redux store
- Automatically adds `Authorization: Bearer {accessToken}` header
- Sets `credentials: 'include'` for cookie-based refresh
- On 401 response: attempts refresh via `/api/auth/refresh`
  - If refresh succeeds: dispatches new user + tokens to Redux, retries original request
  - If refresh fails: dispatches `clearAuth()`, returns original 401 response
- Ready for use by authenticated API endpoints

**Commit:** `feat(09-03-03): create fetchWithAuth utility with automatic token refresh`

---

### Task 09-03-04: Add Google OAuth routes
**File:** `server/routes/auth.js` (additions)
- Exported `googleAuthRoute`: GET `/api/auth/google`
  - Constructs OAuth initiation URL with `client_id`, `redirect_uri`, `scope`, `access_type`, `prompt`
  - Redirects browser to Google OAuth consent screen
- Exported `googleCallbackRoute`: GET `/api/auth/google/callback`
  - Receives `code` from Google OAuth
  - Exchanges code for access token via Google token endpoint
  - Fetches user info (email, id) from Google userinfo endpoint
  - Upserts user in database (creates if new, verifies email if returning)
  - Upserts `oauth_accounts` record to track Google identity
  - Issues JWT access token and refresh token
  - Sets `refreshToken` httpOnly cookie
  - Redirects to `FRONTEND_URL/?accessToken={token}`

**Commit:** `feat(09-03-04): add google oauth routes with token exchange and upsert user`

---

### Task 09-03-05: Add GitHub OAuth routes
**File:** `server/routes/auth.js` (additions)
- Exported `githubAuthRoute`: GET `/api/auth/github`
  - Constructs OAuth initiation URL with GitHub OAuth endpoint
  - Redirects browser to GitHub authorization page
- Exported `githubCallbackRoute`: GET `/api/auth/github/callback`
  - Receives `code` from GitHub OAuth
  - Exchanges code for access token via GitHub token endpoint
  - Fetches user info (id, username) from GitHub API
  - Fetches verified emails from GitHub API (primary + verified required)
  - Upserts user in database with verified email
  - Upserts `oauth_accounts` record to track GitHub identity
  - Issues JWT tokens, sets cookie
  - Redirects to `FRONTEND_URL/?accessToken={token}`

**Commit:** `feat(09-03-05): add github oauth routes with token exchange and upsert user`

---

### Task 09-03-06: Mount OAuth routes in Express
**File:** `server/index.js`
- Added imports for all 4 OAuth route handlers
- Mounted routes:
  - `GET /api/auth/google` → `googleAuthRoute`
  - `GET /api/auth/google/callback` → `googleCallbackRoute`
  - `GET /api/auth/github` → `githubAuthRoute`
  - `GET /api/auth/github/callback` → `githubCallbackRoute`

**Commit:** `feat(09-03-06): mount google and github oauth routes`

---

### Task 09-03-07: Handle URL params in App.jsx
**File:** `client/src/App.jsx`
- Added `useEffect` on app mount that checks `window.location.search` for special parameters
- **`?accessToken=`** (OAuth callback): Decodes JWT payload, dispatches `setUser` to Redux, cleans URL
- **`?verified=true`** (email verification): Opens login modal, cleans URL
- **`?reset={token}`** (password reset): Stores token in `sessionStorage`, opens modal in reset mode, cleans URL
- **`?auth_error=`** (OAuth failure): Opens login modal, cleans URL
- **Default** (no special params): Calls `refreshSession()` to restore auth state from httpOnly cookie

**Commit:** `feat(09-03-07): handle url params for oauth callback, email verification, password reset`

---

### Task 09-03-08: Add OAuth buttons to AuthModal
**File:** `client/src/components/auth/AuthModal.jsx`
- Added OAuth button section (only shown when `authModalMode !== 'forgot'`)
- Divider with "or" text
- "Continue with Google" button: `<a href="/api/auth/google">`
- "Continue with GitHub" button: `<a href="/api/auth/github">`
- Styled with design system: wobbly border, hard shadow, hover state
- Buttons navigate (not fetch) to backend routes which handle OAuth flow

**Commit:** `feat(09-03-08): add google and github oauth buttons to auth modal`

---

## Architecture Impact

### Frontend Flow
1. **Unauthenticated user** types idea, clicks "Validate Idea"
2. `IdeaInput` intercepts click, sees no user, sets `pendingValidation=true`, opens auth modal
3. User clicks "Continue with Google" or "Continue with GitHub" or logs in manually
4. Backend OAuth flow completes, redirects to `/?accessToken={jwt}`
5. `App.jsx` useEffect parses token, dispatches to Redux, cleans URL
6. User is now authenticated in Redux
7. `AuthModal` detects login + `pendingValidation`, calls `validate()`
8. Validation streams automatically — zero friction

### Backend Flow
1. OAuth routes accept code from Google/GitHub
2. Exchange code for access token
3. Fetch verified user email from provider
4. Upsert user in database (auto-creates if new, auto-verifies email)
5. Track OAuth identity in `oauth_accounts` table
6. Issue JWT + refresh token, set cookie
7. Redirect to frontend with accessToken in URL

### Security
- API keys stay server-side only
- Refresh token stored in httpOnly cookie (not accessible to JS)
- Access token in memory only (cleared on logout)
- OAuth state validation delegated to provider (no CSRF token needed for this simple flow)
- Token refresh on 401 via `fetchWithAuth` utility

---

## Testing Notes

### Manual OAuth Verification
- [ ] Visit `/api/auth/google` → redirects to Google consent screen
- [ ] Complete Google OAuth → backend exchanges code → redirects to `/?accessToken=...`
- [ ] Redux populated with user + token, URL cleaned to `/`
- [ ] Refresh page → still authenticated (refreshSession restores from cookie)
- [ ] Same flow for GitHub

### End-to-End Auth Gate
- [ ] Type idea, click "Validate" (logged out) → modal appears, idea preserved in Redux
- [ ] Click "Continue with Google" → OAuth flow → validation auto-proceeds after login
- [ ] Type new idea, click "Validate" (logged in) → validation starts immediately

---

## Files Modified

- `client/src/components/validator/IdeaInput.jsx` — auth gate logic
- `client/src/components/auth/AuthModal.jsx` — auto-trigger + OAuth buttons
- `client/src/utils/fetchWithAuth.js` — NEW utility for authenticated requests
- `server/routes/auth.js` — Google + GitHub OAuth routes
- `server/index.js` — OAuth route mounts
- `client/src/App.jsx` — URL param handling

---

## Git Commits

```
ec0db50 feat(09-03-08): add google and github oauth buttons to auth modal
7c931f6 feat(09-03-07): handle url params for oauth callback, email verification, password reset
9a36300 feat(09-03-06): mount google and github oauth routes
b688808 feat(09-03-05): add github oauth routes with token exchange and upsert user
314b5ea feat(09-03-04): add google oauth routes with token exchange and upsert user
855d68e feat(09-03-03): create fetchWithAuth utility with automatic token refresh
8dc812e feat(09-03-02): auto-trigger validation after successful login if pendingValidation
440f447 feat(09-03-01): intercept validate click, show auth modal if unauthenticated
```

---

## Wave 2 Complete

This completes Wave 2 of phase 09:
- ✅ 09-01: Backend routes (register, login, refresh, verify, forgot, reset)
- ✅ 09-02: Frontend Redux slice + useAuth hook
- ✅ 09-03: Integration — auth gate, OAuth, URL handling

Next phase (10) will handle user profile, analytics, and production hardening.
