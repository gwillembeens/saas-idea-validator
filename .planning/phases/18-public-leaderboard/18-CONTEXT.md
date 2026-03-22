---
phase: 18
name: Public Leaderboard
status: context_complete
created: "2026-03-22"
requirements: [LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05]
---

# Phase 18 — Context

Decisions locked through discussion. Downstream planner must not re-ask these.

---

## A — Author Display

**Decision:** Add a nullable `username VARCHAR(50) UNIQUE` column to the `users` table as part of Phase 18's DB migration. The leaderboard card shows `username` if set, falls back to `"Anonymous"` if null. No email is ever surfaced publicly.

**Rationale:** Phase 20 adds the settings UI to set username, but pre-adding the column now means leaderboard attribution works correctly from day one — no backfill or re-deploy needed after Phase 20.

**Migration:** `ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE` — idempotent, added to `runMigrations()` in `server/db/init.js`.

**Backend query:** Leaderboard route JOINs `saved_results` with `users` on `user_id` to fetch `username`. Returns `author_username` (nullable) in response payload.

**LEAD-05 note:** Clicking author navigates to `/profile/:username` — but if username is null, the click target is disabled/absent (profile page is Phase 20). Do not link to a profile that doesn't exist yet.

---

## B — Niche Filter Widget

**Decision:** Pill row displayed above the card list. On mobile, the row is `overflow-x-auto` horizontal scroll (single-finger swipe). Pills: "All" + 8 niches = 9 total.

**State:** Active niche reflected in URL param (`?niche=Fintech`). Component reads from `useSearchParams`. On mount, read URL param and apply. On pill click, update URL param (replaces history entry).

**Data fetching:** Server-side re-fetch on filter change. Backend accepts `?niche=Fintech` query param and adds `AND niche = $2` to the leaderboard query. "All" (no param) returns unfiltered.

**No Redux for filter state** — URL param is the source of truth. No leaderboard filter slice needed.

---

## C — Pagination

**Decision:** Infinite scroll, 20 items per page. Reuse the IntersectionObserver sentinel pattern from `HistoryPage.jsx` verbatim.

**Own-entry highlighting:** When a logged-in user's own entry appears in the leaderboard list, show a subtle `"You"` label (e.g. small pill or badge) on the card. Determined by comparing `entry.user_id` to Redux `auth.user.id`.

**Ranking numbers:** Show absolute rank (#1, #2, #3...) alongside each card. Since infinite scroll loads in pages, rank = `(page * 20) + index + 1`.

---

## D — NavBar

**Decision:** "Leaderboard" link is always visible in the NavBar — for both logged-in and logged-out users. Sits in the same row as Framework and History.

**Logged-out nav layout:** `Leaderboard | Framework | Sign In`
**Logged-in nav layout:** `Leaderboard | Framework | History | Sign Out`

**Unauthenticated CTA on leaderboard page:** A banner/card above the leaderboard (visible only when not logged in) with copy along the lines of: *"Think yours can beat these? Validate your idea and see where YOU rank."* — CTA button navigates to `/` (the validate flow). Emphasis on "YOU" / "yours" to drive personal motivation.

**Active state:** NavBar shows Leaderboard link even when the user is currently on `/leaderboard`. No hiding.

---

## Code Context — Reusable Assets

| Asset | Location | How to reuse |
|-------|----------|--------------|
| `NichePill` | `client/src/components/ui/NichePill.jsx` | Use `size="sm"` on leaderboard cards |
| `Card` | `client/src/components/ui/Card` | Leaderboard entry card wrapper |
| `AppShell` | `client/src/components/layout/AppShell.jsx` | Page wrapper |
| `HistoryPage` infinite scroll | `client/src/pages/HistoryPage.jsx` lines 61–75 | Copy IntersectionObserver sentinel pattern |
| `listHistoryRoute` score query | `server/routes/history.js` lines 123–131 | Base for leaderboard query (`is_public = true`, remove `user_id` filter, add optional niche filter, JOIN users) |
| `optionalAuth` middleware | `server/middleware/optionalAuth.js` | Leaderboard route uses this (no login required) |
| `getVerdictColor` / `getVerdictLabel` | `client/src/components/history/HistoryCard.jsx` lines 8–20 | Extract to shared util or copy for leaderboard card |
| `NICHE_CONFIG` | `client/src/constants/nicheConfig.js` | Pill row uses niche list from here |

---

## New Files Required

**Backend:**
- `server/routes/leaderboard.js` — `GET /api/leaderboard` with `?niche=` and `?page=` params
- Register route in `server/index.js` with `optionalAuth`

**Frontend:**
- `client/src/pages/LeaderboardPage.jsx` — page component
- `client/src/components/leaderboard/LeaderboardCard.jsx` — entry card (idea preview, score, author, niche, rank, "You" badge)
- `client/src/hooks/useLeaderboard.js` — fetch + infinite scroll logic
- Route `/leaderboard` added to `App.jsx`
- NavBar updated to show Leaderboard link always

**No new Redux slice needed** — leaderboard state is local to the hook (URL param drives filter, local state drives page/items).

---

## Out of Scope for Phase 18

- Profile page `/profile/:username` — Phase 20
- Challenge cards — Phase 21
- Author link when username is null — disabled, not rendered
- Username settings UI — Phase 20
- Weekly/monthly snapshots — v3.0
