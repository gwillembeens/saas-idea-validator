# Phase 10 Research — Saved Ideas & Validation History

## Existing Codebase Findings

### Current Architecture
- **Frontend**: React 18 + Vite + Redux Toolkit + Tailwind v3
- **Backend**: Express.js on Node.js with PostgreSQL
- **Auth**: JWT (access 15m + refresh 30d), bcrypt hashing, email verification, OAuth (Google + GitHub)
- **Design**: Hand-drawn sketchbook aesthetic with wobbly borders, hard shadows, Kalam/Patrick Hand fonts
- **Routing**: Currently **NO client-side router** — single-page app with URL params handling in App.jsx

### Reusable Infrastructure
1. **Redux patterns**: `validatorSlice` (idea, status, result, error) + `authSlice` (user, accessToken, modal state)
2. **Fetch wrapper**: `fetchWithAuth` automatically includes Bearer token and handles 401 refresh/retry
3. **Database layer**: `pool` from pg exports for queries; schema uses UUID PKs and timestampz columns
4. **Middleware**: `requireAuth` enforces JWT; can be adapted for optional auth
5. **Parsing**: `parseScores(markdown)` extracts phase scores from validator output
6. **Components**: `Card`, `Button`, `VerdictBadge`, `Scorecard` are design-system compatible and reusable

### Key Integration Points
- `useValidate()` hook dispatches `finishValidation()` when stream ends — this is **the auto-save trigger**
- `authSlice` has `user` + `accessToken` for authenticated requests
- `App.jsx` handles OAuth/email/reset redirects via URL params — same pattern can work for history navigation
- Express mounts routes as: `app.post('/api/auth/register', registerRoute)` — follow this for `/api/history/*` routes
- Error handling: silent catch → error state in Redux; backend returns JSON error + HTTP status code

---

## Technical Approach by Area

### 1. React Router v6 Integration

#### Recommended Approach
Install `react-router-dom` v6 and wrap the app with `<BrowserRouter>` in `main.jsx`. This is the standard choice for shareable URLs (vs. hash-based routing). All Phase 10 routes will work with clean `/history` and `/history/:id` URLs.

#### Key Implementation Details

**Installation**:
```bash
npm install react-router-dom@latest
```

**main.jsx** (before App):
```jsx
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)
```

**App.jsx** structure:
```jsx
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { HistoryPage } from './pages/HistoryPage'
import { ResultPage } from './pages/ResultPage'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id" element={<ResultPage />} />
      </Routes>
    </AppShell>
  )
}
```

**Code organization**:
- Create `/client/src/pages/` directory for page-level components
- `HomePage` wraps existing hero + input + results (current App.jsx content)
- `HistoryPage` is the new `/history` browse page
- `ResultPage` renders `/history/:id` public result view
- Navigation via `<Link to="/history">` or `useNavigate()` hook

#### Gotchas & Pitfalls
- **URL params in current App.jsx**: OAuth redirects (`?accessToken=...`), email verify (`?verified=true`), password reset (`?reset=...`) will still work — extract them in `useEffect` before router
- **Vite proxy**: Keep `/api` → `http://localhost:3001` in `vite.config.js` (already configured)
- **Design system portability**: `AppShell` with dot-grid background stays as outer wrapper; each page is a child of `AppShell`
- **Mobile nav**: Add a collapsible menu for mobile users to access History link (or put it in header)

#### Code Patterns
```jsx
// Navigate programmatically
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/history/123')

// Access route params
import { useParams } from 'react-router-dom'
const { id } = useParams()

// Pre-fill form and redirect from /history/:id
const navigate = useNavigate()
const dispatch = useDispatch()
dispatch(setIdea(idea_text))
navigate('/')  // Will auto-scroll to input or trigger validation
```

---

### 2. PostgreSQL Auto-Save Pattern

#### Recommended Approach
**Implement in `useValidate()` hook as a side effect after `finishValidation()` dispatches.** This keeps auto-save logic colocated with validation and avoids middleware complexity.

Option analysis:
| Option | Pros | Cons |
|--------|------|------|
| **In hook** | Simple, direct, testable; save fires only once | Couples validation to save; harder to retry |
| **Redux middleware** | Decoupled; can intercept any action | Overkill; harder to debug; error handling unclear |
| **useEffect on status** | Reactive; can handle retries | Race conditions if status changes during save |

**Winner: In-hook pattern** — simplest, least magical.

#### Key Implementation Details

**useValidate.js** modified:
```jsx
export function useValidate() {
  const dispatch = useDispatch()
  const { idea, status, result, error } = useSelector(s => s.validator)
  const { user, accessToken } = useSelector(s => s.auth)

  async function validate() {
    dispatch(startValidation())
    try {
      const res = await fetch('/api/validate', {...})
      dispatch(startStreaming())
      // ... stream loop ...
      dispatch(finishValidation())

      // AUTO-SAVE trigger — fires AFTER stream ends
      if (accessToken && user) {
        saveValidation(idea, result, accessToken)
      }
    } catch (e) {
      dispatch(setError(e.message))
    }
  }

  async function saveValidation(ideaText, markdownResult, token) {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idea_text: ideaText,
          markdown_result: markdownResult,
        }),
      })
      // Silently fail — don't interrupt UX if save fails
      if (!res.ok) console.error('Save failed:', res.status)
    } catch (e) {
      console.error('Auto-save error:', e)
      // Could dispatch a toast notification here, but D-02 says silent
    }
  }

  return { idea, status, result, error, validate }
}
```

