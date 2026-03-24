# Phase 24: Notifications — Research

**Date:** 2026-03-24
**Objective:** Deliver unread notification count, grouped notification list, and auto-open comments flow.

---

## Database Schema

### `notifications` table DDL

Add to `server/db/init.js` in `runMigrations()`:

```sql
-- Phase 24: Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('like', 'comment')),
  result_id UUID NOT NULL REFERENCES saved_results(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON notifications(recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_event_result_idx
  ON notifications(recipient_id, event_type, result_id, is_read);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON notifications(created_at DESC);
```

**Schema Notes:**
- `recipient_id` — owner of the validation (receives the notification)
- `actor_id` — user who performed the action (liker/commenter)
- `event_type` — only 'like' | 'comment'; replies deferred
- `result_id` — validation ID, used for grouping + navigation
- `is_read` — default false; soft read state, no deletion
- First index: powers fast `WHERE recipient_id=$1 AND is_read=false` unread count
- Second index: powers grouping query by (event_type, result_id)

---

## Notification Triggers

### 1. Like Trigger — `toggleLikeRoute` (server/routes/social.js)

After `INSERT INTO likes` (when `liked === true`), before the count query:

```javascript
// Look up result owner
const resultOwnerResult = await pool.query(
  'SELECT user_id FROM saved_results WHERE id = $1',
  [resultId]
)
const resultOwner = resultOwnerResult.rows[0]?.user_id

// Insert notification only if actor !== owner (no self-notifications)
if (resultOwner && resultOwner !== userId) {
  await pool.query(
    `INSERT INTO notifications (recipient_id, actor_id, event_type, result_id)
     VALUES ($1, $2, 'like', $3)`,
    [resultOwner, userId, resultId]
  )
}
```

**Key points:**
- Only insert when `liked === true` (unliking keeps historical notification)
- Skip if `actor_id === result owner_id`

### 2. Comment Trigger — `postCommentRoute` (server/routes/social.js)

After `INSERT INTO comments`, before the username lookup:

```javascript
// Look up result owner
const resultOwnerResult = await pool.query(
  'SELECT user_id FROM saved_results WHERE id = $1',
  [resultId]
)
const resultOwner = resultOwnerResult.rows[0]?.user_id

// Insert notification only if actor !== owner
if (resultOwner && resultOwner !== userId) {
  await pool.query(
    `INSERT INTO notifications (recipient_id, actor_id, event_type, result_id)
     VALUES ($1, $2, 'comment', $3)`,
    [resultOwner, userId, resultId]
  )
}
```

### 3. Reply Trigger — DEFERRED

Phase 24 only notifies result owner. Reply-author notifications are a future phase.

---

## API Endpoints

### GET /api/notifications/unread-count

Fast poll for badge count (30s interval).

