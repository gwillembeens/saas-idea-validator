---
phase: 25
title: "Feed"
type: research
---

# Phase 25 — Feed: Research

## Pattern: useLeaderboard → useFeed

**Hook Structure (from useLeaderboard.js):**

The useFeed hook should mirror useLeaderboard with these differences:

1. **State shape** (identical):
   - `items: []` — array of feed entries
   - `page: number` — current page (starts at 0)
   - `hasMore: boolean` — whether more pages exist
   - `loading: boolean` — fetch in progress
   - `error: string | null` — error message
   - `sentinelRef: ref` — IntersectionObserver target for infinite scroll

2. **Fetch function signature** (differs from leaderboard):
   ```js
   const fetchPage = useCallback(async (pageNum) => {
     // URL: /api/feed?page=${pageNum}
     // NO niche parameter (feed includes all niches)
     // credentials: 'include' (for auth cookie)
     // Returns: { entries, total, page, hasMore }
   }, [])
   ```

3. **Dependencies & re-fetch logic**:
   - useLeaderboard re-fetches when `currentNiche` or `currentSort` changes
   - useFeed has NO URL search params — fetches from page 0 on mount only
   - No `setNiche()` or `setSort()` functions needed
   - `loadMore()` still increments page and appends entries

4. **Return object**:
   ```js
   return { items, page, hasMore, loading, error, sentinelRef, loadMore }
   // NO setNiche, setSort, currentNiche, currentSort
   ```

5. **Cancellation**:
   - Same cancelled-flag pattern on initial load (cleanup race condition)
   - loadMore uses same gate: `if (loading || !hasMore || error) return`

---

## Pattern: LeaderboardPage → FeedPage

**FeedPage follows the same layout with key removals:**

1. **Page header**:
   - Heading: "Feed"
   - Subheading: Conditional label based on user state (see Area D)
     - Logged-in + has ≥1 validation: "✨ Personalised for you"
     - Logged-out OR no validations: "✨ Trending"

2. **Unauthenticated CTA banner**:
   - Show ONLY when logged out (`!user`)
   - Copy: "Sign in to personalise your feed based on the niches you validate in"
   - Uses `SignInButton` component (same pattern as leaderboard)
   - Position: between page header and feed cards

3. **Omit entirely**: ChallengeSection, sort tabs, niche filter pills

4. **Entry list**:
   - `items.map(item => <FeedCard key={item.id} {...item} />)`
   - No rank numbers — just cards full-width

5. **Loading skeleton**: 3 skeleton cards while loading

6. **Empty state** (zero public validations in DB):
   - `"No validations yet — be the first to share one"`
   - CTA button linking to `/` (home validator)

7. **Infinite scroll sentinel**: `ref={sentinelRef}` at bottom — identical to leaderboard

---

## Pattern: leaderboardRoute → feedRoute

**Route structure to follow:**

1. **Response shape** (identical):
   ```js
   { entries: [...], total: number, page: number, hasMore: boolean }
   ```

2. **Query parameters**: feed accepts ONLY `?page=N` (no niche filter, no sort)

3. **LIMIT & pagination**: same — `LIMIT 20` per page, `OFFSET = page * 20`

4. **Authentication**: optional — check `req.user?.id`, pass null if not logged in

5. **Entry SELECT columns**: same as leaderboard (idea_text, scores, niche, author_username, like_count, comment_count, created_at)

6. **ORDER BY**: `feed_score DESC` (computed in SQL, see below)

---

## FeedCard Primitives

**LikeButton** (`components/social/LikeButton.jsx`):
- Props: `{ resultId, initialLiked, initialCount, mode, onAuthRequired }`
- Use `mode="compact"` on FeedCard footer
- onClick stops propagation (no card navigation)

**CommentCount** (`components/social/CommentCount.jsx`):
- Props: `{ count, onClick, mode }`
- On FeedCard: display only, no onClick (no modal trigger on feed)
- Use `mode="compact"`

**NichePill** (`components/ui/NichePill.jsx`):
- Props: `{ niche, size, className }`
- Use `size="sm"` in footer

**Score badge**: Copy pattern from LeaderboardCard — render weighted score from `scores` JSON

---

## FeedCard Layout

```
┌─────────────────────────────────┐
│ Author link (or "Anonymous")    │
│ Idea preview (line-clamp-2)     │
│                                 │
│ [Score] [NichePill] ❤ N · 💬 N · Xh ago │
└─────────────────────────────────┘
```

- Clicking card → `navigate(/history/${id})`
- LikeButton interactive (stops propagation)
- CommentCount passive (no onClick)
- Time ago: inline string `"Xh ago"` or `"Xd ago"` computed from `created_at`

**Time ago helper** (inline in FeedCard or util):
```js
function timeAgo(createdAt) {
  const hours = Math.floor((Date.now() - new Date(createdAt)) / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
```

---

## NavBar Integration

**Required Changes** (from NavBar.jsx):

1. Add Feed link at the START (before Leaderboard):
   ```jsx
   <Link
     to="/feed"
     className={`font-body text-lg ${location.pathname === '/feed' ? 'text-accent' : 'text-blue'} hover:text-accent transition-colors`}
   >
     Feed
   </Link>
   ```

