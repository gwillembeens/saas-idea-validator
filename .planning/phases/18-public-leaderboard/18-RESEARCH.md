---
phase: 18
type: research
---

# Phase 18 Research — Public Leaderboard

## 1. Codebase Inventory

### Reusable Assets

#### **Database Query Patterns** (server/routes/history.js, lines 123–131)
```js
// Score ordering pattern for leaderboard
query = `
  SELECT id, title, idea_text, scores, created_at, niche, is_public
  FROM saved_results
  WHERE user_id = $1 AND deleted_at IS NULL
  ORDER BY (scores->>'weighted')::float DESC, created_at DESC
  LIMIT $2
`
```
**Reuse:** Adapt for leaderboard by:
- Replace `WHERE user_id = $1` with `WHERE is_public = true` (no user filter)
- Add optional `AND niche = $2` if niche param present
- JOIN with `users` table to fetch author `username` (nullable)
- JSONB `scores` column is accessed via `->>'weighted'` to extract the weighted score as string, cast to float for sorting
- Return shape: add `user_id` and `author_username` to SELECT

#### **OptionalAuth Middleware** (server/middleware/optionalAuth.js)
```js
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      req.user = verifyAccessToken(token)
    } catch {
      req.user = null
    }
  } else {
    req.user = null
  }
  next()
}
```
**Reuse:** Apply to GET `/api/leaderboard` to allow both logged-in and logged-out access.

#### **IntersectionObserver Infinite Scroll** (client/src/pages/HistoryPage.jsx, lines 61–75)
```js
useEffect(() => {
  if (!sentinelRef.current) return

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasMore && status !== 'loading') {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )

  observer.observe(sentinelRef.current)
  return () => observer.disconnect()
}, [hasMore, status])
```
**Reuse:** Copy verbatim for LeaderboardPage. Sentinel should fire `loadMore()` hook function to fetch next page.

#### **Verdict Color & Label Functions** (client/src/components/history/HistoryCard.jsx, lines 8–20)
```js
function getVerdictColor(weighted) {
  if (weighted >= 4.5) return 'bg-green-100 border-green-400'
  if (weighted >= 3.5) return 'bg-yellow-100 border-yellow-400'
  if (weighted >= 2.5) return 'bg-orange-100 border-orange-400'
  return 'bg-red-100 border-red-400'
}

function getVerdictLabel(weighted) {
  if (weighted >= 4.5) return '🟢 Strong Signal'
  if (weighted >= 3.5) return '🟡 Promising'
  if (weighted >= 2.5) return '🟠 Needs Work'
  return '🔴 Too Vague'
}
```
**Reuse:** Extract to `client/src/utils/verdictHelpers.js` (or copy into LeaderboardCard.jsx if keeping local). These are used in LeaderboardCard for visual feedback.

#### **NichePill Component** (client/src/components/ui/NichePill.jsx)
- `size="sm"` variant is compact: `px-3 py-1 text-xs` with `#e5e0d8` background, no shadow
- Uses `NICHE_CONFIG` for icon lookup
- `niche` prop controls which icon + label renders
**Reuse:** Import and use in LeaderboardCard with `size="sm"` for niche display.

#### **NICHE_CONFIG** (client/src/constants/nicheConfig.js)
```js
export const NICHE_CONFIG = {
  Fintech:          { icon: Banknote, label: 'Fintech' },
  Logistics:        { icon: Truck,    label: 'Logistics' },
  'Creator Economy':{ icon: Video,    label: 'Creator Economy' },
  PropTech:         { icon: Home,     label: 'PropTech' },
  HealthTech:       { icon: Activity, label: 'HealthTech' },
  EdTech:           { icon: BookOpen, label: 'EdTech' },
  HRTech:           { icon: Users,    label: 'HRTech' },
  Other:            { icon: Layers,   label: 'Other' },
}
```
**Reuse:** Use `Object.keys(NICHE_CONFIG)` to generate niche pill row. Pills: "All" (empty value) + all 8 niches = 9 total.

#### **Card Component** (client/src/components/ui/Card.jsx)
- Wrapper with wobbly border, optional tape/tack decoration, optional rotation
- Usage: `<Card decoration="none" rotate={0}>children</Card>`
**Reuse:** Wrap each leaderboard entry card in `<Card decoration="none" rotate={0}>` for consistent hand-drawn styling.

