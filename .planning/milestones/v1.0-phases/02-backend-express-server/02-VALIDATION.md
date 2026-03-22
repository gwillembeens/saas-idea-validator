---
phase: 2
slug: backend-express-server
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | curl / node --test (Node built-in) |
| **Config file** | none — inline curl commands |
| **Quick run command** | `curl -s http://localhost:3001/health` |
| **Full suite command** | `cd server && node index.js & sleep 1 && curl -s -X POST http://localhost:3001/api/validate -H "Content-Type: application/json" -d '{"idea":"short"}' && curl -s -X POST http://localhost:3001/api/validate -H "Content-Type: application/json" -d '{"idea":"A SaaS tool that automates invoicing for small plumbing businesses via agent workflows"}' --no-buffer` |
| **Estimated runtime** | ~10 seconds (with streaming) |

---

## Sampling Rate

- **After every task commit:** Run `curl -s http://localhost:3001/health`
- **After every plan wave:** Run full suite (400 test + streaming test)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | BACK-01 | grep | `grep "process.env.PORT" server/index.js` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | BACK-03 | grep | `grep "SYSTEM_PROMPT" server/systemPrompt.js` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | BACK-02 BACK-04 BACK-05 | grep | `grep "text/event-stream" server/routes/validate.js` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 2 | BACK-02 | curl | `curl -s -X POST localhost:3001/api/validate -d '{"idea":"x"}' -H "Content-Type: application/json" \| grep "too short"` | N/A | ⬜ pending |
| 2-01-05 | 01 | 2 | BACK-04 BACK-05 | curl | `curl -s -X POST localhost:3001/api/validate ... --no-buffer` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/routes/validate.js` — stub file (must exist before tasks reference it)
- [ ] `server/systemPrompt.js` — stub export (must exist before import in validate.js)
- [ ] `server/routes/` directory created

*Note: No test framework to install — validation is grep + curl based.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API key never logged | BACK-03 | Cannot assert absence of logging without runtime inspection | Start server, check `process.env.ANTHROPIC_API_KEY` is never printed to console during validate call |
| Stream chunks arrive progressively | BACK-04/BACK-05 | Requires timing-based observation | Run curl with `--no-buffer`, visually confirm text arrives in chunks rather than all at once |
| Client receives via ReadableStream | BACK-05 | Requires browser/Vite client | Phase 3 integration test covers this |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
