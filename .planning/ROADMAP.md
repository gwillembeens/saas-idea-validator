# Roadmap: SaaS Idea Validator

**Milestone:** v1 — Local Validator MVP
**Goal:** Founder pastes idea → gets streamed validation report with visual scorecard

---

## Phases

### Phase 1: Project Scaffold ✓ Complete (2026-03-21)
**Goal:** Set up monorepo structure, package management, env config, and version control foundation

**Requirements:** BACK-01, BACK-02, BACK-05 (prerequisites)

**Success criteria:**
1. ✓ Monorepo root with `server/` and `client/` directories
2. ✓ Server `package.json` with Express, Anthropic SDK, dotenv, cors dependencies installed
3. ✓ Client `package.json` with Vite, React, Redux Toolkit, react-markdown, lucide-react, Tailwind CSS installed
4. ✓ `server/.env` template with `ANTHROPIC_API_KEY` and `PORT=3001` (never committed)
5. ✓ `.gitignore` excludes `.env`, `node_modules/`, dist, build artifacts
6. ✓ Git repo initialized with clean history

---

### Phase 2: Backend Express Server
**Goal:** Implement Express server with `/api/validate` endpoint that streams Claude responses securely

**Requirements:** BACK-01, BACK-02, BACK-03, BACK-04, BACK-05

**Success criteria:**
1. `server/index.js` starts Express on port 3001, reads `PORT` from `.env`
2. `POST /api/validate` route validates `idea` field: minimum 20 chars, returns 400 on failure
3. Route reads `ANTHROPIC_API_KEY` from `process.env`, never logged or exposed
4. Route calls Anthropic SDK `client.messages.stream()` with system prompt and idea
5. Response streams as `text/event-stream` with proper headers (`Content-Type`, `Cache-Control`, `Connection`)
6. Client can fetch `/api/validate` and receive streamed response via `ReadableStream`
7. Server runs and accepts requests without errors

---

### Phase 3: Redux Store & Streaming Hook
**Goal:** Implement Redux slice for app state and custom hook for streaming fetch logic

**Requirements:** STATE-01, STATE-02, HOOK-01, HOOK-02

**Success criteria:**
1. `validatorSlice` reducer with initial state: `{ idea: '', status: 'idle', result: '', error: null }`
2. Slice exports all 7 actions: `setIdea`, `startValidation`, `startStreaming`, `appendResult`, `finishValidation`, `setError`, `reset`
3. Redux store initialized in `client/src/store/index.js` with validatorSlice
4. `useValidate` hook connects to Redux store and returns `{ idea, status, result, error, validate }`
5. `validate()` function sends POST to `/api/validate`, reads body as `ReadableStream`
6. Hook dispatches `startValidation` → `startStreaming` → `appendResult` (on each chunk) → `finishValidation`
7. Hook dispatches `setError` on network or parse failure
8. Unit tests verify action dispatch sequence and hook state management

---

### Phase 4: Frontend Components & Design System (in_progress)
**Goal:** Build React UI components with hand-drawn design system (colors, fonts, shadows, borders)

**Requirements:** DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06, COMP-01, COMP-02

**Plan 04-01 ✓ Complete (2026-03-21)**
- `tailwind.config.js` extends with custom colors (`paper`, `pencil`, `muted`, `accent`, `blue`, `postit`), font families (`heading`, `body`), border-radius tokens (`wobbly`, `wobblyMd`), shadow tokens (`hard`, `hardLg`, `hardSm`, `hardRed`)
- `index.html` loads Google Fonts: Kalam 700 and Patrick Hand 400
- `AppShell` renders dot-grid paper background with correct radial gradient and 24px repeat

**Plan 04-02 ✓ Complete (2026-03-21)**
- ✓ `Button` component (primary & secondary) with wobbly inline border-radius, hard shadow, hover/active states
- ✓ `Card` component with decoration prop (`tape|tack|none`), wobbly border-radius, rotate prop
- ✓ `TextArea` component with full wobbly border, Patrick Hand font, blue focus ring, no resize
- ✓ `ScoreBar` component with 5-circle rating display, filled/empty states, hard shadows

**Plan 04-03 ✓ Complete (2026-03-21)**
- ✓ `IdeaInput` component with textarea + submit button, dispatches `setIdea` and `validate()`, button disabled while status is `loading|streaming`
- ✓ `ResultsPanel` renders streamed markdown using react-markdown, updates as chunks arrive, shows loading skeleton while `loading`
- Connected to Redux validator slice, design system applied

**Plan 04-04 (pending)**
- `Scorecard` component with visual phase scores and weighted total
- `VerdictBadge` component with color-coded verdict pill
- `parseResult` utility to extract scores from markdown
- `Arrow` and `Squiggle` decorative components
- All text uses `text-pencil` color, never pure black
- Design system visually cohesive across all components

---

### Phase 5: Validator Logic & Scorecard ✓ Complete (2026-03-21)
**Goal:** Parse streamed response and render visual scorecard with scores and verdict