#### **Button Component** (client/src/components/ui/Button.jsx)
- Variants: `primary`, `secondary`
- Styled with wobbly border, hard shadow, Patrick Hand font
**Reuse:** Use for CTA button in unauthenticated banner ("Validate your idea").

#### **AppShell Component** (client/src/components/layout/AppShell.jsx)
- Wraps all pages with dot-grid background and NavBar
- Background: `#fdfbf7` paper color + radial gradient dot pattern
**Reuse:** Wrap `LeaderboardPage` with `<AppShell>` for consistent layout.

---

### Integration Points

#### **Backend Route Registration** (server/index.js)
Currently lines 48–53 mount history routes. New leaderboard route must be registered here:
```js
app.get('/api/leaderboard', optionalAuth, leaderboardRoute)
```
Import `leaderboardRoute` from `./routes/leaderboard.js` at top.

#### **Frontend Route Addition** (client/src/App.jsx)
Currently lines 59–62 define routes. Must add:
```js
<Route path="/leaderboard" element={<LeaderboardPage />} />
```
Import `LeaderboardPage` from `./pages/LeaderboardPage.jsx` at top.

#### **NavBar Updates** (client/src/components/layout/NavBar.jsx)
Lines 32–55 define nav links. Must add "Leaderboard" link:
- Always visible (both logged-in and logged-out)
- Placed before "Framework" link
- Uses same styling as existing links (font-body, text-lg, text-blue hover:text-accent)

---

## 2. Backend Implementation Guide

### DB Migration (server/db/init.js)

**Add to `runMigrations()` function:**
```js
// Phase 18: add username column for public attribution
await pool.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE
`)
```

**Location:** Insert after Phase 17 migration (after the `is_public` column addition).

**Rationale:** Idempotent (`IF NOT EXISTS`), allows null values (backward compatible with existing users), unique constraint enforces no duplicates.

---

### Leaderboard Route (server/routes/leaderboard.js — NEW FILE)

**Signature:**
```js
export async function leaderboardRoute(req, res)
```

**Query Parameters:**
- `?niche=Fintech` — optional, filters by exact niche name
- `?page=0` — optional, defaults to 0, each page = 20 items

**Response Shape:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "idea_text": "first 150 chars of idea...",
      "scores": { "phase1": 4, "phase2": 3, "phase3": 4, "phase4": 3, "weighted": 3.7 },
      "niche": "Fintech",
      "user_id": "uuid",
      "author_username": "john_doe" | null,
      "created_at": "2026-03-22T10:30:00Z"
    },
    ...
  ],
  "total": 42,
  "page": 0
}
```

**SQL Query Pattern:**
```sql
SELECT
  sr.id,
  sr.idea_text,
  sr.scores,
  sr.niche,
  sr.user_id,
  u.username AS author_username,
  sr.created_at
FROM saved_results sr
LEFT JOIN users u ON sr.user_id = u.id
WHERE sr.is_public = true
  AND sr.deleted_at IS NULL
  AND (
    $1::text IS NULL OR sr.niche = $1::text
  )
ORDER BY (sr.scores->>'weighted')::float DESC
LIMIT 20
OFFSET $2
```

**Parameters:** `[$1 = niche (null if 'All'), $2 = page * 20]`

**Edge Cases:**
- If `niche` is missing or empty in query, set to null and omit the filter
- If `page` is missing, default to 0
- `LIMIT 20 OFFSET (page * 20)` for pagination
- `LEFT JOIN users` allows entries from deleted users (user_id exists but username is null)
- Always include deleted_at check to exclude soft-deleted results

**Error Handling:**
- Return 400 if `niche` param is present but not in VALID_NICHES (invalid request)
- Return 500 on DB error with generic message

---

## 3. Frontend Implementation Guide

### useLeaderboard Hook (client/src/hooks/useLeaderboard.js — NEW FILE)

**Return Object:**
```js
{
  items: Array,           // entries from backend
  page: number,           // current page loaded (0-indexed)
  hasMore: boolean,       // true if there are more pages to fetch
  loading: boolean,       // true during fetch
  error: string | null,   // error message on failure
  sentinelRef: RefObject, // ref for IntersectionObserver sentinel
  setNiche: (niche) => {} // function to filter by niche
}
```

