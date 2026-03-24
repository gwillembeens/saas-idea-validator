# Phase 23: Social Interactions - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add social interactions to public validations:
1. **Validations grid** on profile page — sorted newest first, paginated, with like/comment counts
2. **Likes** — auth-gated, togglable heart button on result page, profile cards, and leaderboard cards
3. **Comments** — auth-gated, threaded (one level of replies), accessible via result page inline section and modal from any card; 500 char limit
4. **Social counts propagation** — like/comment counts on all three card surfaces; total likes received in profile stat bar; "most liked" sort option on leaderboard
5. **Heatmap expansion** — activity heatmap now counts likes given + comments posted as active days (not just validation submissions)

Notifications for likes/comments are explicitly deferred to Phase 24.

</domain>

<decisions>
## Implementation Decisions

### Validations grid on profile
- **D-01:** Grid renders **after RevisionChains, before AnalyticsSection** in the single-scroll profile page
- **D-02:** 2-column grid on desktop, 1-column on mobile (same breakpoint pattern as rest of app: `md:`)
- **D-03:** Sorted **newest first** — no toggle for visitors
- **D-04:** **Load more** button, batch of 6 cards (3 rows × 2 cols) per load — no page numbers, no auto infinite scroll
- **D-05:** Card fields: title, idea_text preview (truncated), score badge, niche pill, date, like count, comment count
- **D-06:** Uses existing `ProfileValidationCard` component — extend it to accept and display like/comment counts

