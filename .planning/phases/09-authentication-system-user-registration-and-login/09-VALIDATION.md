---
phase: 9
slug: authentication-system-user-registration-and-login
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (client) + node --test or jest (server) |
| **Config file** | client/vite.config.js (vitest inline) / server/package.json |
| **Quick run command** | `cd client && npx vitest run` |
| **Full suite command** | `cd client && npx vitest run && cd ../server && node --test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && npx vitest run`
- **After every plan wave:** Run full suite (client + server)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | DB schema | integration | `psql -c "\d users"` | ❌ W0 | ⬜ pending |
| 9-01-02 | 01 | 1 | Register route | unit | `node --test server/routes/auth.test.js` | ❌ W0 | ⬜ pending |
| 9-01-03 | 01 | 1 | Login route | unit | `node --test server/routes/auth.test.js` | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 1 | authSlice | unit | `cd client && npx vitest run src/store/slices/authSlice.test.js` | ❌ W0 | ⬜ pending |
| 9-02-02 | 02 | 2 | AuthModal render | unit | `cd client && npx vitest run src/components/auth/AuthModal.test.jsx` | ❌ W0 | ⬜ pending |
| 9-03-01 | 03 | 2 | OAuth routes | manual | Browser: visit /api/auth/google, confirm redirect | N/A | ⬜ pending |
| 9-03-02 | 03 | 2 | Email verify | manual | Register, check email, click link, confirm account active | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/routes/auth.test.js` — stubs for register, login, logout, refresh, verify-email, reset-password
- [ ] `client/src/store/slices/authSlice.test.js` — stubs for authSlice reducers and thunks
- [ ] `client/src/components/auth/AuthModal.test.jsx` — render stubs for AuthModal component
- [ ] `vitest` installed in client if not already present

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth login | D-09 | Requires browser redirect + Google account | Click "Continue with Google", complete flow, verify logged in |
| GitHub OAuth login | D-09 | Requires browser redirect + GitHub account | Click "Continue with GitHub", complete flow, verify logged in |
| Email verification | D-07 | Requires real email delivery via Resend | Register with real email, click link, verify account_verified=true |
| Forgot password flow | D-08 | Requires real email delivery via Resend | Request reset, click email link, update password, verify login works |
| Persistent session | D-05 | Requires browser close + reopen | Log in, close browser, reopen, verify still authenticated |
| Auth wall UX | D-12 | Visual/interaction check | Paste idea without login, click Validate, verify modal slides in |
| Auto-proceed after login | D-13 | Requires modal + validation integration | Login via modal, verify validation fires automatically |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