**Requirements:** PARSE-01, COMP-03, COMP-04, DESIGN-07, DESIGN-08

**Plan 05-01 ✓ Complete (2026-03-21)**
- ✓ `parseScores(markdown)` utility with regex `/\|\s*([\d.]+)\/5\s*\|/g`, extracts 4 phase scores, calculates weighted total (30% + 25% + 35% + 10%), returns object or null
- ✓ `Arrow` decorative SVG component with wobbly shaft, arrowhead, directional rotation, hidden on mobile
- ✓ `Squiggle` decorative SVG component with quadratic Bézier wave, directional rotation, hidden on mobile

**Plan 05-02 ✓ Complete (2026-03-21)**
- ✓ `Scorecard` component calls `parseScores` and renders four phase rows with labels, scores, and `ScoreBar`
- ✓ `ScoreBar` renders 5 circles: filled (pencil black) + hard shadow, empty (muted), row rotated -1deg
- ✓ `Scorecard` displays weighted total at bottom
- ✓ `VerdictBadge` maps weighted score to colour-coded pill with emoji:
   - ✓ 4.5–5.0: green → "🟢 Strong Signal"
   - ✓ 3.5–4.4: yellow → "🟡 Promising"
   - ✓ 2.5–3.4: orange → "🟠 Needs Work"
   - ✓ 1.0–2.4: red → "🔴 Too Vague"
- ✓ Graceful fallback: if parsing fails, `Scorecard` shows raw markdown without visual rendering
- ✓ Full Redux integration via `useSelector`

**Success criteria:**
1. `parseScores(markdown)` extracts 4 phase scores from scorecard table regex, calculates weighted total (30% + 25% + 35% + 10%), returns `{ phase1, phase2, phase3, phase4, weighted }` or `null`
2. Graceful fallback: if parsing fails, `Scorecard` shows raw markdown without visual rendering
3. `Scorecard` component calls `parseScores` and renders four phase rows with labels, scores, and `ScoreBar`
4. `ScoreBar` renders 5 circles: filled (pencil black) + hard shadow, empty (muted), row rotated -1deg
5. `Scorecard` displays weighted total at bottom
6. `VerdictBadge` maps weighted score to colour-coded pill with emoji:
   - 4.5–5.0: green → "🟢 Strong Signal"
   - 3.5–4.4: yellow → "🟡 Promising"
   - 2.5–3.4: orange → "🟠 Needs Work"
   - 1.0–2.4: red → "🔴 Too Vague"
7. `Arrow` and `Squiggle` decorative SVGs render hand-drawn connectors, hidden on mobile
8. Integration test: parse Claude response → extract scores → render scorecard with correct visual representation

---

### Phase 6: Responsive Layout & Polish
**Goal:** Assemble all components into cohesive page layout and ensure responsive design

**Requirements:** (All previous phases + responsive polish)

**Success criteria:**
1. `App.jsx` assembles `AppShell` → `IdeaInput` → `ResultsPanel` + `Scorecard` + `VerdictBadge`
2. Layout: mobile-first, single column, expands to grid at `md:` breakpoint
3. Section padding consistent: `py-20`
4. Decorative SVGs hidden on mobile (`hidden md:block`)
5. Wobbly borders and handwritten fonts visible at all screen sizes
6. Text hierarchy correct: headings `text-5xl md:text-6xl` (hero), `text-3xl md:text-4xl` (sections), `text-lg md:text-xl` (body)
7. Button sizing: minimum `h-12` for touch targets
8. End-to-end test: user pastes idea → submit → stream arrives → scorecard parses → visual scorecard renders correctly
9. No console errors, warnings, or accessibility violations (axe scan)
10. Design system visually cohesive, matches hand-drawn aesthetic across all pages

---

### Phase 7: Integration Testing & Deployment Ready
**Goal:** Full end-to-end validation, documentation, and local deployment verification

**Requirements:** All v1 requirements (BACK-01 through DESIGN-08, PARSE-01)

**Success criteria:**
1. End-to-end test: paste realistic startup idea → submit → response streams → scorecard renders with numeric scores and verdict badge
2. System prompt injected correctly into Claude API call (verbatim from `systemPrompt.js`)
3. Error handling: bad input (< 20 chars) → 400 error with user-facing message
4. Network error handling: fetch failure → `setError` dispatched, error displayed in UI
5. Parse failure graceful: if regex doesn't match, raw markdown still displays (no crash)
6. Performance: stream latency <200ms per chunk, no UI blocking during streaming
7. `.env` template documented in README or setup guide
8. Both servers run simultaneously (server on 3001, client dev server on 5173) without conflicts
9. All requirements traced to phases in REQUIREMENTS.md traceability table
10. Ready for founder to use locally: `npm install && npm run dev` works end-to-end

---

## Milestone Success Criteria

**v1 is done when:**