**Backend route** `/api/history` POST:
```js
// POST /api/history
// Body: { idea_text, markdown_result }
// Returns: { id, title, created_at }
// Auto-saves on validation complete; title generated async

export async function saveResultRoute(req, res) {
  const { idea_text, markdown_result } = req.body
  const user = req.user  // from requireAuth middleware

  if (!idea_text || !markdown_result) {
    return res.status(400).json({ error: 'idea_text and markdown_result required' })
  }

  try {
    // Parse scores immediately
    const scores = parseScores(markdown_result)

    // Insert with default title (first 6 words of idea)
    const defaultTitle = idea_text.split(' ').slice(0, 6).join(' ')
    const { rows } = await pool.query(
      `INSERT INTO saved_results
       (user_id, idea_text, markdown_result, title, scores)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, created_at`,
      [user.id, idea_text, markdown_result, defaultTitle, JSON.stringify(scores)]
    )

    const result = rows[0]
    res.status(201).json({ id: result.id, title: result.title, created_at: result.created_at })

    // Async title generation (non-blocking)
    generateTitleAsync(result.id, idea_text, user.id)
  } catch (e) {
    console.error('Save result error:', e)
    res.status(500).json({ error: 'Failed to save result' })
  }
}

function generateTitleAsync(resultId, ideaText, userId) {
  // Fire and forget — no await, no error handling in request path
  (async () => {
    try {
      const client = new Anthropic()
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        system: 'Generate a 3-4 word title summarizing this startup idea. Return ONLY the title, no quotes.',
        messages: [{ role: 'user', content: ideaText.substring(0, 500) }],
      })

      const title = response.content[0].text.trim().slice(0, 100)
      await pool.query(
        'UPDATE saved_results SET title = $1 WHERE id = $2',
        [title, resultId]
      )
    } catch (e) {
      console.error('Title generation failed:', e)
      // Title stays as default — no error to user
    }
  })()
}
```

#### Gotchas & Pitfalls
- **Race condition**: If validation ends but `accessToken` is null (just logged out), save won't fire. This is acceptable (D-02: auto-save only works when authenticated).
- **Silent failures**: If network fails during save, validation UX is not interrupted. Consider adding a subtle background toast if needed, but don't block.
- **Async title generation**: Using `(async () => { ... })()` IIFE avoids blocking the response. If title generation takes >30s and the server restarts, the update is lost. This is acceptable for v1.
- **Duplicate saves**: If user validates the same idea twice in quick succession, two records are created. This is correct behavior.

#### Code Patterns
```js
// Helper to parse scores server-side (reuse from client)
function parseScores(markdown) {
  try {
    const rows = markdown.match(/\|\s*([\d.]+)\/5\s*\|/g)
    if (!rows || rows.length < 4) return null
    const scores = rows.slice(0, 4).map(r => parseFloat(r.match(/[\d.]+/)[0]))
    const weighted = +(scores[0] * 0.30 + scores[1] * 0.25 + scores[2] * 0.35 + scores[3] * 0.10).toFixed(1)
    return { phase1: scores[0], phase2: scores[1], phase3: scores[2], phase4: scores[3], weighted }
  } catch {
    return null
  }
}

// Use fetchWithAuth for all history calls (already handles token + refresh)
const res = await fetchWithAuth('/api/history', {
  method: 'POST',
  body: JSON.stringify({ /* ... */ }),
})
```

---

### 3. Infinite Scroll with IntersectionObserver

#### Recommended Approach
**Cursor-based pagination** (not offset) is better for this use case. Why: offset skips rows on sorted tables (if sorting by date, older results are stable; if sorting by score, results shift as new validations arrive). Cursor avoids this.

Pattern:
1. Load 10 results on mount: `GET /api/history?limit=10&sort=date` (returns 10 items + `nextCursor`)
2. When user scrolls to bottom, fetch next 10: `GET /api/history?limit=10&sort=date&cursor=<id>`
3. Repeat until `nextCursor` is null (no more results)

#### Key Implementation Details

**Backend endpoint** `GET /api/history`:
```js
export async function listResultsRoute(req, res) {
  const { limit = 10, sort = 'date', cursor } = req.query
  const user = req.user

  let query = `
    SELECT id, title, idea_text, scores, created_at
    FROM saved_results
    WHERE user_id = $1 AND deleted_at IS NULL
  `
  const params = [user.id]
  let paramIdx = 2

  // Pagination
  if (cursor) {
    if (sort === 'date') {
      query += ` AND created_at < (SELECT created_at FROM saved_results WHERE id = $${paramIdx})`
    } else if (sort === 'score') {
      query += ` AND (scores->>'weighted')::float < (SELECT (scores->>'weighted')::float FROM saved_results WHERE id = $${paramIdx})`
    }
    params.push(cursor)
    paramIdx++
  }

  // Sort
  if (sort === 'date') {
    query += ' ORDER BY created_at DESC'
  } else if (sort === 'score') {
    query += ` ORDER BY (scores->>'weighted')::float DESC`
  }

  query += ` LIMIT ${parseInt(limit) + 1}` // +1 to detect if more exist

  const { rows } = await pool.query(query, params)

  // Check if there are more results
  let nextCursor = null
  if (rows.length > parseInt(limit)) {
    rows.pop() // Remove the extra row
    nextCursor = rows[rows.length - 1].id
  }

  res.json({
    items: rows,
    nextCursor,
    hasMore: nextCursor !== null,
  })
}
```

