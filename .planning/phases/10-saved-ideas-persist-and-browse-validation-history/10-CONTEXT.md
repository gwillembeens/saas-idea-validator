---
phase: 10
name: Saved ideas — persist and browse validation history
status: context_complete
created: 2026-03-21
---

# Phase 10 Context — Saved Ideas & Validation History

## Goal

After each validation, the result is automatically saved to the database and tied to the authenticated user. Users can browse their history, revisit past results, rename or delete entries, and share any result publicly via a link.

---

<domain>
## Phase Boundary

Deliver: auto-save of validation results, a `/history` browse page (infinite scroll, sort by date or score), a `/history/:id` read-only result view, lazy title editing, soft delete with confirmation, and public shareable links (X, LinkedIn, WhatsApp). Re-validation from a saved result is in scope. Exporting as PDF/image, team sharing, and rate limiting are deferred.

</domain>

<decisions>
## Implementation Decisions

### Saving behaviour
- **D-01:** Auto-save triggers automatically when validation completes (`status === 'done'` in Redux) — no manual save button
- **D-02:** Saved immediately after stream ends; the user does not need to take any action
- **D-03:** Stored fields: `id` (UUID), `user_id`, `title` (AI-generated), `idea_text` (raw input), `markdown_result` (full streamed output), `scores` (JSON: `{ phase1, phase2, phase3, phase4, weighted }`), `created_at`, `updated_at`, `deleted_at` (null if active)
- **D-04:** Title is AI-generated (3–4 word summary via a secondary Claude call) and applied lazily — not blocking the save. Title defaults to the first 6 words of the idea until the AI title resolves
- **D-05:** Users can rename the title inline from the history list (click-to-edit, save on blur/Enter)

### Soft delete
- **D-06:** Delete is soft — sets `deleted_at` timestamp, data stays in DB
- **D-07:** Deletion requires a confirmation dialog: "Delete this result? This cannot be undone." with Cancel / Delete buttons
- **D-08:** Soft-deleted results are excluded from all API queries but preserved in the database (best practice for data integrity and potential recovery)

### History browse — `/history`
- **D-09:** Separate page at `/history`, linked from the app header (nav link alongside Sign In / Sign Out)
- **D-10:** Default sort: date added (newest first). Users can toggle to score ranking (weighted score, highest first) — single toggle button, not tabs
- **D-11:** Infinite scroll: load 10 results on mount, fetch 10 more as the user scrolls to the bottom. No pagination UI.
- **D-12:** Each list entry shows: AI title, idea text snippet (first ~100 chars), weighted score with VerdictBadge colour, date added, and a delete button
- **D-13:** Entire entry card is clickable → navigates to `/history/:id`

### Result view — `/history/:id`
- **D-14:** Dedicated route `/history/:id` with its own layout — no input form, just the full card view (Scorecard, VerdictBadge, all commentary cards from Phase 8)
- **D-15:** Read-only view. No streaming — renders stored `markdown_result` directly
- **D-16:** "Re-validate" button loads the `idea_text` back into Redux `idea` field and redirects to `/` — the user can then edit and re-run
- **D-17:** Public access: anyone with the link can view this page without logging in. Shared result belongs to the owner's account; visitor gets read-only access to that single result. If visitor clicks "Validate my own idea" or any auth-required action, the auth modal appears.

### Sharing
- **D-18:** Share buttons on the `/history/:id` view: X (Twitter), LinkedIn, WhatsApp
- **D-19:** Share payload is a link to the public `/history/:id` URL — not a screenshot or text snippet
- **D-20:** Share links are constructed client-side using platform intent URLs:
  - X: `https://twitter.com/intent/tweet?url=<url>&text=<summary>`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=<url>`
  - WhatsApp: `https://wa.me/?text=<url>`
- **D-21:** Share text pre-fills with: "I just validated my startup idea '[title]' — scored [weighted]/5. Check it out:"

### Claude's Discretion
- Database table name (`saved_results` or `validations`) and column naming
- Title generation prompt wording and fallback handling if AI call fails
- Exact scroll trigger threshold for infinite scroll (e.g., 200px from bottom)
- Empty state design for zero saved results
- Loading skeleton for the history list
- Error handling for failed auto-saves (silent retry vs. toast notification)
- Auth redirect behaviour for unauthenticated visitors on `/history` (redirect to `/` with login modal vs. show empty state with "sign in to see your history")

</decisions>

<specifics>
## Specific Ideas

