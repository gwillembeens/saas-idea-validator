---
phase: 15
slug: tech-debt-resolution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + @playwright/test (E2E) |
| **Config file** | `playwright.config.js` (Wave 0 creates), `vite.config.js` (existing vitest config) |
| **Quick run command** | `npm run test:e2e` |
| **Full suite command** | `npm run test:e2e && npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test` (unit tests)
- **After every plan wave:** Run `npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | DEBT-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | DEBT-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | DEBT-01 | manual | Login with new password | N/A | ⬜ pending |
| 15-02-01 | 02 | 2 | DEBT-02 | e2e | `npm run test:e2e` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | DEBT-02 | e2e | `npm run test:e2e` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/split-cards.spec.js` — stubs for DEBT-02 split-card E2E tests
- [ ] `playwright.config.js` — Playwright configuration with baseURL and webServer
- [ ] `@playwright/test` — install E2E framework (if not present)
- [ ] `tests/unit/useAuth.resetPassword.test.js` — unit stub for DEBT-01 resetPassword function

*Wave 0 must install @playwright/test before E2E test files can run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Password reset email delivery | DEBT-01 | Requires real Resend API + email inbox | 1. Request reset for test account 2. Check inbox for email 3. Click link |
| New password login success | DEBT-01 | Full flow requires email + browser | After reset, log in with new password; confirm success |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