```javascript
export async function getUnreadCountRoute(req, res) {
  const userId = req.user.id
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE recipient_id = $1 AND is_read = false`,
      [userId]
    )
    return res.json({ count: result.rows[0].count ?? 0 })
  } catch (err) {
    console.error('getUnreadCountRoute error:', err)
    return res.status(500).json({ error: 'Failed to fetch unread count' })
  }
}
```

### GET /api/notifications

Grouped notification list for dropdown and full page.

```javascript
export async function getNotificationsRoute(req, res) {
  const userId = req.user.id
  try {
    const { rows } = await pool.query(
      `SELECT
         n.event_type,
         n.result_id,
         sr.title AS validation_title,
         COUNT(DISTINCT n.actor_id)::int AS actor_count,
         MAX(n.created_at) AS most_recent_at,
         (SELECT u.username FROM notifications n2
          LEFT JOIN users u ON u.id = n2.actor_id
          WHERE n2.recipient_id = $1
            AND n2.event_type = n.event_type
            AND n2.result_id = n.result_id
          ORDER BY n2.created_at DESC
          LIMIT 1) AS most_recent_actor_username,
         bool_or(NOT n.is_read) AS is_unread
       FROM notifications n
       LEFT JOIN saved_results sr ON n.result_id = sr.id
       WHERE n.recipient_id = $1
         AND n.created_at > NOW() - INTERVAL '30 days'
       GROUP BY n.event_type, n.result_id, sr.title
       ORDER BY MAX(n.created_at) DESC
       LIMIT 50`,
      [userId]
    )
    return res.json(rows)
  } catch (err) {
    console.error('getNotificationsRoute error:', err)
    return res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}
```

**Response shape per row:**
```json
{
  "event_type": "like",
  "result_id": "uuid",
  "validation_title": "AI recruitment screener",
  "actor_count": 5,
  "most_recent_at": "2026-03-24T14:32:10Z",
  "most_recent_actor_username": "alice",
  "is_unread": true
}
```

### POST /api/notifications/mark-read

Mark all notifications as read (no body needed for "mark all").

```javascript
export async function markReadRoute(req, res) {
  const userId = req.user.id
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE recipient_id = $1 AND is_read = false`,
      [userId]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('markReadRoute error:', err)
    return res.status(500).json({ error: 'Failed to mark notifications as read' })
  }
}
```

### Route registration (server/index.js)

```javascript
import { getUnreadCountRoute, getNotificationsRoute, markReadRoute } from './routes/notifications.js'

app.get('/api/notifications/unread-count', requireAuth, getUnreadCountRoute)
app.get('/api/notifications', requireAuth, getNotificationsRoute)
app.post('/api/notifications/mark-read', requireAuth, markReadRoute)
```

**Important:** Register `/api/notifications/unread-count` BEFORE `/api/notifications` so Express doesn't match "unread-count" as an `:id` param.

---

## Frontend Architecture

### useNotifications Hook

`client/src/hooks/useNotifications.js` — follows `useLeaderboard` pattern:

```javascript
import { useState, useEffect, useCallback, useRef } from 'react'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count)
    } catch {}
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data)
    } catch {}
  }, [])

  const markAllRead = useCallback(async () => {
    setUnreadCount(0) // Optimistic zero
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
    } catch {}
  }, [])

  useEffect(() => {
    fetchUnreadCount()

    function start() {
      intervalRef.current = setInterval(fetchUnreadCount, 30000)
    }
    function stop() {
      clearInterval(intervalRef.current)
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') stop()
      else { start(); fetchUnreadCount() }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [fetchUnreadCount])

  return { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAllRead }
}
```

### NavBar changes (client/src/components/layout/NavBar.jsx)

- Import `Bell` from `lucide-react`
- Import `useNotifications` hook
- Add bell button + badge (hidden when count = 0)
- Remove Settings `<Link>` from NavBar (D-03)
- Add `NotificationDropdown` controlled by `showDropdown` state
- On bell click: call `markAllRead()`, `fetchNotifications()`, toggle dropdown

### Refresh on navigation (D-07)

In NavBar, use `useLocation()` to trigger `fetchUnreadCount()` on route changes:
```javascript
const location = useLocation()
useEffect(() => { fetchUnreadCount() }, [location.pathname, fetchUnreadCount])
```

### NotificationDropdown Component

`client/src/components/notifications/NotificationDropdown.jsx`:
- Positioned absolutely below bell icon (top-full right-0)
- Click-outside closes via `useRef` + mousedown listener
- Renders grouped notifications; empty state: "Share a validation to start getting likes and comments"
- Header: "Notifications" + "Mark all as read" button
- Footer: "View all notifications →" link to `/notifications`
- Comment rows: `navigate('/history/:id', { state: { openComments: true } })`
- Like rows: `navigate('/history/:id')`
- Unread indicator: subtle dot or highlight background
- Sketchbook style: wobbly border, hard shadow, pencil/paper colors

### NotificationsPage

`client/src/pages/NotificationsPage.jsx`:
- Fetches full grouped list on mount
- Same grouping display as dropdown but full-width Cards
- Mark all read button in header
- Card decoration: `tack` for unread, `none` for read
- Empty state: engagement suggestion
- Route: `/notifications` in App.jsx router

### ResultPage — Auto-open CommentModal

`client/src/pages/ResultPage.jsx`:
```javascript
const location = useLocation()

useEffect(() => {
  if (location.state?.openComments) {
    setShowComments(true)
  }
}, []) // Only on mount
```

---

## Integration Points

### Social routes → notifications table

```
toggleLikeRoute:  INSERT likes → INSERT notifications (event_type='like')
postCommentRoute: INSERT comments → INSERT notifications (event_type='comment')
```

### Polling chain

```
NavBar mounts → useNotifications → fetchUnreadCount() + start 30s interval
location changes → fetchUnreadCount() (D-07)
tab hidden → clearInterval
tab visible → restart interval + immediate fetch
```

### Dropdown open → mark read → re-fetch

```
handleBellClick → markAllRead() [optimistic zero] → fetchNotifications() → setShowDropdown(true)
```

### Notification click → ResultPage

```
comment notif: navigate('/history/:id', { state: { openComments: true } })
like notif:    navigate('/history/:id')
ResultPage useEffect: if location.state?.openComments → setShowComments(true)
```

---

## Validation Architecture

### Test Scenarios

**Scenario 1: Like own validation — no notification**
1. User A likes their own public validation
2. Verify: `SELECT COUNT(*) FROM notifications WHERE actor_id=A AND result_id=X` → 0
3. NavBar badge does NOT appear

**Scenario 2: Like another's validation — notification created**
1. User B likes User A's public validation
2. Verify: `SELECT * FROM notifications WHERE recipient_id=A AND actor_id=B AND event_type='like'` → 1 row
3. GET `/api/notifications/unread-count` for User A → `{ count: 1 }`
4. NavBar badge shows 1

**Scenario 3: Comment creates notification**
1. User B comments on User A's public validation
2. Verify: notification row created with `event_type='comment'`
3. User A's badge shows 1

**Scenario 4: Multiple actors group correctly**
1. User B likes User A's validation → notification 1
2. User C likes User A's validation → notification 2 (same group)
3. User B comments → notification 3 (separate group)
4. GET `/api/notifications` for User A → 2 rows: `[{event_type:'like', actor_count:2}, {event_type:'comment', actor_count:1}]`

**Scenario 5: Dropdown open clears badge (optimistic zero)**
1. User A has 3 unread; badge shows 3
2. User A clicks bell icon
3. Badge clears to 0 immediately (before server response)
4. Server: `UPDATE notifications SET is_read=true WHERE recipient_id=A`

**Scenario 6: Comment notification click auto-opens CommentModal**
1. User A clicks comment notification row
2. `navigate('/history/:id', { state: { openComments: true } })` fires
3. ResultPage mounts; `location.state.openComments === true`
4. CommentModal appears automatically

**Scenario 7: Like notification click — no modal**
1. User A clicks like notification row
2. `navigate('/history/:id')` fires (no state)
3. ResultPage mounts; CommentModal does NOT appear

**Scenario 8: 30-day retention**
1. Seed notification with `created_at = NOW() - INTERVAL '35 days'`
2. GET `/api/notifications` → old notification absent
3. Verify WHERE clause filters: `created_at > NOW() - INTERVAL '30 days'`

**Scenario 9: Polling pauses on hidden tab**
1. Confirm 30s poll fires during active session
2. Switch browser tab → `document.visibilityState = 'hidden'`
3. Verify: no requests to `/api/notifications/unread-count` while hidden
4. Switch back → immediate fetch + polling resumes

**Scenario 10: Mark all as read button**
1. 3 unread notifications in dropdown
2. User clicks "Mark all as read" header button
3. All rows lose unread highlight; badge stays 0

### Success Criteria Verification Checklist

- [ ] **NOTIF-01:** Like triggers notification for result owner (not self)
- [ ] **NOTIF-02:** Comment triggers notification for result owner (not self)
- [ ] **SC-3:** Bell badge visible with count, hidden when 0
- [ ] **SC-4:** Dropdown shows grouped notifications; /notifications page shows full history
- [ ] **SC-5:** Mark as read clears badge and updates visual state

---

## RESEARCH COMPLETE
