---
phase: 1
slug: project-scaffold
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell verification (file existence, npm install success) |
| **Config file** | none — scaffold phase, no test framework yet |
| **Quick run command** | `ls server/package.json client/package.json && echo OK` |
| **Full suite command** | `cd server && npm install && cd ../client && npm install && echo ALL_DEPS_OK` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `ls server/package.json client/package.json && echo OK`
- **After every plan wave:** Run `cd server && npm install && cd ../client && npm install && echo ALL_DEPS_OK`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | BACK-01 | shell | `ls server/ client/` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | BACK-02 | shell | `grep ANTHROPIC_API_KEY server/.env.example` | ✅ | ⬜ pending |
| 1-01-03 | 01 | 1 | BACK-05 | shell | `grep '/api' client/vite.config.js` | ✅ | ⬜ pending |
| 1-01-04 | 01 | 1 | BACK-01 | shell | `node -e "require('./server/package.json')" 2>/dev/null && echo OK` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — Phase 1 IS the infrastructure setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Both servers start without errors | BACK-01, BACK-05 | Requires running processes | `cd server && node index.js` (should start on 3001); `cd client && npm run dev` (should start on 5173) |
| .env not committed to git | BACK-02 | Git history check | `git log --all --name-only \| grep -v ".env.example" \| grep ".env"` should return nothing |
| Tailwind custom tokens render | DESIGN-01 (prereq) | Visual check | After Phase 4, verify custom colors/fonts appear in browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
