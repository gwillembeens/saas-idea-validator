# Phase 19 — Idea Versioning: Context

**Created:** 2026-03-22
**Requirements:** VER-01, VER-02, VER-03, VER-04

---

## Decisions

### 1. Similarity Detection

- **Where:** Server-side, inside `saveResultRoute` (POST `/api/history`), after INSERT completes
- **When:** Synchronous before the 201 response — returns `similarTo: { id, title, scores } | null` in the save response
- **Library:** `string-similarity` npm package (Dice coefficient), threshold ≥ 0.75
- **Scope:** Compare new `idea_text` against ALL of the authenticated user's past `idea_text` values (no cap — power users won't have hundreds)
- **Result:** Best match only (highest similarity score among all matches ≥ threshold)
- **Unauthenticated users:** No history → no comparison → `similarTo` is always null
- **Redux integration:** `useValidate` already awaits the save response (line 47); read `similarTo` from it and dispatch to a new `setRevisionCandidate` action in `validatorSlice`

### 2. Revision Modal UX

- **Trigger:** Auto-appear on the live results page (`/`) when `status === 'done'` and `revisionCandidate` is set in Redux
- **Timing:** Appears after streaming completes + save response returns (small delay is acceptable)
- **Content:** Shows original idea title + original weighted score (e.g. "Looks like a revision of *AI Invoice Tool* (4.0/5)")
- **Actions:** "Link as revision" (confirm) | "New idea" (dismiss)
- **Confirm flow:** Client calls `PATCH /api/history/:id/parent` with `{ parent_id: candidate.id }` → server sets `parent_id`, clears `suggested_parent_id`
- **Dismiss flow:** Client calls `PATCH /api/history/:id/dismiss-revision` → server sets `suggested_parent_id = null`
- **If user navigates away before deciding:** `suggested_parent_id` is already stored in DB → saved result page (`/history/:id`) shows a banner: "This looks like a revision of [title]. Link it?" with same confirm/dismiss actions
- **Banner persists** on result page until explicitly confirmed or dismissed

### 3. Score Delta Display

- **Where:** Saved result page only (`/history/:id`), inside the `Scorecard` section — NOT on the live streaming page
- **Trigger:** `result.parent_id` is set — fetch parent scores alongside result data
- **Format:** Inline per scorecard row, to the right of the score bar: `+0.5` in green (`text-green-600`) or `-1.0` in red (`text-red-500`), `±0.0` in muted; no arrow prefix
- **Weighted total delta:** If weighted total improved, show a `↑ Improved` badge next to the verdict badge (green bg, same wobbly border-radius style as verdict)
- **Data source:** Compute live — fetch parent row by `parent_id` in `getResultRoute`, return `parent_scores` alongside `scores` in API response

### 4. Version Chain Storage

- **Schema:** Two nullable columns added to `saved_results`:
  - `parent_id INTEGER REFERENCES saved_results(id) ON DELETE SET NULL` — set when user confirms revision
  - `suggested_parent_id INTEGER REFERENCES saved_results(id) ON DELETE SET NULL` — set by server on similarity match, cleared on dismiss
- **Chains:** Arbitrarily deep (v1 → v2 → v3 …); no artificial cap
- **Multiple children:** Allowed — one original can be the parent of many revision attempts
- **Phase 20 integration:** Profile page reads version chains via self-join on `parent_id`; Phase 19 only needs to store the relationship correctly

---

## Code Context

### Files to modify / create

| File | Change |
|------|--------|
| `server/db/init.js` | Migration: add `parent_id`, `suggested_parent_id` to `saved_results` |
| `server/routes/history.js` | `saveResultRoute`: add similarity check + `suggested_parent_id` INSERT; `getResultRoute`: return `parent_scores` if `parent_id` set; new `PATCH /api/history/:id/parent`; new `PATCH /api/history/:id/dismiss-revision` |
| `server/index.js` | Register new PATCH routes |
| `client/src/store/slices/validatorSlice.js` | Add `revisionCandidate` state + `setRevisionCandidate` / `clearRevisionCandidate` reducers |
| `client/src/hooks/useValidate.js` | Read `similarTo` from save response, dispatch `setRevisionCandidate` |
| `client/src/components/validator/RevisionModal.jsx` | New modal component — auto-appears when `revisionCandidate` set |
| `client/src/components/validator/ResultsPanel.jsx` | Mount `<RevisionModal />` when `status === 'done'` |
| `client/src/components/validator/Scorecard.jsx` | Accept `parentScores` prop, render inline deltas per row |
| `client/src/pages/ResultPage.jsx` | Pass `parent_scores` to `<Scorecard>`; show revision banner if `suggested_parent_id` set and `parent_id` null; show `↑ Improved` badge if delta positive |

### Key existing patterns to reuse

- `saveResultRoute` INSERT pattern → `server/routes/history.js:38`
- `generateNiche` / `generateAITitle` async-fire pattern → `server/routes/history.js:48`
- `getResultRoute` response shape → `server/routes/history.js` (add `parent_scores` field)
- `useValidate` auto-save + response reading → `client/src/hooks/useValidate.js:47`
- `VerdictBadge` wobbly border style → `client/src/components/validator/VerdictBadge.jsx:22` (reuse for `↑ Improved` badge)
- `DeleteConfirmModal` pattern → `client/src/components/validator/DeleteConfirmModal.jsx` (reuse for `RevisionModal` structure)
- `fetchWithAuth` → `client/src/utils/fetchWithAuth.js`

### npm dependency to add

`string-similarity` — server-side only (`npm install string-similarity` in `/server`)

---

## Deferred (out of Phase 19 scope)

- Version chain *display* on profile page → Phase 20
- Notification when revision scores higher than original → v3.0