**Logic:**
1. Read URL param `?niche=Fintech` on mount using `useSearchParams()`
2. Maintain local state: `{ items, page, hasMore, loading, error }`
3. On mount: fetch page 0 with current niche
4. On niche change: reset items to `[]`, reset page to 0, fetch page 0
5. On sentinel intersection: increment page, fetch next page, append results
6. Handle `loading` state to prevent duplicate requests
7. Fetch: `GET /api/leaderboard?niche=${niche || ''}&page=${page}`
8. If backend returns `total = 0`, set `hasMore = false`
9. If entries length < 20, set `hasMore = false`

**Error Handling:**
- Catch and store error message, log to console
- Set `loading = false` so user can retry

---

### LeaderboardCard Component (client/src/components/leaderboard/LeaderboardCard.jsx — NEW FILE)

**Props:**
```js
{
  entry: {
    id, idea_text, scores, niche, user_id, author_username, created_at
  },
  rank: number,        // absolute rank (#1, #2, etc.)
  isOwn: boolean       // true if entry.user_id === auth.user.id
}
```

**Render:**
- **Rank badge:** Large heading, Kalam font, "#" + rank number (e.g., "#1")
- **Idea preview:** First 150 characters (truncated in backend), no newlines, ellipsis if longer
- **Score pill:** Weighted score (e.g., "3.7/5"), verdict color/label from `getVerdictColor` helper
- **Niche pill:** `<NichePill niche={entry.niche} size="sm" />`
- **Author:** `entry.author_username || "Anonymous"`, styled as small gray text
- **Author link:**
  - If `author_username` is null: text only, no link
  - If not null: `<Link to={`/profile/${entry.author_username}`}>` (Phase 20 will implement this route)
- **"You" badge:** If `isOwn === true`, show small badge (e.g., "🤖 You") in corner
- **Card click:** Navigate to `/history/:id` (use `useNavigate`)

**Styling:**
- Wrapper: `<Card decoration="none" rotate={0}>` for hand-drawn border
- Layout: flexbox, left side = rank + idea + author, right side = score + niche
- Font: Patrick Hand for body text, Kalam for rank number
- Spacing: consistent with HistoryCard (py-6 for vertical padding)
- Hover: cursor pointer, slight shadow increase

---

### LeaderboardPage Component (client/src/pages/LeaderboardPage.jsx — NEW FILE)

**Structure:**
1. **Unauthenticated CTA (conditional):** Show if `user === null`
   - Card with message: "Think yours can beat these? Validate your idea and see where YOU rank."
   - Button: "Validate Your Idea" → navigates to `/`
   - Styling: centered, max-width-2xl, conspicuous but not overwhelming

2. **Niche filter pill row:**
   - Pills: "All" (active by default) + 8 niches from `NICHE_CONFIG`
   - On click: call `setNiche(nicheName)` from hook
   - Active pill: highlighted (e.g., blue border or darker bg)
   - Inactive pill: muted appearance
   - Mobile: `overflow-x-auto` for horizontal scroll
   - Desktop: flex row, wrap if needed

3. **Card list:**
   - Maps `items` array
   - Each item wrapped with rank number on left (like HistoryPage)
   - Rank = `(page * 20) + index + 1` — local calculation
   - Empty state: "No validations yet" if items.length === 0 and not loading

4. **Skeleton loading state:**
   - Show while `loading === true`
   - Reuse SkeletonHistoryRow from HistoryPage (or create similar)

5. **Sentinel div:**
   - `ref={sentinelRef}` from hook
   - `className="w-full h-px"` (invisible divider)
   - Placed after card list, before footer spacing

**Layout:**
- Wrapper: `<AppShell>`
- Content: `max-w-4xl mx-auto px-4 py-20 md:px-8`
- Title: "Public Leaderboard" (Kalam heading, large)
- Niche row: below title, full-width scroll on mobile
- Card list: full-width, gapped
- Footer: `mt-20 md:mt-24` for spacing

**Hook Usage:**
```js
const { items, loading, hasMore, error, sentinelRef, setNiche } = useLeaderboard()
const [searchParams] = useSearchParams()
const user = useSelector(s => s.auth.user)

useEffect(() => {
  const niche = searchParams.get('niche') || 'All'
  setNiche(niche === 'All' ? null : niche)
}, [searchParams])
```

---

### NavBar Updates (client/src/components/layout/NavBar.jsx)

**Changes:**
- Add Leaderboard link to the nav row
- Placement: before "Framework" link
- Always visible (logged-in and logged-out)
- Use `Link` with same styling as Framework (font-body, text-lg, text-blue hover:text-accent)

