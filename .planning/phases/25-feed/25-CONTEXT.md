---
phase: 25
title: "Feed"
status: context_complete
created: "2026-03-24"
---

# Phase 25 — Feed: Context

## Phase Goal

A personalised feed page at `/feed` surfacing public validations ranked by an engagement algorithm. Distinct from the leaderboard (score-sorted, static). Optimised for discovery and re-engagement.

**Requirements:** FEED-01, FEED-02, FEED-03

---

## Decision A — Feed Card Layout

**Decision:** New `FeedCard` component. Do NOT extend or wrap `LeaderboardCard`.

**Rationale:** LeaderboardCard has rank-number logic baked in. FeedCard has different footer content (time ago). Layouts will diverge — a new component reusing the same primitives is cleaner than mode-switching via props.

**Reused primitives:** `LikeButton`, `CommentCount`, `NichePill`, `Avatar`, `Card` (ui)

**Card content:**
- Author link (same as LeaderboardCard — link if username set, "Anonymous" if not)
- Idea preview (2 lines, `line-clamp-2`)
- Footer row: score badge | niche pill | `❤ N · 💬 N · Xh ago` (right-aligned)
- `LikeButton` interactive directly on card (stops propagation, no navigation)

**Visual distinction from leaderboard:** Page-level, not card-level.
- No rank numbers on feed cards
- Page header: "Feed"
- Sort label below header: "✨ Personalised for you" OR "✨ Trending" (see Area D)
- Same wobbly Card, same shadow, same fonts — consistency preserved

---

## Decision B — Ranking Algorithm

**Formula (server-side SQL):**
```
feed_score = (like_count * LIKE_WEIGHT + comment_count * COMMENT_WEIGHT)
             / POWER(age_hours + 2, DECAY_EXPONENT)
             * niche_multiplier
```

**Named constants (top of route file — tunable without formula changes):**
```js
const LIKE_WEIGHT = 1
const COMMENT_WEIGHT = 2
const DECAY_EXPONENT = 0.8
const NICHE_BOOST = 1.2
```

**Time decay:** Reddit-style, exponent 0.8. Posts stay visible ~3–5 days if they have engagement. The `+2` prevents brand-new posts dominating purely by recency.

**Comments vs likes:** Comments worth 2×. A comment requires reading + typing — stronger engagement signal.

**Niche affinity (logged-in only):**
- Query user's top 3 niches by their own validation count
- If post's niche matches any of those 3: multiply score by `NICHE_BOOST` (1.2)
- All 3 matching niches get equal boost (no frequency weighting)
- Logged-out users: `niche_multiplier = 1` (no boost)

**age_hours calculation:** `EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600`

---

## Decision C — NavBar Placement

**Nav order (logged in):** `Feed | Leaderboard | Framework | History | 🔔 | Sign Out | Avatar`

**Nav order (logged out):** `Feed | Leaderboard | Framework | Sign In`

**Feed visibility:** Both logged-in and logged-out users see the Feed link.

**Framework on mobile:** Hidden on mobile (`hidden md:inline-flex`) — reference content, not a core frequent destination. Feed, Leaderboard, History stay visible at all screen sizes.

**Active link styling:** `text-accent` (#ff4d4d) on the active route. Use `location.pathname` (already imported in NavBar via `useLocation`). Compare `location.pathname === '/feed'` etc. and swap color class.

---

## Decision D — Cold-Start & Empty State

**New user with no niche history:**
- Feed shows global ranking (no niche boost applied)
- No explanation shown — personalisation is implicit
- Label shows "✨ Trending" until user has niche history

**Page label logic:**
- User has ≥1 validation in their history → "✨ Personalised for you"
- User logged out OR user has 0 validations → "✨ Trending"

**Empty state (zero public validations in DB):**
- Card with encouraging copy: "No validations yet — be the first to share one"
- CTA button linking to `/` (home / validator)

**Logged-out CTA banner:**
- Same pattern as leaderboard CTA banner
- Copy: "Sign in to personalise your feed based on the niches you validate in"
- Uses existing `SignInButton` component
- Positioned between page header and feed cards (same position as leaderboard)

---

## Code Context — Reusable Assets

| Asset | Path | Usage in Feed |
|---|---|---|
| `LikeButton` | `components/social/LikeButton.jsx` | Interactive on FeedCard, `mode="compact"` |
| `CommentCount` | `components/social/CommentCount.jsx` | Display only on FeedCard (no modal on feed) |
| `NichePill` | `components/ui/NichePill.jsx` | Footer of FeedCard |
| `Avatar` | `components/ui/Avatar.jsx` | Author display if needed |
| `Card` | `components/ui/Card.jsx` | FeedCard wrapper |
| `useLeaderboard` | `hooks/useLeaderboard.js` | Pattern reference for `useFeed` hook |
| `LeaderboardPage` | `pages/LeaderboardPage.jsx` | Pattern reference for FeedPage layout |
| `LeaderboardCard` | `components/leaderboard/LeaderboardCard.jsx` | Pattern reference, NOT extended |
| `SignInButton` | `components/auth/SignInButton.jsx` | Logged-out CTA banner |
| `useAuth` | `hooks/useAuth.js` | Get user + validation history count |

**Leaderboard API pattern to follow:**
- `GET /api/leaderboard?page=N&niche=filter` → `{ entries, total, page, hasMore }`
- Feed API: `GET /api/feed?page=N` → same shape, no niche filter (niche affinity server-side from auth)
- Pagination: 20 items per page, infinite scroll (same IntersectionObserver pattern as leaderboard)

**NavBar file:** `components/layout/NavBar.jsx` — already imports `useLocation`, just needs Feed link added and active-link color logic.

---

## Out of Scope (Phase 25)

- Niche filter pills on feed (leaderboard has these — feed intentionally omits, algorithm handles relevance)
- Follow/following social graph (future phase)
- "Why am I seeing this?" explanation per card
- Push notifications for feed updates