**Frontend hook** `useHistory`:
```jsx
import { useCallback, useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { fetchWithAuth } from '../utils/fetchWithAuth'

export function useHistory() {
  const { accessToken } = useSelector(s => s.auth)
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done
  const [sort, setSort] = useState('date') // date | score
  const [hasMore, setHasMore] = useState(true)
  const cursorRef = useRef(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !accessToken) return
    loadingRef.current = true
    setStatus('loading')

    try {
      const url = new URL('/api/history', window.location.origin)
      url.searchParams.set('limit', '10')
      url.searchParams.set('sort', sort)
      if (cursorRef.current) {
        url.searchParams.set('cursor', cursorRef.current)
      }

      const res = await fetchWithAuth(url.toString())
      if (!res.ok) throw new Error('Failed to load history')

      const data = await res.json()
      setItems(prev => (cursorRef.current ? [...prev, ...data.items] : data.items))
      cursorRef.current = data.nextCursor
      setHasMore(data.hasMore)
      setStatus('done')
    } catch (e) {
      setStatus('error')
      console.error('Load history error:', e)
    } finally {
      loadingRef.current = false
    }
  }, [accessToken, sort])

  const changeSort = useCallback((newSort) => {
    setSort(newSort)
    setItems([]) // Reset list
    cursorRef.current = null
    setHasMore(true)
    // Don't auto-load — let useEffect handle it
  }, [])

  // Load on mount and when sort changes
  useEffect(() => {
    if (accessToken && items.length === 0) {
      loadMore()
    }
  }, [accessToken, sort]) // loadMore is stable due to useCallback

  return { items, status, hasMore, sort, loadMore, changeSort }
}
```

**Frontend component** `HistoryPage` with IntersectionObserver:
```jsx
import { useRef, useEffect } from 'react'
import { useHistory } from '../hooks/useHistory'
import { HistoryCard } from '../components/history/HistoryCard'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function HistoryPage() {
  const { items, status, hasMore, sort, loadMore, changeSort } = useHistory()
  const sentinelRef = useRef(null)

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && status !== 'loading') {
          loadMore()
        }
      },
      { rootMargin: '200px' } // Trigger 200px before sentinel is visible
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, status, loadMore])

  return (
    <div className="w-full max-w-2xl mx-auto py-20">
      <h1 className="font-heading text-5xl text-pencil mb-6">Your Ideas</h1>

      {/* Sort toggle */}
      <div className="flex gap-2 mb-8">
        <Button
          variant={sort === 'date' ? 'primary' : 'secondary'}
          onClick={() => changeSort('date')}
        >
          Newest First
        </Button>
        <Button
          variant={sort === 'score' ? 'primary' : 'secondary'}
          onClick={() => changeSort('score')}
        >
          Highest Score
        </Button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {items.length === 0 && status === 'done' && (
          <Card>
            <p className="text-pencil">No saved ideas yet. Validate an idea to get started.</p>
          </Card>
        )}

        {items.map(item => (
          <HistoryCard key={item.id} item={item} />
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}

        {/* Loading indicator */}
        {status === 'loading' && (
          <div className="text-center text-muted">Loading...</div>
        )}
      </div>
    </div>
  )
}
```

#### Gotchas & Pitfalls
- **Cursor ID from last item**: If score is exactly tied, results will be ambiguous. Add a secondary sort: `ORDER BY (scores->>'weighted')::float DESC, created_at DESC`
- **Stale cursors**: If a result is deleted before the next page is fetched, the cursor still works (skips the gap). This is fine.
- **IntersectionObserver browser support**: IE 11 doesn't have it. Add a polyfill or fallback to scroll event listener for v1.
- **Load state**: Don't fire multiple requests if one is in flight — the `loadingRef` prevents this.

#### Code Patterns
```js
// Cursor-based query for any sort order
if (sort === 'score') {
  query += ` AND (scores->>'weighted')::float < (SELECT (scores->>'weighted')::float FROM saved_results WHERE id = $${paramIdx})`
} else {
  query += ` AND created_at < (SELECT created_at FROM saved_results WHERE id = $${paramIdx})`
}
```

---

### 4. Optional-Auth Express Middleware

#### Recommended Approach
Create a new middleware `optionalAuth` that reads the JWT if present but does NOT reject if absent. Use it on `GET /api/history/:id` for public reads.

#### Key Implementation Details

**server/middleware/optionalAuth.js**:
```js
import { verifyAccessToken } from '../utils/jwt.js'

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      req.user = verifyAccessToken(token)
    } catch {
      // Token invalid but don't reject — just continue
    }
  }

  // req.user is either set (valid token) or undefined (no token / invalid)
  next()
}
```

**Backend route** `GET /api/history/:id`:
```js
export async function getResultRoute(req, res) {
  const { id } = req.params
  const authenticatedUserId = req.user?.id // undefined if not authenticated

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, idea_text, markdown_result, scores, created_at
       FROM saved_results
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' })
    }

    const result = rows[0]

    // Permission check: if viewing own result, send everything
    // If viewing someone else's result, also OK (public read)
    // Only hide if user is the owner and wants privacy (future feature)

    res.json({
      id: result.id,
      title: result.title,
      idea_text: result.idea_text,
      markdown_result: result.markdown_result,
      scores: result.scores,
      created_at: result.created_at,
      isOwner: authenticatedUserId === result.user_id, // For UI to show edit/delete buttons
    })
  } catch (e) {
    console.error('Get result error:', e)
    res.status(500).json({ error: 'Failed to fetch result' })
  }
}
```

**Mount in server/index.js**:
```js
import { optionalAuth } from './middleware/optionalAuth.js'
import { getResultRoute, deleteResultRoute, renameResultRoute } from './routes/history.js'

app.get('/api/history/:id', optionalAuth, getResultRoute)
app.delete('/api/history/:id', requireAuth, deleteResultRoute)
app.patch('/api/history/:id', requireAuth, renameResultRoute)
```

#### Gotchas & Pitfalls
- **Token might be invalid**: `verifyAccessToken()` throws on expired/malformed tokens. Wrap in try/catch and silently continue.
- **req.user undefined check**: Always use `req.user?.id` or `req.user?.email` to avoid crashes.
- **Public vs. private results**: Currently all results are public. If adding privacy later, store a `is_public` column and check it before sending data.

