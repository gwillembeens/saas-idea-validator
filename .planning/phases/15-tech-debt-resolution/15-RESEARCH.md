# Phase 15: Tech Debt Resolution — Research

**Gathered:** 2026-03-22
**Requirements:** DEBT-01, DEBT-02

---

## Current State

**Password Reset Backend:** Fully implemented
- Backend endpoint `/api/auth/reset-password` exists and is complete (server/routes/auth.js lines 167–185)
- Uses Resend email service to send reset links
- Tokens stored in `password_reset_tokens` table with 1-hour expiry and one-time-use enforcement
- Security: hashes new passwords with bcrypt, invalidates all refresh tokens after reset
- Backend sends reset link as query parameter: `/password-reset?token={token}`

**Password Reset Frontend:** PARTIALLY implemented
- Auth modal supports 'forgot' mode (forgot password request)
- `useAuth` hook has `forgotPassword()` function that calls `/api/auth/forgot-password` endpoint
- `App.jsx` detects reset token in URL and sets Redux mode to 'reset' (line 40), showing auth modal
- **MISSING:** AuthModal does NOT have a 'reset' mode UI for actually submitting the new password
- **MISSING:** No `resetPassword()` function in the `useAuth` hook to call `/api/auth/reset-password`
- **MISSING:** No dedicated `/password-reset` route/page
- **SESSION STORAGE ISSUE:** Reset token stored in sessionStorage but never used (line 39)

**Split-Card Results Layout:** Implemented for Phase 8
- Results rendered as separate Cards: `IdeaSummaryCard`, `Scorecard` (inline Card), `VerdictCard`, `CommentaryCard`
- Each card has wobbly borders, decorations (tape/tack), and rotations
- Cards rendered sequentially in `/pages/ResultPage.jsx` (lines 142–167)
- **NO ANIMATION TIMING:** Cards appear instantly as content loads; no stagger or fade-in animations
- **E2E TESTS MISSING:** No Playwright, Cypress, or E2E test files exist in the codebase

---

## What's Missing

**DEBT-01: Password Reset Frontend Wiring**
1. AuthModal doesn't render 'reset' mode UI (accepts token and new password)
2. No `resetPassword(token, password)` function in `useAuth` hook
3. Reset token stored in sessionStorage but never used or cleared
4. No form validation or error handling for password reset submission
5. No success feedback after password reset

**DEBT-02: E2E Tests for Split-Card Layout**
1. No E2E test framework installed (Playwright, Cypress, or similar)
2. No test suite for split-card visibility, content accuracy, or responsive layout

---

## Technical Approach

### DEBT-01: Password Reset Frontend Wiring

1. **`useAuth` hook** — add `resetPassword(token, password)` function that POSTs to `/api/auth/reset-password`

2. **`AuthModal.jsx`** — add 'reset' mode branch in the form (alongside 'login', 'register', 'forgot'):
   - Password input field
   - Submit handler calling `resetPassword(token, password)`
   - Success/error messages
   - Redirect to home on success

3. **`App.jsx`** — extract reset token from sessionStorage when 'reset' modal is shown, pass token to AuthModal; clear sessionStorage after use

### DEBT-02: E2E Tests

1. Install Playwright: `npm install -D @playwright/test` (dev dependency at project root)
2. Create `playwright.config.js` at project root (baseURL, webServer, timeout)
3. Create `tests/e2e/split-cards.spec.js` test suite
4. Add npm scripts: `"test:e2e": "playwright test"` and `"test:e2e:ui": "playwright test --ui"`

---

## Key Files

**To Modify:**
- `client/src/hooks/useAuth.js` — add `resetPassword()` function
- `client/src/components/auth/AuthModal.jsx` — add 'reset' mode UI branch
- `client/src/App.jsx` — manage reset token from sessionStorage

**To Create:**
- `playwright.config.js` — Playwright configuration
- `tests/e2e/split-cards.spec.js` — E2E test suite for split-card layout

**Already Complete (Backend):**
- `server/routes/auth.js` — `resetPasswordRoute` fully functional
- `server/db/init.js` — `password_reset_tokens` table defined

---

## Dependencies

**New packages needed:**
- `@playwright/test` — E2E testing framework (dev dependency)

**Existing packages already present:**
- `@testing-library/react@^16.3.2` and `vitest@^4.1.0` — unit test infrastructure
- Resend, bcrypt — backend auth stack complete

---

## Risks & Considerations

1. **Email delivery in tests:** E2E tests for the full reset flow require a real email or mock; the split-card E2E tests do NOT require email (they test the result layout only)
2. **Token security:** Reset tokens are 1-time use, expire in 1 hour — UX must handle expired tokens gracefully
3. **Post-reset session:** Backend invalidates all refresh tokens after reset; user must re-login, needs clear UI messaging
4. **E2E flakiness:** Use explicit Playwright waits (`waitForSelector`, `waitForResponse`), never `setTimeout`
5. **Cross-browser:** Chromium-only is acceptable for MVP E2E coverage

---

## Validation Architecture

**DEBT-01:**
- `useAuth` resetPassword unit test: verifies POST to `/api/auth/reset-password` with correct payload
- AuthModal renders 'reset' mode: password input and submit button visible when mode='reset'
- Integration: full flow: request reset → click link → submit new password → login with new password succeeds

**DEBT-02:**
- `test('all 4 cards visible after validation completes')` — IdeaSummaryCard, Scorecard, VerdictCard, CommentaryCard all present in DOM
- `test('scorecard phase scores match parsed values')` — verify phase score cells match regex-parsed values
- `test('responsive: single column at mobile viewport 375px')` — cards at full width
- `test('responsive: constrained at desktop viewport 1280px')` — cards at max-w-2xl
- `test('verdict badge color matches score range')` — color class asserted per threshold
- Playwright HTML report generation for CI debugging

## RESEARCH COMPLETE
