# Phase 17 — Publish & Privacy: Research

## RESEARCH COMPLETE

---

## 1. Backend Patterns — PATCH Endpoint Template

**Existing pattern (updateTitleRoute — `server/routes/history.js` lines 207–249):**
1. Auth check: `if (!req.user) return 401`
2. Input validate: check for empty/missing field
3. Ownership check: `SELECT user_id WHERE id = $1` → 403 if not owner
4. Execute UPDATE with `RETURNING` clause
5. Response: `{ id, <field>, updated_at }`

**New visibility endpoint follows same pattern exactly:**
```
PATCH /api/history/:id/visibility
Body: { is_public: boolean }
Ownership check: same as updateTitleRoute
UPDATE: SET is_public = $1, updated_at = now() WHERE id = $2 RETURNING id, is_public
Response: { id, is_public }
```

**Routes that need `is_public` added to SELECT:**
- `saveResultRoute` — add `is_public: true` to response (DB default, always true at creation)
- `listHistoryRoute` — add `is_public` to both SELECT branches (sort=score and sort=date)
- `getResultRoute` — add `is_public` to SELECT and JSON response

---

## 2. Frontend State Management

**useHistoryResult hook** (`client/src/hooks/useHistoryResult.js`):
- Simple `useState` + `useEffect` fetch hook, no Redux
- Exposes `result`, `loading`, `error`, `refetch()`
- **Visibility toggle in ResultPage:** manage `isTogglingVisibility` in component state; on PATCH success update `result.is_public` optimistically; on error call `refetch()` to revert

**useHistory hook** (`client/src/hooks/useHistory.js`):
- Redux-backed, dispatches to `historySlice`
- Already has `updateItemTitle` reducer pattern for in-place item mutation
- **Must add `updateItemVisibility` reducer** to historySlice: find item by id, set `is_public`
- **Must add `toggleItemVisibility(id, isPublic)` function** to useHistory: optimistic dispatch → PATCH call → revert dispatch on error

---

## 3. DB Migration Approach

**Precedent (Phase 16 — niche column):**
- Schema file: `server/db/schema.sql`
- Pattern: `ALTER TABLE IF EXISTS saved_results ADD COLUMN IF NOT EXISTS niche VARCHAR(50) NOT NULL DEFAULT 'Other'`
- Idempotent — safe to re-run; DEFAULT covers all existing rows

**Phase 17 migration:**
```sql
ALTER TABLE IF EXISTS saved_results
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;
```

No backfill required — `DEFAULT true` applies to all existing rows automatically.

---

## 4. Component Integration Points

**ActionButtons.jsx — current props:**
```
{ result, isDeleting, onRevalidate, onDelete }
```
- Owner check via `result?.isOwner` (line 44)
- **Must add:** `isPublic`, `onToggleVisibility`, `isTogglingVisibility`
- Button placement: after social share buttons, before delete button
- Button style: plain text button with `Globe`/`Lock` icon (lucide-react)

**ResultPage.jsx:**
- Already manages `isDeleting`, `isSavingTitle` states — follow same pattern
- **Must add:** `isTogglingVisibility` state, `handleToggleVisibility` handler
- Pass `isPublic={result?.is_public}`, `onToggleVisibility`, `isTogglingVisibility` to ActionButtons

**HistoryCard.jsx — footer row (lines 70–93):**
```
[verdict pill] [niche pill] [date] [delete icon]
```
- **New items:** `[Public/Private badge] [toggle button]` between niche pill and date
- Props to add: `onToggleVisibility` callback
- Local state: `isTogglingVisibility` boolean
- Stop propagation on toggle click (like delete at line 35)
- Badge style: match NichePill `size="sm"` — same padding, border, bg

**HistoryPage.jsx:**
- Renders HistoryCard with `onDelete` — add `onToggleVisibility` in same pattern
- Add `toggleItemVisibility(id, isPublic)` sourced from useHistory hook

---

## 5. Potential Pitfalls

**Rapid double-click:** Disable toggle button while `isTogglingVisibility` is true to prevent race.

**Server error revert:**
- ResultPage: save original `is_public` before optimistic update; call `refetch()` on error
- HistoryCard: store original `is_public` in handler closure; dispatch revert on error

**POST response missing `is_public`:** Always `true` at creation, so add `is_public: true` to saveResultRoute response statically — no DB round-trip needed.

**Icon choice:** `Globe` (public) and `Lock` (private) from lucide-react, `strokeWidth={2.5}` per design system.

---

## Validation Architecture

### PUB-01: Toggle public/private from result page

| Scenario | Expected |
|----------|----------|
| Owner clicks "Make Private" when public | Button label changes to "Make Public"; optimistic; PATCH fires |
| Owner clicks "Make Public" when private | Button label changes to "Make Private"; optimistic; PATCH fires |
| Toggle fails (500) | UI reverts to original; no user message needed |
| Non-owner views result page | No toggle button rendered |

### PUB-02: Toggle from history page

| Scenario | Expected |
|----------|----------|
| User toggles public card | Badge flips to "Private"; Redux state updates; PATCH fires |
| User toggles private card | Badge flips to "Public"; Redux state updates; PATCH fires |
| Toggle fails | Badge reverts; original Redux state restored |

### PUB-03: Leaderboard visibility (enforced in Phase 18)

| Scenario | Expected |
|----------|----------|
| GET /api/history/:id with is_public=false | Anyone with URL can still view (optionalAuth unchanged) |
| Phase 18 leaderboard query | `WHERE is_public = true` — private rows excluded |
| User publishes private result | Immediately visible on next leaderboard load |
| User unpublishes | Disappears from leaderboard; URL still works |

---

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.sql` | Add `is_public BOOLEAN NOT NULL DEFAULT true` migration |
| `server/routes/history.js` | Add PATCH visibility route; add `is_public` to all SELECT + responses |
| `server/index.js` | Register `PATCH /api/history/:id/visibility` with `requireAuth` |
| `client/src/store/slices/historySlice.js` | Add `updateItemVisibility` reducer |
| `client/src/hooks/useHistory.js` | Add `toggleItemVisibility` function |
| `client/src/components/validator/ActionButtons.jsx` | Add visibility toggle button |
| `client/src/pages/ResultPage.jsx` | Add toggle state + handler |
| `client/src/components/history/HistoryCard.jsx` | Add badge + toggle button in footer |
| `client/src/pages/HistoryPage.jsx` | Pass `onToggleVisibility` to HistoryCard |