#### Code Patterns
```js
// Optional auth pattern — applies to all public read endpoints
app.get('/api/resource/:id', optionalAuth, (req, res) => {
  const owner = req.user?.id // Set if authenticated
  // Fetch resource, check ownership for edit buttons in response
})
```

---

### 5. AI Title Generation — Async Non-Blocking

#### Recommended Approach
Use the **IIFE + fire-and-forget** pattern. When the POST `/api/history` request completes, the response is sent immediately with the default title. The server spawns an async task in the background to call Claude, parse the response, and update the DB. This avoids request timeout and blocks the user.

#### Key Implementation Details

Already covered in Section 2 (PostgreSQL Auto-Save Pattern) with the `generateTitleAsync` function. Here's the full pattern again:

```js
export async function saveResultRoute(req, res) {
  const { idea_text, markdown_result } = req.body
  const user = req.user

  try {
    const scores = parseScores(markdown_result)
    const defaultTitle = idea_text.split(' ').slice(0, 6).join(' ')

    const { rows } = await pool.query(
      `INSERT INTO saved_results
       (user_id, idea_text, markdown_result, title, scores)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, created_at`,
      [user.id, idea_text, markdown_result, defaultTitle, JSON.stringify(scores)]
    )

    // Send response immediately (title is default)
    const result = rows[0]
    res.status(201).json({ id: result.id, title: result.title, created_at: result.created_at })

    // Background task — fire and forget
    generateTitleAsync(result.id, idea_text, user.id)
  } catch (e) {
    console.error('Save result error:', e)
    res.status(500).json({ error: 'Failed to save result' })
  }
}

function generateTitleAsync(resultId, ideaText, userId) {
  // IIFE: Immediately-Invoked Function Expression
  // This pattern lets us use async/await without the response being blocked
  (async () => {
    try {
      const client = new Anthropic()
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        system: 'Generate a 3-4 word title summarizing this startup idea. Return ONLY the title, no quotes or punctuation.',
        messages: [{ role: 'user', content: ideaText.substring(0, 500) }],
      })

      const title = response.content[0].text.trim().slice(0, 100)

      // Update the DB record
      await pool.query(
        'UPDATE saved_results SET title = $1 WHERE id = $2',
        [title, resultId]
      )

      console.log(`[Title Generated] ${resultId}: "${title}"`)
    } catch (e) {
      console.error(`[Title Generation Failed] ${resultId}:`, e.message)
      // Title remains as default — user sees it and can edit manually
    }
  })()
}
```

#### Gotchas & Pitfalls
- **Fire and forget loses visibility**: If title generation crashes, there's no error notification. Add logging and optionally a monitoring dashboard.
- **DB connection pool limits**: If many validations happen in parallel, multiple title generation tasks compete for DB connections. The pool's default size (10) should handle this, but monitor in production.
- **Timeout risk**: If Claude API is slow (>30s), the task might not complete before server restart. Title stays as default — acceptable for v1.
- **Concurrency on same ID**: If somehow the same result ID's title is generated twice, the second UPDATE wins. This is fine.

#### Code Patterns
```js
// Fire-and-forget pattern for any non-blocking operation
function doSomethingAsync(arg1, arg2) {
  (async () => {
    try {
      // Long-running work here
      await slowOperation()
    } catch (e) {
      console.error('Async task failed:', e)
    }
  })()
}

// Call without await — request completes, task runs in background
doSomethingAsync('data')
res.json({ success: true })
```

---

### 6. Inline Title Editing

#### Recommended Approach
Click-to-edit pattern with controlled input. On click, show an input field; on blur or Enter key, send a PATCH request to update the title. On Escape, revert. This is a mini-form without a library.

#### Key Implementation Details

**Frontend component** `HistoryCard` with editable title:
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { VerdictBadge } from './validator/VerdictBadge'
import { Trash2 } from 'lucide-react'