**Updated structure:**
```
Logged out: [Logo] [SearchBar empty] [Leaderboard | Framework | Sign In]
Logged in:  [Logo] [SearchBar]       [Leaderboard | Framework | History | Sign Out]
```

---

### App.jsx Route Addition (client/src/App.jsx)

**Add import:**
```js
import { LeaderboardPage } from './pages/LeaderboardPage'
```

**Add route:**
```js
<Route path="/leaderboard" element={<LeaderboardPage />} />
```

**Placement:** Insert after `/history/:id` route, before or after `/framework`.

---

## 4. Test Coverage Guide

### Backend Tests (server/routes/leaderboard.test.js — NEW FILE)

**Test Cases:**

1. **GET /api/leaderboard returns 200 with all public entries**
   - Setup: Insert 3 public + 2 private results
   - Assert: Response length === 3, all have `is_public = true`

2. **GET /api/leaderboard?niche=Fintech filters correctly**
   - Setup: Insert results with niche = Fintech, EdTech, Other
   - Assert: Only Fintech results returned

3. **GET /api/leaderboard?page=1 paginates correctly**
   - Setup: Insert 25 public results
   - Assert: Page 0 has 20 items, page 1 has 5 items, page 2 has 0 items

4. **Author username is included in response**
   - Setup: User with username "john_doe" creates a public result
   - Assert: Response has `author_username: "john_doe"`

5. **Missing username falls back to null**
   - Setup: Result created before username column existed (simulate by not setting username)
   - Assert: Response has `author_username: null`

6. **Results sorted by weighted score descending**
   - Setup: Insert 3 results with scores 2.5, 4.0, 3.5
   - Assert: Response order = [4.0, 3.5, 2.5]

7. **Invalid niche param returns 400**
   - Request: `?niche=InvalidNiche`
   - Assert: Status 400, error message

8. **Unauthenticated request works**
   - Request: No Authorization header
   - Assert: Status 200, results returned (no error)

---

### Frontend Tests

#### **LeaderboardCard Component** (client/src/components/leaderboard/LeaderboardCard.test.jsx)

1. **Renders rank, idea preview, score, verdict, niche**
   - Assert: All elements present in DOM

2. **Shows "Anonymous" when author_username is null**
   - Props: `{ author_username: null }`
   - Assert: Text shows "Anonymous", no link

3. **Shows username when present**
   - Props: `{ author_username: "john_doe" }`
   - Assert: Text shows "john_doe", link href = "/profile/john_doe"

4. **Shows "You" badge when isOwn=true**
   - Props: `{ isOwn: true }`
   - Assert: Badge element visible with "You" or emoji

5. **Clicking card navigates to /history/:id**
   - Simulate click, assert `useNavigate` called with correct path

---

#### **LeaderboardPage Component** (client/src/pages/LeaderboardPage.test.jsx)

1. **Shows unauthenticated CTA when not logged in**
   - Mock `useSelector` to return `user = null`
   - Assert: CTA banner visible with message and button

2. **Hides CTA when logged in**
   - Mock `useSelector` to return `user = { id, email }`
   - Assert: CTA banner not visible

3. **Renders niche filter pills**
   - Assert: 9 pills (All + 8 niches) in DOM

4. **Clicking niche pill updates URL param**
   - Simulate click on "Fintech" pill
   - Assert: URL changes to `?niche=Fintech`

5. **Renders card list from hook items**
   - Mock hook to return 5 items
   - Assert: 5 LeaderboardCard components rendered

6. **Shows skeleton loader while loading**
   - Mock hook to return `loading = true`
   - Assert: Skeleton rows visible

7. **Sentinel ref is passed to intersection observer**
   - Assert: `sentinelRef.current` is a DOM element

---

#### **NavBar Component** (client/src/components/layout/NavBar.test.jsx)

1. **Shows Leaderboard link when logged out**
   - Mock `useSelector` to return `user = null`
   - Assert: Link to "/leaderboard" visible

2. **Shows Leaderboard link when logged in**
   - Mock `useSelector` to return `user = { id, email }`
   - Assert: Link to "/leaderboard" visible

3. **Leaderboard link appears before Framework link**
   - Assert: DOM order is correct

---

## 5. Implementation Sequence (Waves)

### Wave 0 (Database + Backend)
1. **server/db/init.js** — Add username migration
2. **server/routes/leaderboard.js** — Implement route
3. **server/index.js** — Register route

