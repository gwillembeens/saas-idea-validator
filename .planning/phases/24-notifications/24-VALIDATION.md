---
phase: 24
slug: notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (client) — existing config in `client/vite.config.js` |
| **Config file** | `client/vite.config.js` (test.environment: jsdom) |
| **Quick run command** | `cd client && npm test -- --run` |
| **Full suite command** | `cd client && npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && npm test -- --run`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | NOTIF-01 | integration | manual: check DB row created on like | ❌ manual | ⬜ pending |
| 24-01-02 | 01 | 1 | NOTIF-02 | integration | manual: check DB row created on comment | ❌ manual | ⬜ pending |
| 24-02-01 | 02 | 1 | NOTIF-01 | unit | `cd client && npm test -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 24-03-01 | 03 | 2 | NOTIF-01 | manual | manual: bell badge visible + polling stops on hidden tab | ❌ manual | ⬜ pending |
| 24-04-01 | 04 | 2 | NOTIF-01 | manual | manual: dropdown renders, click navigates | ❌ manual | ⬜ pending |
| 24-05-01 | 05 | 2 | NOTIF-02 | manual | manual: CommentModal auto-opens on comment notif click | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/hooks/useNotifications.test.js` — stubs for hook unit tests (polling, mark read, optimistic zero)

*Existing infrastructure (vitest + jsdom) covers all other phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Like triggers notification (not self) | NOTIF-01 | Requires 2 user sessions | Log in as User A + B. B likes A's validation. Check notifications table. |
| Comment triggers notification (not self) | NOTIF-02 | Requires 2 user sessions | Log in as User A + B. B comments on A's validation. Check badge. |
| Polling pauses on hidden tab | D-06 | Browser tab visibility API | Open DevTools Network. Switch tab. Verify no 30s requests fired. |
| Optimistic zero on dropdown open | D-08 | Visual timing check | Watch badge: must clear before server response arrives. |
| CommentModal auto-opens from notif | D-12 | Navigation state | Click comment notification. Modal must open without manual click. |
| 30-day retention filter | D-17 | Requires seeded old data | Seed old notification. Verify it doesn't appear in dropdown. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
