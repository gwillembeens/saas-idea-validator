# SaaS Idea Validator

## What This Is

A React web app that lets founders paste a startup idea and receive a structured
validation report scored against a 30-step framework for building agent-native SaaS
businesses. The Claude API powers the analysis and the response streams in real time.
No auth, no database — a single-purpose validation tool.

## Core Value

A founder pastes an idea and gets an honest, investor-grade analysis in under a minute,
streamed live with a visual scorecard — fast enough to validate 10 ideas in a morning.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can paste a startup idea into a text area and submit it for analysis
- [ ] Backend proxies the request to Claude API (API key stays server-side)
- [ ] Claude streams a structured validation report back to the client in real time
- [ ] UI renders the streamed markdown progressively as it arrives
- [ ] Scorecard component parses phase scores and renders them visually (1–5 circles)
- [ ] Verdict badge displays overall signal strength with colour coding
- [ ] Hand-drawn sketchbook design system applied throughout (Kalam + Patrick Hand fonts, wobbly borders, hard offset shadows)
- [ ] App runs locally (Node.js server + Vite dev server)

### Out of Scope

- Authentication / user accounts — v1 is single-use, no sessions needed
- Database / history — no persistence in v1
- Deployment / hosting — local only for v1
- Mobile app — web-first
- Real-time collaboration — single-user tool

## Context

- Stack is fully prescribed in CLAUDE.md: React 18 + Vite + Redux Toolkit + Tailwind CSS v3 frontend; Node.js + Express backend; Anthropic SDK for Claude streaming.
- Design system is hand-drawn/sketchbook aesthetic — wobbly border-radius (inline styles), hard offset shadows, Kalam (headings) + Patrick Hand (body) fonts, dot-grid paper background.
- The 30-step framework and full system prompt are defined in CLAUDE.md and must be implemented verbatim in `client/src/utils/systemPrompt.js`.
- Claude model: `claude-sonnet-4-20250514` with streaming enabled.
- Vite proxies `/api` to `localhost:3001` to keep API key server-side.

## Constraints

- **API Key**: `ANTHROPIC_API_KEY` must never appear in client-side code — Express reads it from `.env`
- **Fonts**: Always Kalam (headings) or Patrick Hand (body) — never system fonts
- **Shadows**: Hard offset only (`4px 4px 0px 0px #2d2d2d`) — never soft/blurred
- **Borders**: Wobbly inline style always on primary elements — never `rounded-*` Tailwind classes
- **State**: Redux Toolkit slice only — no local component state for app data
- **Data fetching**: `useValidate` custom hook only — no `useEffect` for fetching
- **Streaming**: Always stream — never wait for full response before rendering

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Express backend proxy for Claude API | Keep API key server-side; client never touches Anthropic directly | — Pending |
| Redux Toolkit for all app state | Prevents prop drilling; slice manages idea/status/result/error | — Pending |
| Streaming via ReadableStream | UX depends on progressive rendering; full response wait is too slow | — Pending |
| Tailwind CSS v3 with custom config | Extended tokens for design system colours, fonts, shadows | — Pending |
| No auth/database for v1 | Single-purpose tool; complexity not justified until validated | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-21 after initialization*
