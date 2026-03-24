# Plan 23-04 Summary — Frontend Wave 3: Profile ValidationsGrid + Leaderboard Sort

**Status:** COMPLETE ✓
**Commit:** `feat(23-04): ValidationsGrid, LeaderboardSort, sort param, heatmap fix`

## Tasks Completed

1. **ValidationsGrid** — `client/src/components/profile/ValidationsGrid.jsx` — 2-col grid, visibleCount=6, load-more, grid-level CommentModal state
2. **ProfilePage** — Inserted ValidationsGrid between RevisionChains and AnalyticsSection; added `total_likes_received` stat (conditional)
3. **ActivityHeatmap tooltip fix** — Changed "N validations" → "N actions" (more accurate since backend counts all user actions)
4. **LeaderboardSort** — `client/src/components/leaderboard/LeaderboardSort.jsx` — "Top Score" / "Most Liked" tab pills
5. **useLeaderboard** — Added `currentSort` from URL params, passes `sort` query to API, exposes `setSort()`, preserves niche when sorting
6. **LeaderboardPage** — Wired LeaderboardSort above niche filter; added per-card CommentModal state (`openCommentId`)
7. **LeaderboardCard** — Already had `onCommentClick` prop from Plan 23-02

## Key Decisions

- Sort state stored in URL (`?sort=likes`) for shareability, default is 'score' (omitted from URL)
- CommentModal state at grid level in ValidationsGrid (not per-card) avoids multiple React tree instances
- CommentModal state at page level in LeaderboardPage (same reasoning)
- `total_likes_received` rendered with guard (`> 0`) so new profiles don't show "0 likes received"
