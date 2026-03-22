# Phase 17 — Publish & Privacy: Context

**Phase goal:** Add public/private toggle on result page and history page; enforce visibility on leaderboard queries. Privacy = leaderboard visibility, NOT access control.

---

## Decision A — Toggle UI on ResultPage

- Toggle lives **inside ActionButtons** component, rendered only when `result?.isOwner` is true
- Single button that swaps label: **"Make Public"** (when private) / **"Make Private"** (when public)
- Strictly hidden from non-owners — no read-only indicator for visitors
- **Optimistic update**: flip UI state immediately on click; revert silently if server returns an error

## Decision B — Default Visibility

- `is_public` defaults to **`true`** (public) — both new saves and existing DB rows
- DB migration: `ALTER TABLE saved_results ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true`; no backfill UPDATE needed (DEFAULT covers existing rows)
- `POST /api/history` response must include `is_public` so client can render the correct toggle state immediately without a follow-up fetch
- No nudge or onboarding prompt needed — public is the default, nothing to remind users about
- **Overrides roadmap**: roadmap said "default private" — user explicitly confirmed default is **public**

## Decision C — Share Link Semantics

- `is_public` controls **leaderboard visibility only** — it is NOT an access gate
- `GET /api/history/:id` stays on `optionalAuth` with no behaviour change — anyone with the URL can view the result regardless of `is_public`
- Share buttons (Twitter/LinkedIn/WhatsApp) remain visible on all result pages — owner decides whether to share the link
- Phase 18 leaderboard query will `WHERE is_public = true`; that is the only place privacy is enforced

## Decision D — History Page Visibility

- Each HistoryCard **footer row** shows:
  1. Verdict pill
  2. Niche pill
  3. **Public/Private badge** (small label matching existing pill style)
  4. **"Make Private" / "Make Public"** action button (text or small button)
  5. Date
  6. Delete icon
- Toggle button in HistoryCard calls the same `PATCH /api/history/:id/visibility` endpoint
- **Optimistic in-place update**: flip item's `is_public` in local state immediately; revert on server error — no full list refetch

---

## Code Context

### Files to modify

| File | Change |
|------|--------|
| `server/routes/history.js` | Add `PATCH /api/history/:id/visibility` route; include `is_public` in all SELECT responses |
| `server/index.js` | Register new PATCH route with `requireAuth` |
| `client/src/components/validator/ActionButtons.jsx` | Add owner-only toggle button; accept `isPublic` + `onToggleVisibility` props |
| `client/src/pages/ResultPage.jsx` | Pass `is_public` and toggle handler to ActionButtons |
| `client/src/components/history/HistoryCard.jsx` | Add Public/Private badge + toggle button in footer row; accept `onToggleVisibility` prop |
| `client/src/pages/HistoryPage.jsx` | Handle optimistic visibility toggle in item list state |

### DB migration

```sql
ALTER TABLE saved_results ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;
```

No backfill needed — `DEFAULT true` applies to all existing rows.

### New API endpoint

```
PATCH /api/history/:id/visibility
Body: { is_public: boolean }
Auth: requireAuth (owner-only)
Response: { id, is_public }
```

### Existing endpoints to update

- `POST /api/history` response → add `is_public`
- `GET /api/history` response items → add `is_public`
- `GET /api/history/:id` response → add `is_public`

---

## Deferred Ideas

- Per-result analytics (view count) — noted for later phase
- Bulk publish/unpublish from history page — noted for later