- Title editing: click-to-edit inline on the history list entry — not a separate modal. Save on blur or Enter key.
- The history list should feel like a "notebook of ideas" — consistent with the hand-drawn design system (Card components, wobbly borders, hard shadows).
- Re-validate from `/history/:id` should feel like a one-click action — pre-fills the form and auto-triggers immediately (same pattern as the auth gate auto-proceed from Phase 9).
- Public shared links: visitor experience should be clean and readable even without an account. A subtle "Create your own validation →" CTA at the bottom of the shared view is acceptable (but not a pop-up).

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Existing codebase — must read before planning
- `CLAUDE.md` — design system spec, tech stack, Redux patterns, component API
- `server/index.js` — Express setup, auth middleware mounting pattern
- `server/routes/auth.js` — pattern for route handlers to follow
- `server/db/init.js` — `pool` export for PostgreSQL queries
- `server/db/schema.sql` — existing tables (users, refresh_tokens, etc.) — new `saved_results` table extends this schema
- `server/middleware/requireAuth.js` — `requireAuth` middleware for protected routes
- `server/utils/jwt.js` — `signAccessToken`, `verifyAccessToken` — used for optional auth on public result view
- `client/src/store/slices/validatorSlice.js` — `status`, `result`, `idea` fields — auto-save triggers on `status === 'done'`
- `client/src/store/slices/authSlice.js` — `user`, `accessToken` — needed to associate saves with user
- `client/src/hooks/useValidate.js` — streaming hook — auto-save fires after `finishValidation` dispatch
- `client/src/utils/fetchWithAuth.js` — authenticated fetch wrapper with token refresh — use for all save/history API calls
- `client/src/components/ui/Card.jsx` — reuse for history list entries and result view
- `client/src/components/ui/Button.jsx` — reuse for delete, re-validate, share actions
- `client/src/components/validator/Scorecard.jsx` — reuse in `/history/:id` view
- `client/src/components/validator/VerdictBadge.jsx` — reuse in history list entries and result view
- `client/src/utils/parseResult.js` — `parseScores()` — already extracts scores from markdown; re-use for display

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` + `Button` + `VerdictBadge` + `Scorecard` — all reusable directly in history list and result view
- `fetchWithAuth` — drop-in for all authenticated API calls (save, list, delete, rename)
- `parseResult.js` → `parseScores()` — use when storing scores at save time (run once on `result` string, persist the output as JSON)
- `validatorSlice` — `status`, `result`, `idea` already in Redux; auto-save middleware/effect reads these on `status === 'done'`
- `requireAuth` middleware — apply to all `/api/history/*` write routes; optional auth (read token if present, don't require it) for `GET /api/history/:id` public view

### Established Patterns
- Express route handlers as named exports from `server/routes/*.js` — mirror for `server/routes/history.js`
- Redux slices for all app state — new `historySlice` manages `{ items, status, hasMore, sort }` for the browse page
- Custom hooks (`useValidate`, `useAuth`) — new `useHistory` hook for list/load/delete/rename operations
- Soft delete pattern already used in auth (refresh token deletion) — extend with `deleted_at` column for `saved_results`
- Page routing: no React Router in app yet — Phase 10 needs to add a router OR use a simpler hash-based or state-based navigation approach

### Integration Points
- **Auto-save trigger**: `useValidate` hook — after `dispatch(finishValidation())`, fire a save POST to `/api/history`
- **Title generation**: secondary Claude API call server-side (POST `/api/history` receives idea_text, backend generates title async, updates the record)
- **Header nav**: `client/src/App.jsx` header — add "History" nav link alongside `SignInButton` (only shown when authenticated)
- **Re-validate**: `/history/:id` view dispatches `setIdea(idea_text)` to Redux then navigates to `/` — same slice action already defined
- **Public result view**: `/history/:id` needs an optional-auth middleware (extracts user from token if present, does not reject if absent) for the backend read endpoint

### Critical Note — Routing
The app currently has no client-side router (React Router or similar). Phase 10 needs `/history` and `/history/:id` routes. Options:
1. Install `react-router-dom` v6 — standard, well-supported
2. Use hash-based routing — simpler but URLs look like `/#/history/123`

React Router v6 is the correct choice given shareable URLs are a requirement (D-17 through D-21).

</code_context>

<deferred>
## Deferred Ideas

- PDF/image export of a saved result — future phase
- Team/organisation shared workspaces — future phase
- Tagging or categorising saved results — future phase
- Rate limiting on validations per user — Phase 9 deferred, still pending
- "Duplicate and re-validate" as a distinct action (vs. the re-validate flow in D-16) — could be added later
- Bulk delete — future phase
- Sorting/filtering by verdict label (Strong Signal, Promising, etc.) — future phase
- Embedding a result in a public website — future phase

</deferred>

---

*Phase: 10-saved-ideas-persist-and-browse-validation-history*
*Context gathered: 2026-03-21*