export function HistoryCard({ item }) {
  const navigate = useNavigate()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState(item.title)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSaveTitle() {
    if (!editingTitle.trim() || editingTitle === item.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSaving(true)
    try {
      const res = await fetchWithAuth(`/api/history/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() }),
      })

      if (res.ok) {
        item.title = editingTitle.trim() // Update local state
        setIsEditingTitle(false)
      } else {
        alert('Failed to update title')
      }
    } catch (e) {
      console.error('Title update error:', e)
      alert('Error updating title')
    } finally {
      setIsSaving(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditingTitle(item.title)
      setIsEditingTitle(false)
    }
  }

  function handleDelete() {
    if (!confirm('Delete this result? This cannot be undone.')) return

    fetchWithAuth(`/api/history/${item.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          // Parent component should refetch the list
          window.location.reload() // Simple; better: pass onDelete callback
        }
      })
      .catch(e => console.error('Delete error:', e))
  }

  const ideaSnippet = item.idea_text.substring(0, 100) + (item.idea_text.length > 100 ? '...' : '')
  const createdDate = new Date(item.created_at).toLocaleDateString()

  return (
    <Card decoration="none" rotate={0} className="cursor-pointer hover:shadow-hardLg transition-shadow">
      <div
        className="mb-4"
        onClick={() => navigate(`/history/${item.id}`)}
      >
        {isEditingTitle ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="w-full px-3 py-2 border border-blue rounded font-body text-lg text-pencil focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="font-heading text-2xl text-pencil hover:text-blue transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingTitle(true)
            }}
          >
            {item.title}
          </h3>
        )}
      </div>

      <p className="font-body text-pencil text-sm mb-3 opacity-70">{ideaSnippet}</p>

      <div className="flex justify-between items-center">
        <div>
          <VerdictBadge score={item.scores.weighted} />
          <p className="font-body text-xs text-muted mt-2">{createdDate}</p>
        </div>
        <Button
          variant="secondary"
          className="!h-10 !px-3"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </Card>
  )
}
```

**Backend route** `PATCH /api/history/:id`:
```js
export async function renameResultRoute(req, res) {
  const { id } = req.params
  const { title } = req.body
  const user = req.user

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE saved_results
       SET title = $1, updated_at = now()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING id, title, updated_at`,
      [title.trim().slice(0, 200), id, user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Result not found or not authorized' })
    }

    res.json(rows[0])
  } catch (e) {
    console.error('Rename result error:', e)
    res.status(500).json({ error: 'Failed to update title' })
  }
}
```

#### Gotchas & Pitfalls
- **Click event propagation**: Stop propagation on the input and delete button so clicking them doesn't navigate to the result view.
- **Optimistic updates**: The code above doesn't update Redux or local state immediately. For better UX, update the local `item` object before the server call, then revert on error.
- **Empty title check**: Require at least 1 character after trim; don't allow all-whitespace titles.
- **Title length**: Cap at 200 characters in DB and UI to prevent DB bloat.

#### Code Patterns
```jsx
// Click-to-edit pattern
const [isEditing, setIsEditing] = useState(false)
const [value, setValue] = useState(initialValue)

const handleSave = async () => {
  await api.update(value)
  setIsEditing(false)
}

const handleKeyDown = (e) => {
  if (e.key === 'Enter') handleSave()
  if (e.key === 'Escape') { setValue(initialValue); setIsEditing(false) }
}

return isEditing ? (
  <input onBlur={handleSave} onKeyDown={handleKeyDown} autoFocus />
) : (
  <div onClick={() => setIsEditing(true)}>{value}</div>
)
```

---

### 7. historySlice Redux Structure

#### Recommended State Shape
```js
const historyState = {
  items: [],                           // Array of { id, title, idea_text, scores, created_at }
  status: 'idle',                      // idle | loading | done | error
  error: null,                         // error message if status === 'error'
  sort: 'date',                        // date | score
  cursor: null,                        // next cursor for pagination
  hasMore: true,                       // whether there are more results to load
}
```

#### Key Implementation Details

**client/src/store/slices/historySlice.js**:
```js
import { createSlice } from '@reduxjs/toolkit'

const historySlice = createSlice({
  name: 'history',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    sort: 'date',
    cursor: null,
    hasMore: true,
  },
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload
    },
    appendItems: (state, action) => {
      state.items.push(...action.payload)
    },
    setStatus: (state, action) => {
      state.status = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    setSort: (state, action) => {
      state.sort = action.payload
      state.items = []
      state.cursor = null
      state.hasMore = true
    },
    setCursor: (state, action) => {
      state.cursor = action.payload
    },
    setHasMore: (state, action) => {
      state.hasMore = action.payload
    },
    deleteItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload)
    },
    updateItem: (state, action) => {
      const idx = state.items.findIndex(item => item.id === action.payload.id)
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload }
      }
    },
  },
})

export const {
  setItems, appendItems, setStatus, setError, setSort, setCursor,
  setHasMore, deleteItem, updateItem,
} = historySlice.actions

export default historySlice.reducer
```

**Register in store/index.js**:
```js
import { configureStore } from '@reduxjs/toolkit'
import validatorReducer from './slices/validatorSlice'
import authReducer from './slices/authSlice'
import historyReducer from './slices/historySlice'

export const store = configureStore({
  reducer: {
    validator: validatorReducer,
    auth: authReducer,
    history: historyReducer,
  },
})
```

#### Gotchas & Pitfalls
- **Don't duplicate in hook**: The `useHistory` custom hook (Section 3) manages most state locally with `useState`. Redux is optional for history. Use Redux only if you need to share history state across components (e.g., show a count in the header).
- **setSort action resets pagination**: When user changes sort, items, cursor, and hasMore all reset so the new sort starts fresh.
- **Immutability**: Redux Toolkit uses Immer internally, so mutations like `state.items.push(...)` are safe. But prefer reducer actions for clarity.

#### Code Patterns
```js
// Dispatch from component
dispatch(setSort('score')) // Resets pagination

// Selector to use in component
const { items, status, sort, hasMore } = useSelector(s => s.history)
```

---

### 8. Public /history/:id Route

#### Recommended Approach
The GET `/api/history/:id` endpoint (Section 4, optional-auth) returns full markdown and scores. The frontend `ResultPage` component renders the same layout as the current results panel, but from stored data instead of Redux. The `isOwner` flag in the response determines whether to show edit/delete buttons.

#### Key Implementation Details

**Frontend page** `client/src/pages/ResultPage.jsx`:
```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { setIdea } from '../store/slices/validatorSlice'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { VerdictBadge } from '../components/validator/VerdictBadge'
import { Scorecard } from '../components/validator/Scorecard'
import { parseScores } from '../utils/parseResult'
import ReactMarkdown from 'react-markdown'
import { Trash2, Share2 } from 'lucide-react'

export function ResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchResult() {
      try {
        // fetchWithAuth handles both authenticated and unauthenticated requests
        const res = await fetchWithAuth(`/api/history/${id}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Result not found')
          } else {
            setError('Failed to load result')
          }
          setStatus('error')
          return
        }

        const data = await res.json()
        setResult(data)
        setStatus('done')
      } catch (e) {
        console.error('Fetch result error:', e)
        setError('Error loading result')
        setStatus('error')
      }
    }

    fetchResult()
  }, [id])

  if (status === 'loading') {
    return <div className="text-center text-muted">Loading...</div>
  }

  if (status === 'error' || !result) {
    return (
      <Card>
        <p className="text-pencil">{error}</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Back Home
        </Button>
      </Card>
    )
  }

  const scores = parseScores(result.markdown_result)

  const handleReValidate = () => {
    dispatch(setIdea(result.idea_text))
    navigate('/')
    // Parent component can auto-trigger validation if needed
  }

  const handleDelete = async () => {
    if (!result.isOwner) return
    if (!confirm('Delete this result? This cannot be undone.')) return

    const res = await fetchWithAuth(`/api/history/${id}`, { method: 'DELETE' })
    if (res.ok) {
      navigate('/history')
    } else {
      alert('Failed to delete result')
    }
  }

  const handleShare = (platform) => {
    const url = window.location.href
    const title = result.title
    const summary = `I just validated my startup idea "${title}" — scored ${scores?.weighted}/5. Check it out:`

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(summary)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(summary)} ${encodeURIComponent(url)}`,
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-20">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-heading text-4xl text-pencil mb-2">{result.title}</h1>
          <p className="font-body text-muted text-sm">
            Validated on {new Date(result.created_at).toLocaleDateString()}
          </p>
        </div>

        {result.isOwner && (
          <Button
            variant="secondary"
            className="!h-10 !px-3"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {scores && (
        <div className="mb-8">
          <VerdictBadge score={scores.weighted} />
        </div>
      )}

      {/* Render full markdown result */}
      <div className="prose prose-sm max-w-none mb-8">
        <ReactMarkdown>{result.markdown_result}</ReactMarkdown>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Button onClick={handleReValidate}>Re-validate This Idea</Button>
        <Button variant="secondary" onClick={() => handleShare('twitter')}>
          Share on X
        </Button>
        <Button variant="secondary" onClick={() => handleShare('linkedin')}>
          Share on LinkedIn
        </Button>
        <Button variant="secondary" onClick={() => handleShare('whatsapp')}>
          Share on WhatsApp
        </Button>
      </div>

      {!result.isOwner && (
        <Card className="mt-8">
          <p className="font-body text-pencil">
            Like this validator? Create an account and validate your own idea →
          </p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Validate My Idea
          </Button>
        </Card>
      )}
    </div>
  )
}
```

