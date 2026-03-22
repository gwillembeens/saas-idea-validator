# Phase 21: Challenge Cards - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a "Beat the Leaderboard" challenge section to the leaderboard page. One card per niche (8 total) showing the highest score achieved in that niche, with a CTA that navigates to `/validate` with a pre-filled idea stub. No new routes or backend endpoints beyond a query for top score per niche.

</domain>

<decisions>
## Implementation Decisions

### Card content
- **D-01:** Show niche name + top score in large type + label "Can you beat it?"
- **D-02:** Idea text is hidden — mystery is the point
- **D-03:** No author name, no date — keep it score-focused, not person-focused
- **D-04:** If a niche has no public validations yet, show card with "No score yet — be first!" instead of hiding it

### CTA behaviour
- **D-05:** Button label: "Try This Niche"
- **D-06:** Clicking navigates to `/` (home / validate page) and dispatches `setIdea` with a visible pre-filled stub: `"I'm building a [Niche] SaaS that..."` — user sees it and can edit before submitting
- **D-07:** No silent injection — what the user sees is what gets submitted
- **D-08:** No Redux niche pre-selection needed — the stub text makes the niche intent clear without requiring a separate state field

### Section placement & visibility
- **D-09:** Section sits between the unauthenticated CTA banner and the niche filter pills
- **D-10:** Visible to everyone — logged-in and logged-out alike; logged-out users see it as a signup/engagement hook
- **D-11:** "Hide if user is #1 in all niches" logic is deferred — too rare to build now
- **D-12:** Section heading: "Beat the Leaderboard" (font-heading, -1deg rotation)

### Layout
- **D-13:** Horizontal scrollable row of cards (not a grid) — same pattern as the niche filter pill row but larger cards
- **D-14:** Each card is compact: ~160px wide, niche icon + name at top, big score number in centre, "Can you beat it?" label below, CTA button at bottom
- **D-15:** Styling: wobbly borders, hard shadow, paper bg — matches existing Card component

### Claude's Discretion
- Exact card dimensions and typography scale
- Scroll indicator (fade edge) on the horizontal row
- Loading/skeleton state while top scores fetch
- Error state if leaderboard API fails

</decisions>

<specifics>
## Specific Ideas

- "Can you beat it?" as the challenge label — provocative, direct
- Pre-fill stub format: `"I'm building a [Niche] SaaS that..."` — user sees it, edits it, submits it
- Cards in a horizontal scroll row, not a grid — keeps the section compact and scannable

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Leaderboard page (integration target)
- `client/src/pages/LeaderboardPage.jsx` — Section inserts between CTA banner and niche filter pills
- `client/src/hooks/useLeaderboard.js` — Existing hook; may need companion `useNicheTopScores` hook or backend query extension
- `client/src/constants/nicheConfig.js` — 8 niches (Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, HRTech, Other) — one card per niche

### Validator integration
- `client/src/store/slices/validatorSlice.js` — `setIdea` action dispatched on CTA click to pre-fill textarea stub
- `client/src/pages/HomePage.jsx` — Navigate to `/` and the textarea will show the pre-filled idea

### Design system
- `CLAUDE.md` §Design System — wobbly borders, hard shadow, Patrick Hand font, paper bg
- `client/src/components/ui/Card.jsx` — Base card component; challenge cards may use or mirror this

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` component: accepts `decoration`, `rotate` props — usable as base for challenge cards
- `NichePill` + `NICHE_CONFIG`: already has icon + label per niche — use icons on challenge cards
- `Button` component: "Try This Niche" CTA reuses existing primary variant
- `useLeaderboard` hook: already fetches leaderboard data — top score per niche can be derived from first entry per niche group, or a new lightweight backend query

### Established Patterns
- Horizontal scroll rows: already used for niche filter pills — same `overflow-x-auto` + `flex gap-2` pattern
- Redux `setIdea` + `navigate('/')`: clean two-step CTA action, no new state needed
- Conditional section render: existing `{!user && (...)}` pattern in LeaderboardPage for the CTA banner

### Integration Points
- New `ChallengeSection` component mounts inside `LeaderboardPage` between CTA and filter pills
- Backend: either extend `/api/leaderboard` to return top-per-niche summary, or add `GET /api/leaderboard/top-per-niche` — one row per niche with highest weighted score

</code_context>

<deferred>
## Deferred Ideas

- Hide challenge section when user holds #1 in all niches — too rare, skip for now
- Animated "crown" icon on the card whose niche the user already leads — Phase 22+ polish
- Click on score to see the actual winning idea — conflicts with "idea text hidden" decision, defer

</deferred>

---

*Phase: 21-challenge-cards*
*Context gathered: 2026-03-23*
