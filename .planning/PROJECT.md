# SaaS Idea Validator

## What This Is

A React web app that lets founders paste a startup idea and receive a structured
validation report scored against a 30-step framework for building agent-native SaaS
businesses. The Claude API powers the analysis and the response streams in real time.
Users authenticate, save validated ideas, browse their history, and share public result
links — built with a hand-drawn sketchbook design aesthetic throughout.

## Core Value

A founder pastes an idea and gets an honest, investor-grade analysis in under a minute,
streamed live with a visual scorecard — fast enough to validate 10 ideas in a morning.

## Requirements

### Validated

- ✓ Express server proxies Claude API, API key stays server-side — v1.0
- ✓ POST /api/validate streams Claude response as text/event-stream — v1.0
- ✓ Redux Toolkit slice manages idea/status/result/error state machine — v1.0
- ✓ useValidate custom hook reads ReadableStream, dispatches appendResult per chunk — v1.0
- ✓ IdeaInput component dispatches setIdea and validate(), button disabled while streaming — v1.0
- ✓ ResultsPanel renders streamed markdown progressively via react-markdown — v1.0
- ✓ Hand-drawn sketchbook design system applied throughout (Kalam + Patrick Hand fonts, wobbly borders, hard offset shadows) — v1.0
- ✓ Scorecard component parses phase scores and renders them visually (1–5 circles) — v1.0
- ✓ Verdict badge displays overall signal strength with colour coding — v1.0
- ✓ All components assembled into responsive, accessible page layout — v1.0
- ✓ Error state visible to user (error Card in ResultsPanel) — v1.0
- ✓ App ships with root README — developer can run locally from fresh clone — v1.0
- ✓ Split-card results layout: Idea Summary, Scorecard, Commentary, Verdict as separate animated cards — v1.0
- ✓ Full authentication: email/password + Google/GitHub OAuth, JWT rotation, bcrypt, 30-day refresh tokens — v1.0
- ✓ PostgreSQL persistence: validation history saved per user with title editing and delete — v1.0
- ✓ Public sharing: shareable result links accessible without login — v1.0
- ✓ HistoryPage: infinite scroll, sort toggle, empty state, filtered selector — v1.0
- ✓ NavBar with sticky header, auth actions, and route links — v1.0
- ✓ Framework page at /framework showing all 30 steps grouped by phase — v1.0
- ✓ ResultPage refactored: <200 lines, clean component/hook/utility extraction — v1.0

### Active

- [ ] Public leaderboard showing all public validations ranked by weighted score, filterable by niche
- [ ] Auto-detected niche tag (secondary Claude call) stored per validation — Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other
- [ ] Public/private toggle on result page (default private), with unpublish from history page
- [ ] Idea versioning: auto-similarity detection prompts user to link new validation as revision; result page shows score delta per phase
- [ ] User profile page (/profile/:username) — public validations, stats/badges, display name + avatar, revision chains
- [ ] "Beat the Leaderboard" challenge section on leaderboard — top score per niche (score + niche only, no idea text) with validate CTA
- [ ] Password reset frontend form wired to existing backend endpoint
- [ ] E2E tests for split-card layout (Phase 08-03 debt)

### Out of Scope

- Mobile app — web-first; sketchbook design works on desktop
- Real-time collaboration — single-user tool
- PDF export (SHARE-02) — not in v1.0 or v2.0; useful but non-critical
- Paid leaderboard ranking boosts — gamification without integrity
- Voting / likes on leaderboard entries — adds social complexity, defers to v3.0

## Current Milestone: v2.0 Social Layer

**Goal:** Add a public social layer that turns private validations into a competitive, community-visible leaderboard — driving engagement through niche ranking, idea versioning, and user profiles.

**Target features:**
- Public leaderboard with niche filter and score ranking
- Auto-detected niche tag via secondary Claude API call
- Public/private toggle per validation
- Idea versioning with per-phase score delta
- User profile pages (clickable from leaderboard)
- "Beat the Leaderboard" challenge cards
- Password reset frontend (tech debt)
- E2E tests for split-card layout (tech debt)

## Context

- Stack: React 19 + Vite + Redux Toolkit + Tailwind CSS v3 frontend; Node.js + Express 5 backend; Anthropic SDK for Claude streaming; PostgreSQL for persistence.
- Design system: hand-drawn/sketchbook aesthetic — wobbly border-radius (inline styles), hard offset shadows, Kalam (headings) + Patrick Hand (body) fonts, dot-grid paper background.
- Claude model: `claude-sonnet-4-20250514` with streaming enabled.
- Auth: JWT with 15m access tokens + 30d refresh rotation, bcrypt 12 rounds, Google/GitHub OAuth.
- Shipped v1.0 with ~3,425 LOC JavaScript/JSX across 14 phases.
- Known technical debt: password reset frontend not wired, E2E tests for split-card layout not written (08-03 pending).

## Constraints

- **API Key**: `ANTHROPIC_API_KEY` must never appear in client-side code — Express reads it from `.env`
- **Fonts**: Always Kalam (headings) or Patrick Hand (body) — never system fonts
- **Shadows**: Hard offset only (`4px 4px 0px 0px #2d2d2d`) — never soft/blurred
- **Borders**: Wobbly inline style always on primary elements — never `rounded-*` Tailwind classes
- **State**: Redux Toolkit slice only — no local component state for app data
- **Data fetching**: Custom hooks only — no `useEffect` for fetching
- **Streaming**: Always stream — never wait for full response before rendering

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Express backend proxy for Claude API | Keep API key server-side; client never touches Anthropic directly | ✓ Good — clean security boundary |
| Redux Toolkit for all app state | Prevents prop drilling; slice manages idea/status/result/error | ✓ Good — historySlice + authSlice added cleanly |
| Streaming via ReadableStream | UX depends on progressive rendering; full response wait is too slow | ✓ Good — sub-200ms chunk latency |
| Tailwind CSS v3 with custom config | Extended tokens for design system colours, fonts, shadows | ✓ Good — consistent design language |
| JWT + PostgreSQL auth (not "no auth") | Founders need to save and revisit validations — history is core value | ✓ Good — enabled history feature |
| Split-card layout for results | Section-level readability over monolithic markdown dump | ✓ Good — Idea Summary / Scorecard / Commentary / Verdict as separate cards |
| Public sharing via share token | Founders share results with co-founders/investors without requiring login | ✓ Good — low friction sharing |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 — Phase 18 complete (Public Leaderboard: ranked public validations with niche filtering, infinite scroll, author attribution)*
