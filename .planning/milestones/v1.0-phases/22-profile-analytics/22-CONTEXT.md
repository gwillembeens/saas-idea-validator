# Phase 22: Profile Analytics - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the existing profile page (`/profile/:username`) with:
1. Activity heatmap (GitHub-style, 52-week calendar of active days)
2. Score trend chart (weighted score over last 20 validations)
3. Niche distribution (breakdown of validations per niche)
4. Streak stats (current streak + longest streak)

These analytics are added to the existing profile page below the RevisionChains section. No new pages or routes. All analytics are publicly visible to any visitor.

</domain>

<decisions>
## Implementation Decisions

### Heatmap
- **D-01:** Full year displayed (52 weeks × 7 days grid), regardless of activity density
- **D-02:** Metric = days with at least one validation submitted ("active days")
- **D-03:** Color scale uses design system colors (paper/muted/pencil shades — light to dark)
- **D-04:** Cell hover/tap reveals count only ("3 validations")
- **D-05:** Hand-rolled div grid (no heatmap library) — fits sketchbook aesthetic, avoids dependency
- **D-06:** Mobile: horizontal scroll on the heatmap container (do not truncate or hide)

### Score Trend Chart
- **D-07:** Line chart of weighted score for last 20 validations (chronological order, oldest → newest)
- **D-08:** Use **Recharts** library for the line chart
- **D-09:** If fewer than 2 data points, hide the chart entirely (no empty state needed)

### Niche Distribution
- **D-10:** Show all niches the user has validated in, with a count and CSS percentage bar
- **D-11:** Pure CSS bars (no chart library) — just percentage-width divs
- **D-12:** Sorted by count descending

### Streak Stats
- **D-13:** Show current streak (consecutive days ending today or yesterday) and longest streak ever
- **D-14:** Streak metric = validation submission days only (social actions deferred to Phase 23+)
- **D-15:** Displayed as two stat items inline, consistent with the existing stat bar style

### Layout & Data
- **D-16:** Analytics section sits **below RevisionChains** in the single-scroll page
- **D-17:** Section has a visible heading (e.g. "Activity" or "Analytics") — font-heading style
- **D-18:** Components stacked vertically in a single scroll (no tabs, no collapse)
- **D-19:** All analytics data returned from the **existing `profileRoute`** (`GET /api/profile/:username`) — no separate endpoint
- **D-20:** Heatmap data: `GROUP BY DATE(created_at)` query for 365 days of the user's public validations
- **D-21:** No caching — query runs on each profile load (scale not a concern at this stage)

### Claude's Discretion
- Exact Recharts configuration (axis labels, dot style, line color, tooltip format)
- Heatmap cell sizing and gap on desktop vs mobile
- Heading text ("Activity" vs "Analytics" vs "Stats")
- Streak computation: "yesterday" counts as active for current streak (don't break streak if user hasn't validated today yet)

</decisions>

<specifics>
## Specific Ideas

- Heatmap should feel hand-drawn / sketchbook — use muted/pencil color family, not green GitHub shades
- Streak display should match the existing StatItem component pattern (value above, label below)
- Score trend line: the trajectory matters more than exact values — keep the chart minimal, not dashboard-heavy
- This is early groundwork for a social analytics system; the heatmap will eventually include likes/comments/logins once Phase 23+ ships

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Existing code to read before planning/implementing
- `client/src/pages/ProfilePage.jsx` — current page structure, StatItem component, RevisionChains integration
- `server/routes/profile.js` — profileRoute implementation, stats computation pattern, query shape
- `client/src/components/ui/Avatar.jsx` — design system component pattern reference
- `client/src/components/ui/NichePill.jsx` — niche display pattern (reuse in niche distribution)
- `.planning/milestones/v1.0-phases/20-*/` — Phase 20 context for avatar/settings patterns
- `CLAUDE.md` §Design System — color tokens, shadow tokens, font rules, wobbly border-radius conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatItem` component (defined inline in ProfilePage.jsx): value + label column — reuse for streak display
- `NichePill`: renders niche name with muted bg + pencil border — reuse in niche distribution rows
- `AppShell`: page wrapper — already wrapping ProfilePage
- `profileRoute`: stats computed in JS from raw query results — follow same pattern for new stats

### Established Patterns
- Stats computed server-side in profileRoute, returned as flat object — add new stats fields to same response shape
- No charting libs currently installed — Recharts needs to be added to `client/package.json`
- Design system: inline `borderRadius` for wobbly borders, `shadow-hard` class, `font-heading`/`font-body`, `text-pencil` always
- Mobile-first: all new sections must work at 375px width

### Integration Points
- `profileRoute` response object: add `analytics: { heatmap, scoreTrend, nicheBreakdown, streaks }` field
- ProfilePage: import new analytics components, render below `<RevisionChains />`
- New components live in `client/src/components/profile/` (RevisionChains is already there)

</code_context>

<deferred>
## Deferred Ideas

- **Expand heatmap to social actions** (likes, comments, logins) — depends on Phase 23 (Social Interactions) and Phase 24 (Notifications). Revisit when those ship.
- **Separate analytics endpoint** (`GET /api/profile/:username/analytics`) — consider when analytics queries become slow at scale; not needed now.
- **Caching/memoization** of analytics data — not needed at current scale.

</deferred>

---

*Phase: 22-profile-analytics*
*Context gathered: 2026-03-23*