### Wave 1 (Frontend Core)
4. **client/src/hooks/useLeaderboard.js** — Implement hook
5. **client/src/components/leaderboard/LeaderboardCard.jsx** — Implement card
6. **client/src/pages/LeaderboardPage.jsx** — Implement page

### Wave 2 (Integration + Navigation)
7. **client/src/components/layout/NavBar.jsx** — Add Leaderboard link
8. **client/src/App.jsx** — Add route
9. **Tests** — All test files (backend + frontend)

---

## 6. Exact Code Patterns to Copy

### Pattern 1: IntersectionObserver Sentinel (HistoryPage.jsx, lines 61–75)
Use this **exactly** for infinite scroll in LeaderboardPage:
```js
useEffect(() => {
  if (!sentinelRef.current) return

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasMore && status !== 'loading') {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )

  observer.observe(sentinelRef.current)
  return () => observer.disconnect()
}, [hasMore, status])
```

### Pattern 2: Verdict Color & Label Helper (HistoryCard.jsx, lines 8–20)
Copy to **client/src/utils/verdictHelpers.js** or inline in LeaderboardCard:
```js
export function getVerdictColor(weighted) {
  if (weighted >= 4.5) return 'bg-green-100 border-green-400'
  if (weighted >= 3.5) return 'bg-yellow-100 border-yellow-400'
  if (weighted >= 2.5) return 'bg-orange-100 border-orange-400'
  return 'bg-red-100 border-red-400'
}

export function getVerdictLabel(weighted) {
  if (weighted >= 4.5) return '🟢 Strong Signal'
  if (weighted >= 3.5) return '🟡 Promising'
  if (weighted >= 2.5) return '🟠 Needs Work'
  return '🔴 Too Vague'
}
```

### Pattern 3: Card Layout with Ranking (HistoryPage.jsx, lines 141–158)
Use this structure for LeaderboardPage card list:
```js
<div className="w-full max-w-4xl flex flex-col gap-4 mb-12">
  {items.map((item, index) => (
    <div key={item.id} className="flex items-start gap-4">
      {/* Ranking number */}
      <div className="flex items-center justify-center w-10 pt-4 flex-shrink-0">
        <span className="font-heading text-2xl text-pencil">
          #{(page * 20) + index + 1}
        </span>
      </div>
      {/* Card */}
      <div className="flex-1 min-w-0">
        <LeaderboardCard entry={item} rank={(page * 20) + index + 1} isOwn={...} />
      </div>
    </div>
  ))}
</div>
```

### Pattern 4: JSONB Score Access (history.js, line 128)
JSONB column syntax for sorting by weighted score:
```sql
ORDER BY (scores->>'weighted')::float DESC
```
- `->>'weighted'` extracts text value from JSONB object
- `::float` casts to numeric for proper sorting

### Pattern 5: OptionalAuth Middleware Registration (server/index.js, line 50)
Pattern for registering route with optional auth:
```js
app.get('/api/leaderboard', optionalAuth, leaderboardRoute)
```

### Pattern 6: Niche Filter URL Param (useSearchParams pattern)
```js
const [searchParams, setSearchParams] = useSearchParams()
const currentNiche = searchParams.get('niche') || 'All'

function handleNicheClick(niche) {
  if (niche === 'All') {
    setSearchParams({})  // Remove param for "All"
  } else {
    setSearchParams({ niche })
  }
}
```

### Pattern 7: Card Component Usage
All leaderboard entry cards should use:
```js
<Card decoration="none" rotate={0}>
  {children}
</Card>
```

---

## 7. Risk / Gotcha Notes

### Scores Column Shape (JSONB)
- The `scores` column is stored as **PostgreSQL JSONB**, not a string
- When fetching with `SELECT scores`, it returns a JSONB object: `{ "phase1": 4, "phase2": 3, "phase3": 4, "phase4": 3, "weighted": 3.7 }`
- Backend must pass it as-is in JSON response; frontend receives it as a JS object
- Access: `entry.scores.weighted` (not `entry.scores['weighted']`)
- For sorting in SQL: use `(scores->>'weighted')::float` to extract and cast

### Route for Result Pages
- **Own/Private results:** `/history/:id` (only visible to owner)
- **Public results:** Same route `/history/:id`, but `getResultRoute` checks `is_public` flag
- Leaderboard cards navigate to `/history/:id` regardless of ownership
- The backend `getResultRoute` uses `optionalAuth`, so anyone can view public results

