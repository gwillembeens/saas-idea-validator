---
phase: 21
slug: challenge-cards
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend) + node:test (backend) |
| **Config file** | `client/vite.config.js` (vitest config inline) |
| **Quick run command** | `cd client && npm test -- --run` |
| **Full suite command** | `cd client && npm test -- --run && cd ../server && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && npm test -- --run`
- **After every plan wave:** Run `cd client && npm test -- --run && cd ../server && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 0 | CHAL-01 | unit | `cd server && npm test` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | CHAL-01 | unit | `cd server && npm test` | ✅ | ⬜ pending |
| 21-02-01 | 02 | 0 | CHAL-01, CHAL-02 | unit | `cd client && npm test -- --run` | ❌ W0 | ⬜ pending |
| 21-02-02 | 02 | 1 | CHAL-02 | unit | `cd client && npm test -- --run` | ✅ | ⬜ pending |
| 21-02-03 | 02 | 1 | CHAL-01 | unit | `cd client && npm test -- --run` | ✅ | ⬜ pending |
| 21-02-04 | 02 | 2 | CHAL-01, CHAL-02 | unit | `cd client && npm test -- --run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/routes/leaderboard.test.js` — stub tests for `GET /api/leaderboard/top-per-niche`: structure, all niches present, null scores, filtering
- [ ] `client/src/hooks/useChallengeScores.test.js` — stubs for hook: fetch on mount, loading state, error handling
- [ ] `client/src/components/leaderboard/ChallengeCard.test.jsx` — stubs for card: renders niche name, score, CTA button, calls onTryNiche, navigation
- [ ] `client/src/components/leaderboard/ChallengeSection.test.jsx` — stubs for section: renders 8 cards, loading skeleton, error state

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Try This Niche" pre-fills textarea on home page | CHAL-02 | Navigation + Redux state change hard to assert in unit test | Click a challenge card CTA → navigate to `/` → verify textarea contains "I'm building a [Niche] SaaS that..." |
| Cards visually render in horizontal scroll on mobile (320px) | CHAL-01 | Visual layout, requires viewport | Open /leaderboard on mobile viewport, verify cards scroll horizontally without overflow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
