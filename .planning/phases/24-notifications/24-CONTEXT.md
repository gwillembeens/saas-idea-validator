# Phase 24: Notifications - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Notify users when social activity happens on their validations — likes and comments. In-app only (no email). Unread count badge on bell icon in NavBar. Dropdown for quick glance, `/notifications` page for full history. Users can mark notifications as read.

</domain>

<decisions>
## Implementation Decisions

### Notification surface
- **D-01:** Both a NavBar dropdown (quick glance) AND a full `/notifications` page (full history)
- **D-02:** Bell icon in NavBar with numeric badge — hidden when count is 0, shows number when unread exist
- **D-03:** Settings link removed from NavBar — it belongs on the profile page (reduces NavBar clutter)
- **D-04:** Empty state suggests engagement: "Share a validation to start getting likes and comments"

### Count freshness
- **D-05:** Poll `GET /api/notifications/unread-count` every 30 seconds while tab is active
- **D-06:** Pause polling when `document.visibilityState === 'hidden'` (backgrounded tab)
- **D-07:** Also refresh count on React Router navigation (location change)
- **D-08:** Optimistic zero — count clears immediately when dropdown opens (don't wait for server confirmation)

### Notification content
- **D-09:** Show actor username ("@alice liked your idea"); fallback to "Someone" when username is not set
- **D-10:** Include validation title in every notification ("…on *AI recruitment screener*")
- **D-11:** Click → navigate to `/history/:id` for both like and comment notifications
- **D-12:** Comment notifications pass navigation state to auto-open the CommentModal on the result page
- **D-13:** Group notifications: same event type + same validation = one entry showing count + most recent timestamp (e.g., "5 people liked *AI recruitment screener*")

### Read/unread management
- **D-14:** Auto-mark all notifications as read when dropdown opens
- **D-15:** Clicking an individual notification also marks it read
- **D-16:** "Mark all as read" button in dropdown header (for users who want explicit control)
- **D-17:** 30-day retention — backend filters `created_at > NOW() - INTERVAL '30 days'`; no manual delete UI
- **D-18:** No delete functionality — read/unread + retention is sufficient

### Claude's Discretion
- Exact dropdown positioning and animation
- Notification icon design within sketchbook system
- Skeleton/loading state for notification list
- Exact grouping threshold (how many actors before "N people" vs listing names)

</decisions>

<specifics>
## Specific Ideas

- Bell icon pattern: standard recognizable notification entry point, keeps avatar as identity-only
- Grouping model similar to GitHub notifications — one row per (event_type, result_id) pair
- CommentModal auto-open: use React Router `navigate('/history/:id', { state: { openComments: true } })` — ResultPage reads `location.state.openComments` on mount

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Phase context
- `.planning/ROADMAP.md` §Phase 24 — Success criteria: NOTIF-01, NOTIF-02
- `.planning/phases/23-social-interactions/23-04-SUMMARY.md` — CommentModal pattern (grid-level state, how it's opened)

### Existing social infrastructure
- `server/routes/social.js` — likes and comments write paths (source of notification triggers)
- `server/db/init.js` — migration pattern to follow for new `notifications` table
- `client/src/components/social/CommentModal.jsx` — modal to auto-open on comment notification click
- `client/src/components/layout/NavBar.jsx` — where bell icon + badge go; Settings link to remove

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CommentModal`: Already accepts `resultId` + `onClose` — can be triggered by navigation state on ResultPage
- `Avatar` in NavBar: Bell icon sits alongside avatar; no need to badge the avatar itself
- `optionalAuth` middleware: Notification list endpoint should use `requireAuth` (private data)
- `requireAuth` middleware: All notification write endpoints (mark read, etc.) use this

### Established Patterns
- Polling pattern: No existing polling hook — needs a new `useNotifications` hook following the same shape as `useLeaderboard` (loading/error/data state, exposed as custom hook)
- Navigation state: React Router `navigate(path, { state })` + `useLocation().state` — clean way to pass `openComments: true` without URL params
- DB migration: `runMigrations()` in `server/db/init.js` — add `notifications` table there with `CREATE TABLE IF NOT EXISTS`

### Integration Points
- `server/routes/social.js` `toggleLikeRoute` and `postCommentRoute` — insert notification row after successful like/comment (skip self-notifications: actor_id !== owner_id)
- `client/src/components/layout/NavBar.jsx` — add bell icon + badge, remove Settings link
- `client/src/pages/ResultPage.jsx` — read `location.state.openComments` on mount to auto-open CommentModal
- `server/index.js` — register new notification routes

</code_context>

<deferred>
## Deferred Ideas

- Email notifications — explicitly out of scope for this phase
- Push notifications (browser/PWA) — future phase
- Notification preferences / mute settings — future phase
- Real-time delivery via WebSocket/SSE — future phase; polling is sufficient for v2.0

</deferred>

---

*Phase: 24-notifications*
*Context gathered: 2026-03-24*
