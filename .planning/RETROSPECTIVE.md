# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-22
**Phases:** 14 | **Plans:** 35

### What Was Built

- Complete streaming React + Express app with hand-drawn sketchbook design system
- 30-step framework analysis via Claude API with visual scorecard (phase scores + weighted total)
- Split-card results layout: animated Idea Summary, Commentary, Verdict, Scorecard cards
- Full authentication: email/password + Google/GitHub OAuth, JWT rotation, bcrypt, auth-gated Validate
- PostgreSQL history persistence: save, browse (infinite scroll), inline title edit, delete, public share links
- NavBar, HistoryPage, History Detail View, Framework Page
- ResultPage refactored to clean architecture: <200 lines with extracted hooks/components/utilities

### What Worked

- **GSD phase-by-phase structure** kept the project moving steadily — no analysis paralysis, each phase had clear success criteria
- **Streaming-first architecture** was the right call from Phase 1; UX depends on it and it was never a bottleneck
- **Redux Toolkit slices** scaled cleanly from 1 slice (validator) to 3 (validator + auth + history) with no prop drilling issues
- **Design system upfront** (Phase 4 before features) meant visual consistency was never painful to retrofit
- **Adding auth + persistence** (Phases 9–10) built naturally on the v1 foundation without requiring major refactoring

### What Was Inefficient

- REQUIREMENTS.md and Out of Scope section were not updated as scope expanded (auth, history were originally "out of scope")
- No milestone audit was run before completion — gaps (password reset frontend, E2E tests for split-card) discovered post-hoc rather than proactively
- Phase 12 (History Detail View) directory shows empty plans in roadmap analyze — summary files may be in wrong location or under-documented

### Patterns Established

- **Split-card results pattern**: `parseSections` utility + card components + graceful fallback to raw markdown
- **useHistoryResult hook pattern**: data fetching + state + error handling extracted to custom hook, ResultPage stays thin
- **Auth-gate at action level** (not route level): modal intercepts Validate click, preserves idea text, no page redirect needed
- **Public share token pattern**: separate `shareToken` on saved results enables unauthenticated view without exposing private data

### Key Lessons

1. When scope expands during a milestone (auth, history were added), update REQUIREMENTS.md and Out of Scope at the time — not after
2. Run `/gsd:audit-milestone` before calling a milestone complete — surface password reset gap and E2E gaps earlier
3. Phase SUMMARY.md `one_liner` field should be explicit in the frontmatter — the CLI extraction failed because summaries used prose-only format

### Cost Observations

- Model: Sonnet 4.6 throughout (balanced profile)
- Timeline: 2 days (2026-03-21 → 2026-03-22)
- Notable: High velocity — 14 phases in 2 days using yolo mode with parallel execution

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Days | Phases | Key Change |
|-----------|------|--------|------------|
| v1.0 | 2 | 14 | Initial build — no prior milestones |

### Cumulative Quality

| Milestone | LOC | Tech Debt Items |
|-----------|-----|-----------------|
| v1.0 | ~3,425 JS/JSX | password reset frontend, E2E tests for split-card (08-03) |
