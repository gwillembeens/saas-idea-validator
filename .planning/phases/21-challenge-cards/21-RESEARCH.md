# Phase 21: Challenge Cards — Research

**Researched:** 2026-03-23
**Phase goal:** Add "Beat the Leaderboard" challenge cards to the leaderboard page showing the highest score achieved per niche, with a CTA to validate an idea in that niche.

---

## Domain Overview

Phase 21 adds a "Beat the Leaderboard" challenge section to the leaderboard page:
- 8 challenge cards (one per niche) in a horizontal scrollable row
- Each card displays the highest score achieved in that niche
- Cards include "Can you beat it?" label and "Try This Niche" CTA
- CTA navigates to `/` and pre-fills textarea with `"I'm building a [Niche] SaaS that..."` stub

**Scope:** Frontend component + lightweight backend query for top score per niche
**Position:** Between unauthenticated CTA banner and niche filter pills on LeaderboardPage
**Visibility:** All users (authenticated and unauthenticated)

---

## Codebase Analysis

### 1. LeaderboardPage Integration Point

**File:** `client/src/pages/LeaderboardPage.jsx`

Current structure order:
1. Title + description
2. Unauthenticated CTA banner — renders when `!user`
3. Niche filter pill row — `flex gap-2 overflow-x-auto`
4. Entry list — renders LeaderboardCard entries with rank numbers

**Integration point:** Challenge section mounts between the CTA banner and the niche filter pills.

### 2. useLeaderboard Hook

**File:** `client/src/hooks/useLeaderboard.js`

- Fetches `GET /api/leaderboard?page=N&niche=...` with pagination (20 items/page)
- State: `{ items, page, hasMore, loading, error, currentNiche }`
- **Decision:** Create separate `useChallengeScores()` hook (cleaner separation; top-scores fetch is single-shot, not paginated)

### 3. Backend Leaderboard Route

**File:** `server/routes/leaderboard.js`

Current query returns paginated entries sorted by `(scores->>'weighted')::float DESC`.
Exports `VALID_NICHES` (8 niches) and `truncateIdeaText()` helper.

**New endpoint needed:** `GET /api/leaderboard/top-per-niche`

```sql
SELECT
  sr.niche,
  MAX((sr.scores->>'weighted')::float) AS top_score,
  COUNT(*) AS total_public
FROM saved_results sr
WHERE sr.is_public = true
  AND sr.deleted_at IS NULL
GROUP BY sr.niche
ORDER BY sr.niche
```

Response shape:
```json
{
  "topScores": [
    { "niche": "Fintech", "score": 4.8, "count": 5 },
    { "niche": "Other", "score": null, "count": 0 }
  ]
}
```

### 4. nicheConfig Exports

**File:** `client/src/constants/nicheConfig.js`

```javascript
{
  Fintech: { icon: Banknote, label: 'Fintech' },
  Logistics: { icon: Truck, label: 'Logistics' },
  'Creator Economy': { icon: Video, label: 'Creator Economy' },
  PropTech: { icon: Home, label: 'PropTech' },
  HealthTech: { icon: Activity, label: 'HealthTech' },
  EdTech: { icon: BookOpen, label: 'EdTech' },
  HRTech: { icon: Users, label: 'HRTech' },
  Other: { icon: Layers, label: 'Other' },
}
```

Icons + labels are directly available for challenge cards. Fallback pattern: `NICHE_CONFIG[niche] || NICHE_CONFIG['Other']` (same as NichePill.jsx).

### 5. Card Component

**File:** `client/src/components/ui/Card.jsx`

Props: `decoration` ("tape" | "tack" | "none"), `rotate` (-1 | 0 | 1), `className`, `onClick`
Default styles: wobbly inline borderRadius, `shadow-hard`, `bg-white`, `p-6`

**Challenge cards reuse this directly** with `decoration="none"` or `decoration="tack"`.

### 6. Button Component

**File:** `client/src/components/ui/Button.jsx`

- `variant="primary"`: white → red fill on hover, hard shadow reduces on active
- Font: `font-body`, `text-lg md:text-xl`, `h-12 md:h-14`

"Try This Niche" CTA uses `variant="primary"` directly.

### 7. Redux setIdea Pattern

**File:** `client/src/store/slices/validatorSlice.js`

Action: `setIdea: (state, action) => { state.idea = action.payload }`