### Likes
- **D-07:** Must be **logged in** to like — anonymous visitors see the count but not an interactive button
- **D-08:** Like button appears in **3 locations**: result page (prominent, below action buttons), profile validation cards (compact, card footer), leaderboard cards (compact, card footer)
- **D-09:** **Togglable** — clicking again removes the like
- **D-10:** Visual: lucide-react `Heart` icon — filled `accent` red (`#ff4d4d`) with `shadow-hardSm` when liked, muted outline when not; count shown inline
- **D-11:** **Total likes received** added to the profile stat bar (sum of all likes across the user's public validations)
- **D-12:** Users **can** like their own validations

### Comments
- **D-13:** Must be **logged in** to comment — anonymous visitors can read comments
- **D-14:** Comments appear in **2 locations**:
  - **Result page** — inline section below the validation cards (always visible when viewing a result)
  - **Modal** — clicking comment count on any card (profile card, leaderboard card) opens a comment sheet/modal
- **D-15:** **Threaded** — one level of replies (comment → replies, not replies-on-replies)
- **D-16:** **No cap** on comments per user per validation
- **D-17:** **500 character limit** per comment and per reply
- **D-18:** Users **can** comment on their own validations

### Social counts propagation
- **D-19:** Like count and comment count shown on: result page, profile validation cards, leaderboard cards
- **D-20:** **"Most liked"** added as a sort option on the leaderboard (alongside existing score sort)
- **D-21:** Notifications for likes/comments are **deferred to Phase 24** — no bell icon or alert in this phase

### Heatmap expansion
- **D-22:** Activity heatmap now counts **3 action types** as active days: validation submitted, like given, comment posted
- **D-23:** A day is active if the user performed any of the 3 actions on that day
- **D-24:** Heatmap tooltip updates to reflect broader activity (e.g. "5 actions" not "5 validations")
- **D-25:** Backend: heatmap query needs to UNION across `saved_results` (validations), `likes` (given), `comments` (posted) tables

### Claude's Discretion
- Exact DB schema for `likes` and `comments` tables (foreign keys, indexes, constraints)
- Comment threading UI — indentation, reply button placement, collapse behavior
- Like button animation (scale pulse, fill transition)
- Comment modal vs sheet — drawer or centered modal, exact dimensions
- Empty state for comments section ("No comments yet — be the first")
- Exact leaderboard sort UI (tab pills vs dropdown vs toggle)

</decisions>

<specifics>
## Specific Ideas

- Heart icon should feel hand-drawn — use lucide-react `Heart`, but the filled state should have the accent red + hard shadow to feel punchy, not flat
- Comment count icon: lucide-react `MessageCircle` — consistent with like icon aesthetic
- Load more button should match existing `Button` component (secondary variant)
- The comment modal should feel like the app's existing modals (AuthModal pattern — overlay + wobbly card)
- "Most liked" sort on leaderboard: simple toggle alongside existing sort, not a whole new filter system

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Existing code to read before planning/implementing
- `client/src/pages/ProfilePage.jsx` — current page structure; `StatItem` component; where to insert validations grid and pass like/comment counts
- `client/src/components/profile/ProfileValidationCard.jsx` — component to extend with like/comment counts
- `client/src/components/leaderboard/LeaderboardCard.jsx` — component to extend with like/comment counts
- `client/src/pages/ResultPage.jsx` — where to add inline comments section and like button
- `server/routes/profile.js` — profileRoute, heatmap query (`buildHeatmapArray`, `calculateStreaks`), stats computation — must expand heatmap UNION query
- `server/routes/leaderboard.js` — leaderboardRoute — must add `most_liked` sort option
- `client/src/components/auth/AuthModal.jsx` — modal pattern to follow for comment modal/sheet
- `CLAUDE.md` §Design System — color tokens, shadow tokens, font rules, wobbly border-radius conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProfileValidationCard`: already built — extend footer to add Heart + count + MessageCircle + count
- `LeaderboardCard`: already built — same footer extension pattern
- `Card` component with `decoration` + `rotate` props — use for comment modal wrapper
- `Button` (secondary variant) — use for "Load more" in validations grid and comment submit
- `NichePill` — already used in ProfileValidationCard, no change needed
- `AuthModal` pattern — overlay + centered wobbly card — follow for comment modal
- `fetchWithAuth` utility — use for all authenticated like/comment API calls

### Established Patterns
- All authenticated API calls use `fetchWithAuth` (wraps fetch with JWT, handles 401 refresh)
- Redux slices for app state — add `likesSlice` or extend existing slices for optimistic like toggling
- Custom hooks for data fetching (no bare `useEffect`) — create `useComments(resultId)` and `useLikes(resultId)`
- Hard offset shadow (`shadow-hard`, `shadow-hardSm`) on interactive elements
- Wobbly border-radius always inline style on primary elements
- `lucide-react` already installed — `Heart`, `MessageCircle` icons available

### Integration Points
- `profileRoute` response: add `validations` array (already exists as `formattedValidations` but not paginated), add `total_likes_received` to stats, expand heatmap UNION query
- `leaderboardRoute`: add `most_liked` sort, add `like_count` + `comment_count` to entry shape
- New DB tables: `likes (id, user_id, result_id, created_at)`, `comments (id, user_id, result_id, parent_id, body, created_at, deleted_at)`
- New API routes: `POST/DELETE /api/results/:id/like`, `GET/POST /api/results/:id/comments`, `POST /api/comments/:id/replies`, `DELETE /api/comments/:id`
- ResultPage: add `<LikeButton>` and `<CommentsSection>` below existing action buttons

</code_context>

<deferred>
## Deferred Ideas

- **Notifications for likes/comments** — Phase 24. Bell icon, unread badge in NavBar, in-app alert feed all belong there.
- **Heatmap counting logins as active days** — mentioned in Phase 22 deferred list alongside likes/comments. Logins are a weaker signal than content actions; revisit in Phase 24+ when notification infrastructure exists.
- **"Most commented" sort on leaderboard** — only "most liked" added this phase; comments sort can be added later if there's demand.
- **Comment moderation / reporting** — out of scope for now, add to backlog.
- **Likes on leaderboard entries specifically** — PROJECT.md flagged this as out of scope for the leaderboard ranking itself; like counts are shown but don't affect score-based ranking.

</deferred>

---

*Phase: 23-social-interactions*
*Context gathered: 2026-03-24*