1. **Core flow works:** Founder pastes idea → hits "Validate" → streams result → scores render visually
2. **All 22 v1 requirements passing:** Backend, Redux, hook, components, design system, parsing all implemented
3. **Responsive across devices:** Mobile, tablet, desktop layouts all functional
4. **Design system cohesive:** Hand-drawn aesthetic applied uniformly (fonts, shadows, borders, colors)
5. **Error handling robust:** Bad input, network failure, parse failure all handled gracefully
6. **Documentation clear:** CLAUDE.md, REQUIREMENTS.md, ROADMAP.md, and state files up to date
7. **Local deployment verified:** User can clone, `npm install`, `npm run dev`, and validate an idea in <1 minute

---

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
| COMP-01 | Phase 4 | Done (04-03) |
| COMP-02 | Phase 4 | Done (04-03) |
| COMP-03 | Phase 5 | Done (05-02) |
| COMP-04 | Phase 5 | Done (05-02) |
| PARSE-01 | Phase 5 | Done (05-01) |
| DESIGN-01 | Phase 4 | Done (04-01) |
| DESIGN-02 | Phase 4 | Done (04-01) |
| DESIGN-03 | Phase 4 | Done (04-01) |
| DESIGN-04 | Phase 4 | Done (04-02) |
| DESIGN-05 | Phase 4 | Done (04-02) |
| DESIGN-06 | Phase 4 | Done (04-02) |
| DESIGN-07 | Phase 5 | Done (05-02) |
| DESIGN-08 | Phase 5 | Done (05-01) |

**Coverage:** v1 requirements: 22 total | Mapped to phases: 22 | Unmapped: 0 ✓

### Phase 8: Results layout redesign — Option A split cards

**Goal:** Provide alternative split-card layout for Claude's validation response (Idea Summary, Commentary, Verdict rendered as separate cards)
**Requirements**: Layout option, cleaner section separation, optional use in ResultsPanel
**Depends on:** Phase 7
**Status:** In Progress

**Plan 08-01 ✓ Complete (2026-03-21)**
- ✓ `parseSections` utility splits markdown by `## ` headings into { ideaSummary, commentary, verdict }
- ✓ `IdeaSummaryCard` component renders Idea Summary section with `decoration="tape"` `rotate={-1}`
- ✓ `VerdictCard` component renders Verdict section with `decoration="none"` `rotate={0}`
- ✓ `CommentaryCard` component renders Commentary section with `decoration="tape"` `rotate={1}`
- ✓ All cards use consistent markdownComponents (text-pencil, font-heading, font-body)
- ✓ Graceful fallback: return null for falsy markdown

**Plan 08-02 ✓ Complete (2026-03-21)**
- ✓ Streaming state: pulsing 3-dot bounce indicator ("Analysing your idea")
- ✓ Split-card layout: `ResultsPanel` integrates `parseSections` → renders VerdictBadge → IdeaSummaryCard → Scorecard → VerdictCard → CommentaryCard
- ✓ Animation: `animate-fadeIn` (300ms ease-out) applied to split-card wrapper
- ✓ `ResultsPanel` imports all Wave 1 components and utilities
- ✓ Graceful fallback: if `parseSections` fails, render raw markdown in single Card
- ✓ App.jsx cleanup: removed duplicate `Scorecard` and `VerdictBadge` renders

**Plan 08-03 (pending)**
- [ ] E2E tests: streaming → split-card flow, animation timing, fallback behavior
- [ ] Visual regression tests: card layouts, animation smoothness
- [ ] Cross-browser compatibility: fadeIn animation on Safari, Firefox, Chrome, Edge

### Phase 9: Authentication system — user registration and login ✅

**Goal:** Email/password auth + Google/GitHub OAuth + persistent sessions + auth-gated Validate action
**Requirements**: Auth gates Validate (not page), 30-day refresh token rotation, modal UX preserves idea text
**Depends on:** Phase 8
**Status:** complete
**Plans:** 3 plans (09-01 backend, 09-02 frontend, 09-03 integration)

Plans:
- [x] 09-01 — Backend: DB schema + 7 auth routes + JWT utils
- [x] 09-02 — Frontend: authSlice + AuthModal + SignInButton + useAuth hook
- [x] 09-03 — Integration: auth gate + OAuth flows + URL param handling

### Phase 10: Saved ideas — persist and browse validation history

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 9
**Plans:** 1/4 plans executed

Plans:
- [ ] TBD (run /gsd:plan-phase 10 to break down)

### Phase 11: improve UI across app

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 10
**Plans:** 0/4 plans executed

Plans:
- [ ] TBD (run /gsd:plan-phase 11 to break down)

### Phase 12: History Detail View

**Goal:** Clicking a row in the history list opens a detail page showing the full validation result (markdown) that was generated for that idea.
**Requirements**: TBD
**Depends on:** Phase 11
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 12 to break down)

---

*Roadmap updated: 2026-03-21*
*Phases: 8 | Completed: 7 | Plans total: 16 | Completed: 15 (08-02 just completed)*
