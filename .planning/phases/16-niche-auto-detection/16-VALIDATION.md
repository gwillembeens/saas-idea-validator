---
phase: 16
slug: niche-auto-detection
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (client) + node --test (server) |
| **Config file** | client/vite.config.js (vitest config inline) |
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
| 16-01-01 | 01 | 1 | NICHE-02 | unit | `cd server && npm test -- --grep parseNiche` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | NICHE-02 | integration | `cd server && npm test -- --grep niche` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 2 | NICHE-01 | integration | `cd server && npm test -- --grep generateNiche` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | NICHE-03 | component | `cd client && npm test -- --run` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 1 | NICHE-03 | component | `cd client && npm test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/routes/history.test.js` — stubs for NICHE-01, NICHE-02 (parseNiche, generateNiche)
- [ ] `client/src/components/history/HistoryCard.test.jsx` — stub for NICHE-03 (niche pill rendering)
- [ ] `client/src/pages/ResultPage.test.jsx` — stub for NICHE-03 (standalone niche row rendering)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Niche absent during live streaming view | NICHE-01 | Streaming state is ephemeral, no DB read | Validate an idea, confirm no niche pill appears during stream |
| Niche appears on revisit via /history/:id | NICHE-01 | Async timing — must wait for background call | Save a result, wait 5s, revisit — confirm niche pill present |
| Niche pill hidden on mobile | NICHE-03 | CSS visibility requires browser viewport | Resize to <768px, confirm pill not visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