Challenge CTA pattern:
```javascript
const navigate = useNavigate()
const dispatch = useDispatch()

function handleTryNiche() {
  dispatch(setIdea(`I'm building a ${niche} SaaS that...`))
  navigate('/')
}
```

### 8. Navigation Pattern (established)

**File:** `client/src/components/leaderboard/LeaderboardCard.jsx`

```javascript
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate(`/history/${entry.id}`)
```

Same pattern for challenge CTA, navigating to `/`.

### 9. Score Formatting

**File:** `client/src/components/leaderboard/LeaderboardCard.jsx`

Score displayed as `{weighted.toFixed(1)}/5`. ChallengeCard must use same format.

---

## Implementation Approach

### Backend

**New route export:** `topPerNicheRoute()` in `server/routes/leaderboard.js`
- Register as `GET /api/leaderboard/top-per-niche` in `server/index.js`
- Returns all 8 niches; uses `VALID_NICHES` constant to ensure all niches present (even with zero entries)
- Must include niches not yet in DB with `score: null, count: 0`
- No authentication required (public data)

### Frontend

**New component:** `client/src/components/leaderboard/ChallengeSection.jsx`
- Self-contained; uses `useChallengeScores()` hook
- Renders section heading "Beat the Leaderboard" + horizontal scroll row of `ChallengeCard` components

**New component:** `client/src/components/leaderboard/ChallengeCard.jsx`
- Pure component; props: `{ niche, topScore, onTryNiche }`
- Layout (top to bottom): niche icon + name → large score number → "Can you beat it?" → CTA button
- Width: ~160px (compact, horizontal scroll)
- Reuses `Card` (decoration="none" or "tack"), `Button` (variant="primary")

**New hook:** `client/src/hooks/useChallengeScores.js`
- Fetches `GET /api/leaderboard/top-per-niche` once on mount
- Returns `{ topScores, loading, error }`

**Integration:** `LeaderboardPage.jsx` — mount `<ChallengeSection />` between CTA banner and filter pills

### ChallengeCard Design
```
┌──────────────────┐
│  🏦 Fintech      │  ← niche icon + name (font-heading)
│                  │
│      4.8/5       │  ← large score (font-heading, text-3xl, centered)
│   Can you beat   │
│       it?        │  ← (font-body, text-sm, text-muted, centered)
│                  │
│  [Try This Niche]│  ← Button primary
└──────────────────┘
```

"No score yet" state:
- Score area shows "—"
- Label: "Be the first!"
- Button: still visible (secondary variant or slightly muted)

Loading skeleton: 3 placeholder cards with pulse animation.

---

## Validation Architecture

### Backend Tests — `server/routes/leaderboard.test.js` (extend)

1. `GET /api/leaderboard/top-per-niche` returns `{ topScores }` array
2. Returns exactly 8 entries — one per VALID_NICHE
3. `score` is the MAX weighted score for that niche from public non-deleted results
4. Niches with no public entries return `score: null, count: 0`
5. Private validations excluded (`is_public=false`)
6. Soft-deleted validations excluded (`deleted_at IS NOT NULL`)

### Frontend Tests

**`ChallengeCard.test.jsx`** (new):
1. Renders niche name
2. Renders `4.8/5` when topScore=4.8
3. Renders "—" / "Be the first!" when topScore=null
4. Renders "Can you beat it?" label
5. Renders "Try This Niche" button
6. Calls onTryNiche callback on button click
7. Uses niche icon from NICHE_CONFIG

**`ChallengeSection.test.jsx`** (new):
1. Renders 8 cards after fetch
2. Shows loading skeleton while fetching
3. Handles API error gracefully (shows error message, no crash)
4. Passes correct niche props to each card

**`useChallengeScores.test.js`** (new):
1. Fetches `/api/leaderboard/top-per-niche` on mount
2. Sets loading=true initially, false after response
3. Parses topScores from response
4. Sets error on network failure

**`LeaderboardPage.test.jsx`** (extend):
1. ChallengeSection renders in the page
2. Appears between CTA banner and niche filter pills (DOM order)

**CTA navigation test** (in `ChallengeCard.test.jsx`):
1. Mock useNavigate and useDispatch
2. Click "Try This Niche" on Fintech card
3. Assert `dispatch(setIdea("I'm building a Fintech SaaS that..."))` called
4. Assert `navigate('/')` called

---

## Risks & Gotchas

1. **VALID_NICHES must include all 8** — backend query returns only niches that have entries; application code must fill in missing niches with null scores. Use VALID_NICHES array to normalise.

2. **NULL scores in JSON** — `(scores->>'weighted')::float` can produce NULL for rows where scores is missing the weighted key. Use `COALESCE(..., 0)` or filter. Test with partial score data.

3. **Niche string key case sensitivity** — backend niche values must match NICHE_CONFIG keys exactly ("Creator Economy" not "creator-economy"). Already validated by Phase 16 parseNiche(), but verify match in tests.

4. **Challenge CTA with logged-out user** — navigates to `/`, user sees pre-filled idea, clicks validate, auth modal appears. Existing IdeaInput.jsx auth guard already handles this. No change needed.

5. **Mobile horizontal scroll** — 8 cards × ~160px = ~1280px total. Use `overflow-x-auto flex gap-3` (same as filter pills). Test at 320px and 375px viewports.

6. **Score formatting consistency** — must match LeaderboardCard: `(4.8).toFixed(1) + '/5'`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `client/src/hooks/useChallengeScores.js` | Fetch top-per-niche data |
| `client/src/hooks/useChallengeScores.test.js` | Hook tests |
| `client/src/components/leaderboard/ChallengeSection.jsx` | Container component |
| `client/src/components/leaderboard/ChallengeSection.test.jsx` | Section tests |
| `client/src/components/leaderboard/ChallengeCard.jsx` | Individual card component |
| `client/src/components/leaderboard/ChallengeCard.test.jsx` | Card tests |

## Files to Modify

| File | Change |
|------|--------|
| `server/routes/leaderboard.js` | Add `topPerNicheRoute()` export |
| `server/index.js` | Register `GET /api/leaderboard/top-per-niche` |
| `client/src/pages/LeaderboardPage.jsx` | Import + mount `<ChallengeSection />` |

## No Changes Needed

- `client/src/store/slices/validatorSlice.js` — `setIdea` already exists
- `client/src/components/ui/Card.jsx` — reusable as-is
- `client/src/components/ui/Button.jsx` — reusable as-is
- `client/src/constants/nicheConfig.js` — all 8 niches with icons + labels

---

## RESEARCH COMPLETE

**Key decisions:**
1. New `GET /api/leaderboard/top-per-niche` endpoint — clean separation, no pagination needed
2. New `useChallengeScores()` hook — keeps data fetching out of component
3. `ChallengeSection` + `ChallengeCard` component split — testable in isolation
4. All UI primitives (Card, Button, NICHE_CONFIG) are reusable without modification
5. CTA pattern: `dispatch(setIdea(...))` + `navigate('/')` — already established in codebase

**No breaking changes:** Phase 21 only adds new components/endpoints; does not modify existing routes, Redux slices, or UI primitives.