### Niche Validation
- Backend has 8 valid niches + 1 "Other" = 9 total (see VALID_NICHES in history.js, line 4)
- Leaderboard route must validate `niche` param against VALID_NICHES before querying
- Invalid niche should return 400, not silently default to null

### NavBar Mobile Layout
- Current NavBar has `gap-3` between right-side links
- Adding Leaderboard link (3rd link before Framework) may cause wrapping on small screens
- Ensure all links are `flex-shrink-0` or use responsive `hidden md:` classes if needed
- Test on mobile (375px) to verify no overflow

### Infinite Scroll Edge Cases
- Fetch should include the `?niche=` param in every request (even if null/"All")
- If user is on page 1 of Fintech results, then switches to EdTech, must reset page to 0 and discard page 1 items
- `hasMore` should be false when:
  - `entries.length < 20` (fewer items returned than limit)
  - `total` from backend indicates no more pages
  - Either condition works; implementation choice

### Author Username Null Handling
- Phase 20 adds the settings UI to set username
- Until then, all entries will have `author_username = null`
- Frontend must gracefully handle null: show "Anonymous", no link
- Don't crash if `author_username` is missing from response

### "You" Badge Logic
- Compare `entry.user_id` (UUID) to `auth.user.id` (UUID)
- Both are guaranteed to be valid UUIDs when user is logged in
- If user is not logged in (`auth.user = null`), don't show badge on any entry
- Badge should be visually distinct (small, corner-placed, emoji or label)

### Pagination Rank Calculation
- Rank = `(page * 20) + index + 1` where `page` is 0-indexed and `index` is 0-indexed
- Page 0, index 0 → rank #1
- Page 0, index 19 → rank #20
- Page 1, index 0 → rank #21
- Page 1, index 19 → rank #40
- **Must track `page` in hook state** to calculate correct rank in render

### CTA Banner Copy
- Emphasis should be on "YOU", "yours", "your idea" to drive personal motivation
- Button text: "Validate Your Idea" (capitalized, clear CTA)
- Button click → navigate to `/` (the validator page)
- Message should fit in single Card on mobile (max-width-sm or similar)

### Design System Consistency
- All text: use `font-body` (Patrick Hand) except headings
- All headings: use `font-heading` (Kalam)
- All non-essential elements: use `text-pencil` (#2d2d2d), never pure black
- Wobbly borders: use inline `style={{ borderRadius: '255px 15px...' }}` on cards, not Tailwind classes
- Hard shadows: `shadow-hard` or `shadow-hardSm` (4px offset, no blur)
- Spacing: follow HistoryPage model (py-20 for sections, gap-4 for card rows)

### Redux Store Shape
- `auth.user` is `{ id: UUID, email: string }` — no `username` field in Redux
- To display "You" badge, must compare IDs directly from API response
- No new Redux slice needed for leaderboard (URL param drives filter, local hook state drives pagination)

---

## 8. Files Ready for Implementation

**New Backend Files to Create:**
- `server/routes/leaderboard.js` (new, ~100 lines)

**Backend Files to Modify:**
- `server/db/init.js` (add 1 migration)
- `server/index.js` (import + register 1 route)

**New Frontend Files to Create:**
- `client/src/pages/LeaderboardPage.jsx` (new, ~150 lines)
- `client/src/components/leaderboard/LeaderboardCard.jsx` (new, ~80 lines)
- `client/src/hooks/useLeaderboard.js` (new, ~100 lines)
- `client/src/utils/verdictHelpers.js` (optional; extract or inline)

**Frontend Files to Modify:**
- `client/src/components/layout/NavBar.jsx` (add 3–5 lines)
- `client/src/App.jsx` (add 2–3 lines)

**Test Files to Create:**
- `server/routes/leaderboard.test.js`
- `client/src/pages/LeaderboardPage.test.jsx`
- `client/src/components/leaderboard/LeaderboardCard.test.jsx`

---

## 9. Summary

Phase 18 is a **mid-complexity frontend feature** with straightforward backend plumbing:
- **Backend:** 1 new route with optional auth, 1 DB migration, simple query with optional filter + pagination
- **Frontend:** 1 new page, 1 new card component, 1 custom hook with infinite scroll, NavBar link addition
- **Reuse:** Heavy — IntersectionObserver, Card/Button/NichePill, verdict helpers, auth patterns all exist
- **Test coverage:** Standard unit/integration tests for both backend and frontend
- **Risk level:** Low — clear requirements, no new API paradigms, isolated feature

Ready for planning.