2. Apply same active-link pattern to ALL existing links (Leaderboard, Framework, History):
   ```jsx
   // Example for Leaderboard:
   className={`font-body text-lg ${location.pathname === '/leaderboard' ? 'text-accent' : 'text-blue'} hover:text-accent transition-colors`}
   ```

3. Framework hidden on mobile: add `hidden md:inline-flex` to Framework link

4. Final order:
   - Logged in: `Feed | Leaderboard | Framework | History | Bell | SignOut | Avatar`
   - Logged out: `Feed | Leaderboard | Framework | Sign In`

---

## App.jsx Route Registration

Add after existing routes:
```jsx
<Route path="/feed" element={<FeedPage />} />
```

Add import:
```jsx
import { FeedPage } from './pages/FeedPage'
```

---

## SQL for Feed Ranking

**Named constants** (top of feedRoute.js — tunable):
```js
const LIKE_WEIGHT = 1
const COMMENT_WEIGHT = 2
const DECAY_EXPONENT = 0.8
const NICHE_BOOST = 1.2
```

**Full query**:
```sql
SELECT
  sr.id,
  sr.idea_text,
  sr.scores,
  sr.niche,
  sr.user_id,
  u.username AS author_username,
  sr.created_at,
  (SELECT COUNT(*)::int FROM likes l WHERE l.result_id = sr.id) AS like_count,
  (SELECT COUNT(*)::int FROM comments c WHERE c.result_id = sr.id AND c.deleted_at IS NULL) AS comment_count
FROM saved_results sr
LEFT JOIN users u ON sr.user_id = u.id
WHERE sr.is_public = true
  AND sr.deleted_at IS NULL
ORDER BY (
  (
    (SELECT COUNT(*)::int FROM likes l2 WHERE l2.result_id = sr.id) * $3 +
    (SELECT COUNT(*)::int FROM comments c2 WHERE c2.result_id = sr.id AND c2.deleted_at IS NULL) * $4
  )::float
  / POWER(EXTRACT(EPOCH FROM (NOW() - sr.created_at))/3600.0 + 2, $5)
  * CASE
      WHEN $1::uuid IS NOT NULL
        AND sr.niche IN (
          SELECT sr2.niche
          FROM saved_results sr2
          WHERE sr2.user_id = $1
            AND sr2.deleted_at IS NULL
          GROUP BY sr2.niche
          ORDER BY COUNT(*) DESC
          LIMIT 3
        )
      THEN $6
      ELSE 1
    END
) DESC
LIMIT $7 OFFSET $8
```

Parameters: `[userId, /* unused */, LIKE_WEIGHT, COMMENT_WEIGHT, DECAY_EXPONENT, NICHE_BOOST, LIMIT, OFFSET]`

Simplify by inlining constants in JS and passing only `[userId, LIMIT, OFFSET]`:
```js
// Build ORDER BY with named constants inlined
const feedScoreExpr = `
  (
    (SELECT COUNT(*)::int FROM likes l2 WHERE l2.result_id = sr.id) * ${LIKE_WEIGHT} +
    (SELECT COUNT(*)::int FROM comments c2 WHERE c2.result_id = sr.id AND c2.deleted_at IS NULL) * ${COMMENT_WEIGHT}
  )::float
  / POWER(EXTRACT(EPOCH FROM (NOW() - sr.created_at))/3600.0 + 2, ${DECAY_EXPONENT})
  * CASE
      WHEN $1::uuid IS NOT NULL AND sr.niche IN (
        SELECT sr2.niche FROM saved_results sr2
        WHERE sr2.user_id = $1 AND sr2.deleted_at IS NULL
        GROUP BY sr2.niche ORDER BY COUNT(*) DESC LIMIT 3
      )
      THEN ${NICHE_BOOST}
      ELSE 1
    END
`
// Query params: [userId, LIMIT, OFFSET]  (userId may be null)
```

**Available columns** (from schema + migrations):
- `saved_results`: id, user_id, idea_text, scores (JSONB), niche, created_at, deleted_at, is_public
- `users`: id, username
- `likes`: result_id
- `comments`: result_id, deleted_at

---

## Auth in Feed Route

**Optional auth pattern**:
```js
export async function feedRoute(req, res) {
  const userId = req.user?.id || null  // null for logged-out users
  const pageNum = parseInt(req.query.page) || 0
  const offset = pageNum * PAGE_SIZE
  // ...
}
```

- Logged-out: `userId = null` → CASE WHEN evaluates false → multiplier = 1
- Logged-in: `userId = req.user.id` → niche subquery runs → matching niches get 1.2×

---

## Files to Create/Modify

**Create (new files):**
1. `server/routes/feedRoute.js` — feed ranking SQL, optional auth, pagination
2. `client/src/hooks/useFeed.js` — fetch hook mirroring useLeaderboard
3. `client/src/pages/FeedPage.jsx` — page layout
4. `client/src/components/feed/FeedCard.jsx` — card component

**Modify (existing files):**
1. `server/index.js` — mount `GET /api/feed` → feedRoute
2. `client/src/App.jsx` — add `/feed` route + import FeedPage
3. `client/src/components/layout/NavBar.jsx` — add Feed link + active-link styling on all links + Framework mobile hidden

**No changes needed:**
- LikeButton, CommentCount, NichePill, Card, Button (reuse as-is)
- useAuth (already provides user + validation count via authSlice)
