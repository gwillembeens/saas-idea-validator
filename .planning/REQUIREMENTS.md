# Requirements: SaaS Idea Validator

**Defined:** 2026-03-21
**Core Value:** A founder pastes an idea and gets an honest, investor-grade analysis in under a minute, streamed live with a visual scorecard.

## v1 Requirements

### Backend

- [ ] **BACK-01**: Express server starts on port 3001 and serves the `/api/validate` route
- [ ] **BACK-02**: POST `/api/validate` reads `ANTHROPIC_API_KEY` from server `.env` — key never exposed to client
- [ ] **BACK-03**: POST `/api/validate` validates that `idea` body field is present and at least 20 characters, returning 400 on failure
- [ ] **BACK-04**: POST `/api/validate` streams Claude's response as `text/event-stream` using Anthropic SDK `.stream()`
- [ ] **BACK-05**: Vite dev server proxies `/api` requests to `http://localhost:3001`

### State

- [ ] **STATE-01**: Redux store initialised with `validatorSlice` managing `idea`, `status` (`idle|loading|streaming|done|error`), `result`, and `error`
- [ ] **STATE-02**: Slice exports `setIdea`, `startValidation`, `startStreaming`, `appendResult`, `finishValidation`, `setError`, and `reset` actions

### Streaming Hook

- [ ] **HOOK-01**: `useValidate` hook sends POST to `/api/validate`, reads response body as `ReadableStream`, and dispatches `appendResult` on each decoded chunk
- [ ] **HOOK-02**: Hook dispatches `startValidation` → `startStreaming` → `finishValidation` lifecycle actions (or `setError` on failure)

### Validator Components

- [ ] **COMP-01**: `IdeaInput` renders a full-width textarea that dispatches `setIdea` and a submit button that calls `validate()`; button disabled while `status` is `loading` or `streaming`
- [ ] **COMP-02**: `ResultsPanel` renders `result` markdown progressively using `react-markdown` as chunks arrive; shows loading skeleton while `status` is `loading`
- [ ] **COMP-03**: `Scorecard` calls `parseScores(result)` and renders four phase rows each with a `ScoreBar` (1–5 filled circles) and weighted total
- [ ] **COMP-04**: `VerdictBadge` displays a colour-coded pill (`Strong Signal` / `Promising` / `Needs Work` / `Too Vague`) derived from the weighted score

### Parse Utility

- [ ] **PARSE-01**: `parseScores(markdown)` extracts four phase scores from the scorecard table and returns `{ phase1, phase2, phase3, phase4, weighted }` — returns `null` on parse failure (graceful fallback to raw markdown)

### Design System

- [ ] **DESIGN-01**: `tailwind.config.js` extends config with `paper`, `pencil`, `muted`, `accent`, `blue`, `postit` colours; `heading`/`body` font families; `wobbly`/`wobblyMd` border-radius tokens; `hard`/`hardLg`/`hardSm`/`hardRed` box-shadow tokens
- [ ] **DESIGN-02**: Google Fonts loaded in `index.html`: Kalam 700 (headings, `font-heading`) and Patrick Hand 400 (body/inputs/buttons, `font-body`)
- [ ] **DESIGN-03**: `AppShell` renders dot-grid paper background (`#fdfbf7` with `radial-gradient(#e5e0d8 1px, transparent 1px)` at 24px repeat)
- [ ] **DESIGN-04**: `Button` component supports `primary` and `secondary` variants with wobbly inline border-radius, hard offset shadow, and press-flat active state
- [ ] **DESIGN-05**: `Card` component accepts `decoration` (`tape|tack|none`) and `rotate` props with wobbly border-radius and hard shadow
- [ ] **DESIGN-06**: `TextArea` component uses full wobbly border, Patrick Hand font, no resize handle, blue focus ring
- [ ] **DESIGN-07**: `ScoreBar` renders 5 circles (filled = `#2d2d2d`, empty = `muted`) with hard shadow on filled; row rotated -1deg
- [ ] **DESIGN-08**: `Arrow` and `Squiggle` decorative SVG components render hand-drawn connectors; hidden on mobile (`hidden md:block`)

## v2 Requirements

### Distribution & Sharing

- **SHARE-01**: User can copy a shareable link to a completed validation report
- **SHARE-02**: User can download report as PDF

### History

- **HIST-01**: App stores the last N validations in localStorage for quick retrieval
- **HIST-02**: User can view and re-open previous validations

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication | Single-use tool — sessions add complexity with no v1 value |
| Database / persistence | No history needed in v1 |
| Deployment / hosting | Local only for v1 |
| Mobile app | Web-first; sketchbook design works on desktop |
| Real-time collaboration | Single-user tool |
| OAuth / social login | No auth layer in v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BACK-01 | Phase 2 | Pending |
| BACK-02 | Phase 2 | Pending |
| BACK-03 | Phase 2 | Pending |
| BACK-04 | Phase 2 | Pending |
| BACK-05 | Phase 2 | Pending |
| STATE-01 | Phase 3 | Pending |
| STATE-02 | Phase 3 | Pending |
| HOOK-01 | Phase 3 | Pending |
| HOOK-02 | Phase 3 | Pending |
| COMP-01 | Phase 4 | Pending |
| COMP-02 | Phase 4 | Pending |
| COMP-03 | Phase 5 | Pending |
| COMP-04 | Phase 5 | Pending |
| PARSE-01 | Phase 5 | Pending |
| DESIGN-01 | Phase 4 | Pending |
| DESIGN-02 | Phase 4 | Pending |
| DESIGN-03 | Phase 4 | Pending |
| DESIGN-04 | Phase 4 | Pending |
| DESIGN-05 | Phase 4 | Pending |
| DESIGN-06 | Phase 4 | Pending |
| DESIGN-07 | Phase 5 | Pending |
| DESIGN-08 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Traceability updated: 2026-03-21 after roadmap creation*
