# Phase 20: User Profiles — Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Public-facing `/profile/:username` page showing display name, initials avatar, public validations grid, stats, and revision chains grouped by idea lineage. `/settings` page for username/display name management. No image upload. No private-to-public toggle here (that's Phase 17). No social features (follow, likes) — those are deferred.

</domain>

<decisions>
## Implementation Decisions

### A — Settings page
- Standalone `/settings` route (not a modal or drawer)
- Two fields: **display name** (always editable) and **username** (editable until first save, then locked)
- Locked username renders as a muted read-only input with a lock icon and "cannot be changed" note beneath it
- Single save button; no tabs or sections
- NavBar gets a "Settings" link for logged-in users (alongside existing History link)

### B — Profile page layout
- **Header:** initials avatar (large, 64px) + display name + `@username` + stat row
- **Stat row:** total public validations · average weighted score · top niche (by frequency) · personal best score
- **Body:** responsive 2-col grid of read-only validation cards (same shape as HistoryCard, no edit/delete/context menu)
- Private validations are hidden entirely — not shown as locked placeholders
- Empty state: "No public validations yet." shown when count is 0
- **Revision chains section** rendered below the grid, only if the user has any linked chains

### C — Revision chain display
- Show the **full sequence** for each lineage: v1 → v2 → v3 (not per-result snippets)
- **Score delta visible inline** on each step: `+0.5` (green) / `-0.3` (red) / `±0.0` (muted) relative to the previous version
- Show **all versions** — no collapsing (chains are expected to be short in practice)
- Grouped by **idea lineage** on the profile page: one block per root idea, full chain rendered under it
- Each version is a clickable link to `/history/:id`
- Visual style: horizontal arrow connectors between version pills (→), sketchbook aesthetic

### D — Avatar
- **Initials badge:** first letter of display name; fallback to `?` if display name not set
- **Color:** deterministic from username via simple hash → one of 6 palette colors (cycling through paper-adjacent tones that contrast with pencil border)
- **Sizes:** 64px circle in profile header; 28px in NavBar for the logged-in user indicator
- **Style:** hard border (2px pencil), slight rotation (-1deg), matches sketchbook aesthetic
- **Placement:** profile page header + NavBar only — not retrofitted onto HistoryCards or LeaderboardCards

### Backend routes needed
- `GET /api/profile/:username` — public, returns display name, username, stats, public validations, revision chains; 404 if username not found
- `GET /api/me` (or extend existing auth endpoint) — returns current user's display name + username for settings pre-fill
- `PATCH /api/me/settings` — updates display name and/or username (username only if currently null)

</decisions>

<specifics>
## Specific Ideas

- Username locked after first save — no re-use, no changes. Show "cannot be changed" note as a gentle warning *before* they save, so they don't set it by accident.
- The revision chain on the profile page should feel like a changelog — each version pill shows the score, clicking goes to the full result.
- Avatar color should be consistent: same username always gets same color across all sessions.

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Requirements
- `.planning/REQUIREMENTS.md` §PROF-01 through PROF-05 — all 5 profile requirements

### Prior phase decisions that affect this phase
- `.planning/phases/18-public-leaderboard/18-CONTEXT.md` — username column added to `users` table; leaderboard already links to `/profile/:username`
- `.planning/phases/19-idea-versioning/19-CONTEXT.md` — `parent_id` / `suggested_parent_id` on `saved_results`; chain storage strategy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `client/src/components/ui/NichePill.jsx` — reuse `size="sm"` variant for top niche stat and validation cards
- `client/src/components/leaderboard/LeaderboardCard.jsx` — read-only card pattern to adapt for profile validation grid
- `client/src/components/ui/Card.jsx` — wobbly card wrapper for profile sections
- `client/src/utils/fetchWithAuth.js` — use for authenticated settings PATCH
- `client/src/components/history/HistoryCard.jsx` — source for read-only validation card shape

### Established Patterns
- Route registration: `App.jsx` — add `/profile/:username` and `/settings` routes here
- NavBar links: currently `Leaderboard | Framework | History | Sign Out` for logged-in — add `Settings`
- Wobbly border-radius inline style (not Tailwind classes) — required for all primary elements
- Hard offset shadow: `shadow-hard` (4px 4px 0px 0px #2d2d2d)
- `fetchWithAuth` for authenticated calls; plain `fetch` for public profile endpoint (no auth required)
- Server route registration: `server/index.js` — add new routes here

### Integration Points
- `server/db/init.js` — needs `display_name VARCHAR(100)` migration on `users` table (username already exists from Phase 18)
- `server/routes/` — new `profile.js` route file for `GET /api/profile/:username`; extend auth routes or add `settings.js` for `PATCH /api/me/settings`
- `client/src/store/slices/authSlice.js` — may need `displayName` added to user state so NavBar can show it

</code_context>

<deferred>
## Deferred Ideas

- Follow / subscribe to a user — social features, future milestone
- Profile bio / "about me" text — v3.0
- Notification when someone's revision scores higher — v3.0 (noted in Phase 19 context)
- Username change after lock — not in scope, ever (by design)
- Private validation count shown as locked placeholder — kept it simple, hidden entirely for now

</deferred>

---

*Phase: 20-user-profiles*
*Context gathered: 2026-03-22*