#### Gotchas & Pitfalls
- **fetchWithAuth with no token**: `fetchWithAuth` works fine when `accessToken` is null — it just omits the Authorization header. `optionalAuth` on the backend will set `req.user` to undefined.
- **Sharing URLs**: Twitter/LinkedIn/WhatsApp intent URLs may truncate very long text. Keep the pre-filled text to ~2-3 sentences.
- **Re-validate UX**: After clicking "Re-validate", the user sees the input form again. Consider adding a flag to auto-trigger validation immediately, or show a toast.

#### Code Patterns
```js
// Share URL construction
const url = window.location.href
const text = 'I validated my idea...'
const twitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
window.open(twitter, '_blank', 'width=600,height=400')
```

---

### 9. Soft Delete Query Patterns

#### Recommended Approach
Add a `deleted_at` column (TIMESTAMPTZ, nullable). Set to `now()` on delete. Exclude from all queries where `deleted_at IS NULL`. This preserves data for recovery and audit trails.

#### Key Implementation Details

**Schema** (add to server/db/schema.sql):
```sql
CREATE TABLE IF NOT EXISTS saved_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_text TEXT NOT NULL,
  markdown_result TEXT NOT NULL,
  title TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (id)
);
```

**Query patterns**:
```sql
-- List (exclude deleted)
SELECT id, title, idea_text, scores, created_at
FROM saved_results
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC LIMIT 10;

-- Single fetch (exclude deleted, return 404 if not found)
SELECT * FROM saved_results WHERE id = $1 AND deleted_at IS NULL;

-- Soft delete (set timestamp)
UPDATE saved_results SET deleted_at = now() WHERE id = $1 AND user_id = $2;

-- Hard delete (only if absolutely necessary for compliance)
DELETE FROM saved_results WHERE id = $1 AND user_id = $2;

-- Restore deleted (set deleted_at to NULL) — optional for admin
UPDATE saved_results SET deleted_at = NULL WHERE id = $1 AND user_id = $2;
```

**Express route patterns**:
```js
// List (already shown in Section 3)
const query = `
  SELECT id, title, idea_text, scores, created_at
  FROM saved_results
  WHERE user_id = $1 AND deleted_at IS NULL
  ...
`

// Get by ID
const { rows } = await pool.query(
  'SELECT * FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
  [id]
)
if (rows.length === 0) return res.status(404).json({ error: 'Not found' })

// Delete
export async function deleteResultRoute(req, res) {
  const { id } = req.params
  const user = req.user

  try {
    const { rows } = await pool.query(
      `UPDATE saved_results
       SET deleted_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' })
    }

    res.json({ message: 'Result deleted' })
  } catch (e) {
    console.error('Delete result error:', e)
    res.status(500).json({ error: 'Failed to delete result' })
  }
}
```

#### Gotchas & Pitfalls
- **Index performance**: Add an index on `(user_id, deleted_at)` for fast list queries: `CREATE INDEX idx_saved_results_user_deleted ON saved_results(user_id, deleted_at)`
- **Cascading deletes**: If deleting a user, `ON DELETE CASCADE` on `user_id` FK will hard-delete all their results. Consider adding `ON DELETE SET NULL` or archiving instead for compliance.
- **Audit trails**: For regulatory compliance, log all deletes with timestamps and user IDs to a separate audit table.

#### Code Patterns
```sql
-- Standard soft-delete check on every query
WHERE user_id = $1 AND deleted_at IS NULL
```

---

### 10. Share URL Construction

#### Recommended Approach
Build platform-specific intent URLs on the client side. No backend needed — just construct query strings and open in a new window.

#### Key Implementation Details

**Share URL patterns**:
```js
export function buildShareUrl(platform, ideaTitle, pageUrl, score) {
  const summary = `I just validated my startup idea "${ideaTitle}" — scored ${score}/5.`
  const fullText = `${summary} Check it out:`

  const urls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(fullText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(fullText)} ${encodeURIComponent(pageUrl)}`,
  }

  return urls[platform] || null
}

// Usage
const shareUrl = buildShareUrl('twitter', 'AI Email Agent', 'https://example.com/history/123', 4.5)
window.open(shareUrl, '_blank', 'width=600,height=400')
```

**Full share button component** (from ResultPage):
```jsx
const handleShare = (platform) => {
  const url = window.location.href
  const title = result.title
  const summary = `I just validated my startup idea "${title}" — scored ${scores?.weighted}/5. Check it out:`

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(summary)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(summary)} ${encodeURIComponent(url)}`,
  }

  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400')
  }
}

