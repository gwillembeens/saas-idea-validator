# Phase 16: Niche Auto-Detection - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

After validation completes, make a secondary Claude API call to classify the idea into one of 7 fixed niche categories. Persist the niche to the database. Display a niche pill on the result page and history cards.

Niches: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other.

This phase does NOT include: leaderboard filtering by niche (Phase 18), public/private toggle (Phase 17), or any user-facing niche selection.

</domain>

<decisions>
## Implementation Decisions

### Secondary Claude call
- **D-01:** Fire niche detection async, fire-and-forget, at the same time as `generateAITitle` — both triggered after the save endpoint inserts the row
- **D-02:** Input = idea text + result markdown; `max_tokens=10`; prompt requests exactly one niche from the 7 fixed values
- **D-03:** Parse failure defaults silently to `'Other'` — never surfaces to the user

### Database
- **D-04:** Add `niche VARCHAR(50) DEFAULT 'Other'` column to `saved_results` table via migration
- **D-05:** After niche detection, `UPDATE saved_results SET niche = $1 WHERE id = $2` (same pattern as title update)

### Client — fresh validation view
- **D-06:** Niche pill is absent during the live streaming view (fresh validation); no placeholder, no polling
- **D-07:** Niche surfaces only when fetching from `GET /api/history/:id` — the async call will have completed by then for revisits

### Niche pill visual design
- **D-08:** Single uniform style for all 7 niches — no per-niche color coding
- **D-09:** Filled background pill: `muted` bg (`#e5e0d8`) + `pencil` border (`#2d2d2d`), `font-body text-xs`, same visual weight as verdict pill
- **D-10:** Text = niche label only (e.g., "Fintech", "Other")

### Result page placement
- **D-11:** Standalone niche pill row positioned between IdeaSummaryCard and Scorecard — not embedded inside any card
- **D-12:** Appears on both owner view and public/shared result pages (`/history/:id`)
- **D-13:** Only renders when niche is present — omitted entirely if null

### History card placement
- **D-14:** Niche pill sits in the same footer row as the verdict pill (left side, after verdict)
- **D-15:** Same size as the verdict pill (`text-xs`, same padding)
- **D-16:** If niche is null/absent, render nothing — no placeholder
- **D-17:** Hidden on mobile, visible `md:` and above (`hidden md:inline-flex` or equivalent)

### Claude's Discretion
- Exact prompt wording for niche classification call
- Whether to combine `generateAITitle` and `generateNiche` into one helper file or keep separate functions in `history.js`
- Exact Tailwind classes for the standalone niche row on result page

</decisions>

<specifics>
## Specific Ideas

- The niche call should be very tight — `max_tokens=10` means the response must be a single word or short phrase. Prompt must constrain Claude to return exactly one value from the list with no preamble.
- Niche pill on history cards hides on mobile to avoid crowding the footer row (verdict pill + date + delete button already fill it).
- The standalone niche row on the result page should feel like a quiet metadata label — not a prominent UI element. Small pill, left-aligned or centered, low visual weight.

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### ROADMAP phase definition
- `.planning/ROADMAP.md` §Phase 16 — Success criteria (4 items), requirement IDs NICHE-01/02/03

### Existing patterns to follow
- `server/routes/history.js` — `generateAITitle` function (lines 49–66): exact async fire-and-forget pattern to replicate for niche detection
- `client/src/components/history/HistoryCard.jsx` — footer row structure where niche pill slots in
- `client/src/components/validator/IdeaSummaryCard.jsx` — card after which the standalone niche row appears on result page

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/routes/history.js` → `generateAITitle(resultId, ideaText, userId)`: niche detection is the same shape — async function, Claude call, UPDATE query. Extract pattern directly.
- `client/src/components/history/HistoryCard.jsx` → verdict pill (lines 70–74): niche pill uses identical markup, just different label and neutral color
- `client/src/components/ui/Card.jsx`: niche standalone row on result page does NOT use Card — it's a bare `<div>` with a pill

### Established Patterns
- Async secondary Claude calls: fire after INSERT, no await, catch errors silently — already proven with `generateAITitle`
- Pill style: `px-3 py-1 font-body text-xs rounded border` — verdict pill classes; niche pill matches this exactly, different bg/border colors
- Redux state for history items already carries `scores`, `title`, `idea_text` — `niche` field needs to be added to list and detail responses

### Integration Points
- `POST /api/history` (saveResultRoute): add `generateNiche(result.id, idea_text, markdown_result)` call alongside existing `generateAITitle` call
- `GET /api/history` (listHistoryRoute): add `niche` to SELECT columns
- `GET /api/history/:id` (getResultRoute): add `niche` to SELECT columns and response
- `client/src/store/slices/historySlice.js` (or equivalent): niche field needs to flow through to components
- `ResultPage.jsx`: render standalone niche row between IdeaSummaryCard and Scorecard when `niche` is present

</code_context>

<deferred>
## Deferred Ideas

- Leaderboard filtering by niche — Phase 18
- User-selectable niche override — not in roadmap, add to backlog if desired
- Per-niche color coding — explicitly ruled out (D-08); if desired later, add as backlog item

</deferred>

---

*Phase: 16-niche-auto-detection*
*Context gathered: 2026-03-22*