// Render buttons
<Button onClick={() => handleShare('twitter')}>Share on X</Button>
<Button onClick={() => handleShare('linkedin')}>Share on LinkedIn</Button>
<Button onClick={() => handleShare('whatsapp')}>Share on WhatsApp</Button>
```

#### Gotchas & Pitfalls
- **URL length limits**: Twitter has 280-char tweet limit; if URL + text > 280, Twitter shows a preview. WhatsApp has no hard limit. LinkedIn shows OG meta tags from the URL.
- **Text truncation**: Keep pre-filled text to 1-2 sentences (< 100 chars). Platform will append the URL.
- **OG meta tags**: For LinkedIn/Facebook to show a rich preview, add `<meta property="og:title" />`, `og:description`, `og:image` to the public result page's HTML. This is a future enhancement.
- **Mobile behavior**: Opening a share intent on mobile usually triggers the native share sheet instead of a web URL. This is expected and good UX.
- **Domain in production**: Share URLs need the full domain. In dev, they'll be `localhost:5173/history/123` which won't work. Use `window.location.href` (includes the full URL).

#### Code Patterns
```js
// Safe URL encoding
const text = 'Hello world!'
const url = 'https://example.com'
const fullUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`

// Mobile-safe share
function share(platform, data) {
  if (navigator.share) {
    // Native share API (mobile)
    navigator.share({ title: data.title, text: data.text, url: data.url })
  } else {
    // Fallback to intent URLs
    window.open(intentUrl[platform], '_blank')
  }
}
```

---

## Implementation Order (Wave Planning)

### Wave 1: Database & Backend Foundation (Critical path)
1. **Add `saved_results` table to schema.sql**
   - Columns: id, user_id, idea_text, markdown_result, title, scores (JSONB), created_at, updated_at, deleted_at
   - FK: user_id → users(id) ON DELETE CASCADE
   - Index: (user_id, deleted_at) for list queries

2. **Create `server/middleware/optionalAuth.js`**
   - Read JWT if present, attach req.user, don't reject if absent

3. **Create `server/routes/history.js`**
   - POST `/api/history` — save result with auto-generated default title, spawn async title generation
   - GET `/api/history` — list results with cursor pagination, sort by date/score
   - GET `/api/history/:id` — public read (use optionalAuth)
   - PATCH `/api/history/:id` — rename title (requireAuth)
   - DELETE `/api/history/:id` — soft delete (requireAuth)

4. **Update `server/index.js`** to mount history routes

5. **Test routes with curl** (see Validation Architecture section)

### Wave 2: Client Routing & State
1. **Install react-router-dom v6**
   - Update `main.jsx` to wrap with `<BrowserRouter>`

2. **Create `client/src/pages/` directory** with:
   - `HomePage.jsx` — current App.jsx content (hero + input + results)
   - `HistoryPage.jsx` — browse view with infinite scroll
   - `ResultPage.jsx` — public result view

3. **Refactor `App.jsx`** to use React Router:
   - Routes: `/`, `/history`, `/history/:id`
   - Keep AppShell as outer wrapper
   - Preserve URL param handling for OAuth/email/reset

4. **Create `client/src/store/slices/historySlice.js`**
   - Redux state for items, status, sort, cursor, hasMore

### Wave 3: Auto-Save Integration
1. **Update `client/src/hooks/useValidate.js`**
   - After `finishValidation()`, call `saveValidation()` if authenticated
   - Use `fetchWithAuth` for the POST request

2. **Test auto-save** with a real validation

### Wave 4: History Browse Page
1. **Create `client/src/hooks/useHistory.js`**
   - Load initial 10 results on mount
   - Cursor-based pagination with `loadMore()` callback
   - Sort toggle (date/score)

2. **Create `client/src/components/history/HistoryCard.jsx`**
   - Click-to-edit title on card
   - Show idea snippet, score, date, delete button
   - Navigate to `/history/:id` on card click

3. **Wire up `HistoryPage`** with IntersectionObserver sentinel

4. **Add header nav link** to `/history` (only show when authenticated)

### Wave 5: Public Result View
1. **Wire up `ResultPage`** with:
   - Fetch result via `fetchWithAuth(/api/history/:id)`
   - Render full markdown + Scorecard
   - Show edit/delete buttons only if owner
   - Share buttons for X/LinkedIn/WhatsApp

2. **Test public access** (unauthenticated)

### Wave 6: Polish & Edge Cases
1. **Async title generation testing** — verify titles update in list after 5-10s
2. **Error handling** — network failures, permission errors
3. **Loading states** — skeletons for history list
4. **Empty states** — "No results yet" on HistoryPage
5. **Mobile responsiveness** — test infinite scroll on mobile

---

## Validation Architecture

### Database Setup
```bash
# Run schema migrations
psql $DATABASE_URL -f server/db/schema.sql

# Verify table created
psql $DATABASE_URL -c "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'saved_results'
  ORDER BY ordinal_position;
"
```

### Backend Route Testing

**Test auto-save** (POST `/api/history`):
```bash
# Get an access token first (from login response)
TOKEN="eyJ0eXAi..."

# Save a validation
curl -X POST http://localhost:3001/api/history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idea_text": "An AI tool to summarize emails",
    "markdown_result": "## 📋 Idea Summary\n...\n## 🔬 Scorecard\n| Phase | Score | Weight |\n|-------|-------|--------|\n| 1. Market & Niche | 4/5 | 30% |\n| 2. Content & Distribution | 3/5 | 25% |\n| 3. Product & Agent Architecture | 4/5 | 35% |\n| 4. Pricing & Moat | 3/5 | 10% |\n| **Weighted Total** | **3.7/5** | |\n...",
    "scores": {"phase1": 4, "phase2": 3, "phase3": 4, "phase4": 3, "weighted": 3.7}
  }'

# Expected response:
# { "id": "uuid", "title": "An AI tool to summarize", "created_at": "2026-03-22T..." }
```

**Test list with pagination** (GET `/api/history`):
```bash
curl http://localhost:3001/api/history \
  -H "Authorization: Bearer $TOKEN"

# With sort:
curl "http://localhost:3001/api/history?sort=score&limit=10"

# Expected response:
# { "items": [...], "nextCursor": "uuid-or-null", "hasMore": true }
```

**Test public read** (GET `/api/history/:id`):
```bash
# Without token (public)
curl http://localhost:3001/api/history/123e4567-e89b-12d3-a456-426614174000

# With token (shows isOwner flag)
curl http://localhost:3001/api/history/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "id": "uuid",
#   "title": "...",
#   "idea_text": "...",
#   "markdown_result": "...",
#   "scores": {...},
#   "created_at": "...",
#   "isOwner": true|false
# }
```

**Test title rename** (PATCH `/api/history/:id`):
```bash
curl -X PATCH http://localhost:3001/api/history/uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "New title" }'

# Expected: { "id": "uuid", "title": "New title", "updated_at": "..." }
```

**Test delete** (DELETE `/api/history/:id`):
```bash
curl -X DELETE http://localhost:3001/api/history/uuid \
  -H "Authorization: Bearer $TOKEN"

# Expected: { "message": "Result deleted" }

# Verify soft delete (SELECT from DB should return no rows for this user)
psql $DATABASE_URL -c "
  SELECT * FROM saved_results WHERE id = 'uuid' AND deleted_at IS NULL;
"
# Should return 0 rows
```

### Frontend Component Testing

**Test infinite scroll**:
1. Load `/history` in browser
2. Should show 10 results on mount
3. Scroll to bottom; sentinel triggers IntersectionObserver
4. Next 10 results append
5. Toggle sort; list resets and reloads

**Test title editing**:
1. Click on a title in the history card
2. Input appears with current title
3. Edit and blur (or press Enter)
4. PATCH request fires
5. Title updates on success
6. Press Escape to cancel

**Test public result view**:
1. Open `/history/:id` in incognito window (unauthenticated)
2. Full result renders
3. Delete button NOT shown
4. "Validate your own idea" CTA shown
5. Share buttons work (open intent URLs)

**Test re-validate**:
1. On `/history/:id`, click "Re-validate This Idea"
2. Navigate to `/` and idea text is pre-filled
3. Optionally auto-trigger validation (TBD in Phase planning)

### Browser DevTools Checks
- **Network tab**: Monitor auto-save POST request after validation completes
- **Redux DevTools**: Inspect `history` slice state as pagination loads
- **Console**: No JS errors during route transitions
- **Mobile emulation**: Touch targets hit on small screens (buttons min h-12)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Auto-save fails silently** | User loses validation result if network drops | Add a background toast notification; retry logic on 5xx errors |
| **Title generation timeout** | Title stays as default 6 words | Acceptable for v1; add admin interface to regenerate later |
| **Cursor pagination ambiguity** | If scores tie, results may reorder on next page | Add secondary sort by created_at: `ORDER BY score DESC, created_at DESC` |
| **IntersectionObserver not supported** | Infinite scroll broken in older browsers (IE 11) | Polyfill via `https://polyfill.io/` or fallback to scroll event listener |
| **fetchWithAuth loses token on refresh fail** | User stuck in 401 loop | Fallback: clear auth and show login modal |
| **Public result indexed by Google** | Privacy issue if unintended | Document that results are public-by-default; add robots meta tag to `/history/:id` routes if needed |
| **DB connection pool exhausted** | Async title generation blocks other requests | Monitor pool usage; increase pool size from 10 to 20 if needed |
| **Re-validate doesn't auto-trigger** | User must click Validate again | UX issue; design the flow clearly in Phase planning |
| **Route params conflict with router** | OAuth/reset tokens lost when switching routes | Parse params in useEffect before router; store in sessionStorage if needed |
| **Mobile share opens wrong platform** | User expects native share, gets web intent | Detect mobile and use `navigator.share` API; fallback to intent URLs |

---

## RESEARCH COMPLETE

This research document provides all the technical guidance needed to plan Phase 10 implementation. The 10 research areas are fully addressed with code patterns, gotchas, and testing strategies. Use this to guide the phase planning document and task breakdown.

Key takeaways:
- **Database**: Add `saved_results` table with soft delete + cursor-based pagination
- **Backend**: 5 routes (save, list, get, rename, delete) + optional-auth middleware
- **Frontend**: React Router v6 + 3 new pages (Home, History browse, Result view) + 2 new Redux slices
- **Auto-save**: Trigger in `useValidate` hook after stream ends; use fire-and-forget for title generation
- **UX**: Infinite scroll with IntersectionObserver, click-to-edit titles, public shareable links
- **Testing**: curl for backend, manual browser tests for infinite scroll and permissions

All patterns follow existing codebase conventions (Redux slices, fetchWithAuth, Express routes, design system components). No breaking changes to existing code.
