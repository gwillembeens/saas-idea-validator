# Architecture Research: Social Layer Integration

## Summary

The social layer extends the existing validated-ideas system into a community platform by adding public leaderboards (ranked by score, filterable by niche), user profile pages, idea versioning/similarity tracking, and "Beat the Leaderboard" challenge cards. This integrates seamlessly with the existing PostgreSQL schema, Redux architecture, and Express API surface without breaking the core validator flow.

---

## Database Changes

### New Columns on Existing Tables

#### `saved_results` table
```sql
-- Niche auto-detected via secondary Claude call after initial validation
ALTER TABLE saved_results ADD COLUMN IF NOT EXISTS niche VARCHAR(100);

-- Public visibility toggle (default false)
ALTER TABLE saved_results ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Parent validation for versioning/revision tracking
ALTER TABLE saved_results ADD COLUMN IF NOT EXISTS parent_validation_id UUID REFERENCES saved_results(id) ON DELETE SET NULL;

-- Denormalized user reference for efficient leaderboard queries
ALTER TABLE saved_results ADD COLUMN IF NOT EXISTS user_id_denorm UUID; -- already exists
-- Add index for public leaderboard queries
CREATE INDEX IF NOT EXISTS saved_results_public_niche_score_idx
  ON saved_results(niche, (scores->>'weighted')::float DESC, created_at DESC)
  WHERE is_public = true AND deleted_at IS NULL;
```

#### `users` table
```sql
-- Public profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Profile visibility (false = private, don't show in leaderboard/searches)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Indexes for profile lookups
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username) WHERE is_public = true;
```

### New Tables

#### `validation_niches` — Cached/validated niche categories
```sql
CREATE TABLE IF NOT EXISTS validation_niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  validation_count INT NOT NULL DEFAULT 0,
  avg_score NUMERIC(3, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS validation_niches_validation_count_idx ON validation_niches(validation_count DESC);
```

#### `idea_relationships` — Track similarity/versions for revision detection
```sql
CREATE TABLE IF NOT EXISTS idea_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id_a UUID NOT NULL REFERENCES saved_results(id) ON DELETE CASCADE,
  validation_id_b UUID NOT NULL REFERENCES saved_results(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL
    CHECK (relationship_type IN ('revision_of', 'similar_to', 'variant_of')),
  similarity_score NUMERIC(4, 3) NOT NULL DEFAULT 0, -- 0.000 to 1.000
  detected_by VARCHAR(50) NOT NULL DEFAULT 'semantic', -- semantic, user_marked
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_validations CHECK (validation_id_a != validation_id_b),
  CONSTRAINT unique_relationship UNIQUE (validation_id_a, validation_id_b, relationship_type)
);

CREATE INDEX IF NOT EXISTS idea_relationships_validation_a_idx ON idea_relationships(validation_id_a);
CREATE INDEX IF NOT EXISTS idea_relationships_validation_b_idx ON idea_relationships(validation_id_b);
CREATE INDEX IF NOT EXISTS idea_relationships_similarity_idx ON idea_relationships(similarity_score DESC);
```

#### `leaderboard_snapshots` — Time-series rankings for "Beat the Leaderboard" challenges
```sql
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  niche VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  validation_id UUID NOT NULL REFERENCES saved_results(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  weighted_score NUMERIC(3, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_snapshot UNIQUE (snapshot_date, niche, user_id, validation_id)
);

CREATE INDEX IF NOT EXISTS leaderboard_snapshots_date_niche_idx ON leaderboard_snapshots(snapshot_date, niche);
CREATE INDEX IF NOT EXISTS leaderboard_snapshots_user_idx ON leaderboard_snapshots(user_id);
```

---

## API Routes

### New API Routes

| Method | Path | Purpose | Auth | Returns |
|--------|------|---------|------|---------|
| GET | `/api/leaderboard` | List public validations ranked by score, optionally filtered by niche | Optional | `{ items: [], totalCount, niche?, hasMore }` |
| GET | `/api/leaderboard/niches` | List all niches with validation count and avg score | None | `[{ niche, count, avg_score }]` |
| GET | `/api/profile/:username` | Fetch user profile + public validations | Optional | `{ user: {}, validations: [], stats: {} }` |
| POST | `/api/validations/:id/publish` | Toggle is_public on a validation | Required (owner) | `{ id, is_public }` |
| POST | `/api/validations/:id/niche` | Manually override auto-detected niche (admin only or owner) | Required | `{ id, niche }` |
| GET | `/api/validations/:id/similar` | Fetch similar validations (by semantic embedding or similarity_score) | Optional | `[{ id, title, similarity_score }]` |
| POST | `/api/validations/:id/mark-revision` | User marks one validation as revision of another | Required (owner) | `{ relationship_id }` |
| GET | `/api/leaderboard/challenges` | Fetch "Beat the Leaderboard" challenge cards for user's niche | Required | `{ challenges: [] }` |
| GET | `/api/leaderboard/challenge/:niche/top-scorer` | Get current top scorer in a niche for challenge card | Optional | `{ user: {}, score, validationCount }` |

### Modified API Routes

| Method | Path | Change |
|--------|------|--------|
| POST | `/api/validate` | After streaming result, fire async secondary Claude call to detect niche; store in DB after user saves |
| POST | `/api/history` | Include `niche` in response once niche detection completes |
| GET | `/api/history/:id` | Include `is_public`, `niche`, `parent_validation_id` in response |
| PATCH | `/api/history/:id/title` | Also accepts `niche`, `is_public` in body (owner only) |

---

## Frontend: New Components

### Leaderboard Feature
- **LeaderboardPage.jsx** — Main leaderboard view with niche filter, sort controls, infinite scroll
- **LeaderboardCard.jsx** — Display single leaderboard entry (rank, title, user, score, niche)
- **NicheFilter.jsx** — Dropdown/pill selector for filtering by niche
- **LeaderboardStats.jsx** — Show total validations, avg score, trending niches

### User Profile
- **ProfilePage.jsx** — User profile view: avatar, display name, bio, public validations, user stats
- **ProfileHeader.jsx** — Display user info, follow button (for future), edit button (if owner)
- **ProfileValidationsList.jsx** — Grid/list of user's public validations

### Challenge Cards
- **BeatTheLeaderboardCard.jsx** — Shows current leaderboard leader in a niche, user's ranking, submit button
- **ChallengeBoard.jsx** — Container showing 3–5 active challenges

### Sharing & Publishing
- **PublishToggle.jsx** — Switch to toggle is_public, appears on ResultPage
- **SimilarIdeasCard.jsx** — Shows related validations when viewing a result

### Supporting Components
- **NicheTag.jsx** — Badge showing idea's niche
- **SimilarityScore.jsx** — Visual indicator of how similar two ideas are

---

## Frontend: Modified Components

### ResultPage.jsx
- Add `PublishToggle` to ActionButtons
- Display niche tag beneath title
- Show similar ideas section (if any exist)
- Add link to creator's profile

### IdeaInput.jsx / Validator Components
- After successful validation save, show option to make public / set niche

### NavBar.jsx
- Add link to /leaderboard
- Add link to /profile/:username (if logged in)

### AppShell.jsx / Router
- Add routes: `/leaderboard`, `/profile/:username`

### HistoryPage.jsx
- Add column/filter for public vs private validations
- Option to bulk-publish validations

---

## Redux: New/Modified Slices

### New Slice: `leaderboardSlice.js`
```javascript
{
  items: [],                    // leaderboard entries
  status: 'idle',               // idle | loading | error
  selectedNiche: null,          // active niche filter
  availableNiches: [],          // list of all niches
  totalCount: 0,
  hasMore: true,
  sort: 'score',                // score | date
  error: null,
}

Actions:
- setItems(items)
- appendItems(items)
- setSelectedNiche(niche)
- setAvailableNiches(niches)
- setStatus(status)
- setSort(sort)
- setHasMore(hasMore)
- setTotalCount(count)
- setError(error)
```

### New Slice: `profileSlice.js`
```javascript
{
  user: null,                   // { id, username, display_name, avatar_url, bio, is_public }
  validations: [],              // user's public validations
  stats: {                       // aggregated user stats
    totalValidations: 0,
    avgScore: 0,
    topNiche: null,
    topScore: 0,
  },
  status: 'idle',               // idle | loading | error
  error: null,
  isOwner: false,               // true if viewing own profile
}

Actions:
- setUser(user)
- setValidations(validations)
- setStats(stats)
- setStatus(status)
- setError(error)
- setIsOwner(boolean)
```

### New Slice: `challengeSlice.js`
```javascript
{
  challenges: [],               // active challenges for user's niches
  status: 'idle',
  error: null,
}

Actions:
- setChallenges(challenges)
- setStatus(status)
- setError(error)
```

### Modified Slice: `validatorSlice.js`
- Add `niche: null` field
- Add `isPublic: false` field
- Add action `setNiche(niche)`
- Add action `setIsPublic(boolean)`

### Modified Slice: `historySlice.js`
- Add filter state: `nicheFilter: null`
- Add action `setNicheFilter(niche)`
- Modify `selectFilteredHistory` selector to also filter by niche

---

## Similarity Detection Approach

### Algorithm: Two-Tier Detection

#### Tier 1: Semantic Embedding (via Claude API)
**When:** Immediately after validation completes, in background task
**Method:**
1. Call Claude with a system prompt: "Extract a semantic embedding of the core business idea (50-100 words describing the problem, solution, target market)."
2. Store embedding as `idea_semantics` in `saved_results` (new JSONB column).
3. On new validation, compute cosine similarity between new embedding and all user's past embeddings.
4. If similarity > 0.75, create `idea_relationships` row with `relationship_type='variant_of'` or `'revision_of'` and the score.

#### Tier 2: User-Marked Revisions
**When:** User manually marks "This is a revision of..." on ResultPage
**Method:**
1. FrontEnd has "Mark as Revision" button that shows dropdown of user's past validations.
2. POST to `/api/validations/:id/mark-revision` with `parent_validation_id`.
3. Creates `idea_relationships` row with `relationship_type='revision_of'` and `similarity_score=1.0`.

#### Detection UI:
- After niche detection completes (async), check `idea_relationships` table.
- If relationship found, show in a "Similar Ideas" card: "You've validated a similar idea on [date]. View it →"
- On profile, show "3 revisions of this core idea" as stats.

#### Storing Embeddings Safely:
```sql
ALTER TABLE saved_results ADD COLUMN IF NOT EXISTS idea_semantics TEXT;
-- Store as space-separated floats or compressed base64 to keep size reasonable
-- Example: '0.121 -0.034 0.567 ...' (512 or 768 dims)
```

**Cost Control:**
- Only run Tier 1 embedding for new validations (not batch).
- Cache embeddings to avoid recomputation.
- Batch similarity checks: only compute if `idea_semantics` exists.

---

## Suggested Build Order

### Phase 1: Foundation (Database & Auth)
**Rationale:** All social features depend on clean data model and user profiles.

1. **Migrate `saved_results` table** — add `niche`, `is_public`, `parent_validation_id` columns.
2. **Migrate `users` table** — add `username`, `display_name`, `avatar_url`, `bio`, `is_public`.
3. **Create `validation_niches` table** — seed with common SaaS niches from system prompt.
4. **Create `idea_relationships` table** — prepare for similarity tracking (but no logic yet).
5. **Create `leaderboard_snapshots` table** — prepare for challenge feature (manual snapshot logic later).

### Phase 2: Niche Detection (Core Logic)
**Rationale:** Niche is the pivot point for leaderboard filtering and challenge cards; must work before leaderboard UI.

6. **Create niche detection prompt** — add to `server/systemPrompt.js` a secondary Claude request that extracts niche from the markdown result.
7. **Async niche worker** — modify `/api/validate` to fire background task after streaming completes; calls Claude, updates `saved_results.niche`.
8. **Update `/api/history` POST/GET** — include niche in response; handle `null` niche gracefully.
9. **Update `validatorSlice`** — add `niche` field; dispatch `setNiche` when niche detection completes.

### Phase 3: Public Leaderboard (Read-Only)
**Rationale:** No user actions needed yet; establish query patterns and UI.

10. **Create `/api/leaderboard` route** — query `saved_results WHERE is_public AND deleted_at IS NULL ORDER BY (scores->>'weighted')::float DESC`; support `?niche=...` filter; implement pagination.
11. **Create `/api/leaderboard/niches` route** — aggregate query returning distinct niches with counts and avg scores.
12. **Create `leaderboardSlice` Redux** — fetch niches on app init, handle infinite scroll.
13. **Build LeaderboardPage + LeaderboardCard** — list results with rank, niche tag, user link.
14. **Add NavBar link** — wire `/leaderboard` route.

### Phase 4: User Profiles
**Rationale:** Leaderboard links to profiles; need profile view before making leaderboard interactive.

15. **Create `/api/profile/:username` route** — fetch user + their public validations + stats.
16. **Create `profileSlice` Redux** — fetch profile data on load, set `isOwner` flag.
17. **Build ProfilePage + ProfileHeader + ProfileValidationsList** — display user info, public validations grid.
18. **Add edit mode** — if `isOwner`, allow inline editing of `display_name`, `bio`, avatar upload.
19. **Add profile links** — from LeaderboardCard and ResultPage, link to `/profile/:username`.

### Phase 5: Publishing & Visibility Control
**Rationale:** Users can now make validations public; leaderboard is populated by their choices.

20. **Create `POST /api/validations/:id/publish` route** — toggle `is_public`, owned by user.
21. **Add `PublishToggle` component** — appears on ResultPage ActionButtons.
22. **Modify `/api/history` PATCH** — accept `is_public` in body; validate ownership.
23. **Add public/private filter to HistoryPage** — show toggle in header; filter slice state.
24. **Update `validatorSlice`** — add `isPublic` field; dispatch `setIsPublic` when user toggles.

### Phase 6: Similarity Detection (Semantic)
**Rationale:** Requires embedding infrastructure; enables revision tracking and "Similar Ideas" UX.

25. **Add `idea_semantics` column** — TEXT column on `saved_results`.
26. **Create embedding worker function** — call Claude embedding endpoint (or use sentence-transformers library if budget allows); store space-separated floats.
27. **Modify POST `/api/history`** — after save, fire async embedding task.
28. **Create similarity check function** — on new validation, compute cosine similarity with user's past validations.
29. **Upsert `idea_relationships`** — if similarity > 0.75, create relationship row.
30. **Build SimilarIdeasCard component** — show on ResultPage: "Similar to [past validation]".

### Phase 7: User-Marked Revisions (Optional Enhancement)
**Rationale:** Allows users to explicitly link ideas; lower cost than semantic detection.

31. **Add "Mark as Revision" button** — ResultPage ActionButtons.
32. **Create modal** — shows user's past validations, allows selection.
33. **Create `POST /api/validations/:id/mark-revision` route** — upsert `idea_relationships` with `relationship_type='revision_of'`, `similarity_score=1.0`.
34. **Update profile stats** — count revisions under top idea.

### Phase 8: Challenge Cards (Beat the Leaderboard)
**Rationale:** Gamification layer; depends on stable leaderboard rankings.

35. **Create scheduled snapshot job** — daily (or weekly) cron that populates `leaderboard_snapshots` table with top 10 per niche.
36. **Create `/api/leaderboard/challenges` route** — fetch snapshots for niches user has validated in, show top scorer + their rank.
37. **Create `/api/leaderboard/challenge/:niche/top-scorer` route** — quick fetch of current top user in a niche.
38. **Build BeatTheLeaderboardCard component** — show leader's name, their score, "Beat this!" CTA.
39. **Build ChallengeBoard component** — container showing 3–5 active challenges, infinite scroll for more.
40. **Add to NavBar or HomePage** — CTA to see challenges.

### Phase 9: Admin / Moderation (Optional, Out of Scope)
**Rationale:** For future; allows admins to manage niches, ban users, etc.

41. **Create admin dashboard** — manage `validation_niches`, toggle user `is_public` flag.
42. **Add niche override endpoint** — `/api/validations/:id/niche` (owner or admin).

---

## Integration Points Summary

| System | Change | Impact |
|--------|--------|--------|
| **Validator Flow** | Add async niche detection after streaming ends | Non-blocking; doesn't break current UX |
| **Redux** | New slices + modified slices | No breaking changes; additive only |
| **ResultPage** | Add PublishToggle, SimilarIdeasCard, ProfileLink | Integrated into existing ActionButtons + metadata sections |
| **HistoryPage** | Add niche filter + public/private toggle | Optional enhancement; old filter still works |
| **Navigation** | Add /leaderboard and /profile/:username | New routes, existing routes unaffected |
| **Database** | 4 new tables, 5 new columns, 6 new indexes | Backward compatible; old data works unchanged |

---

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| **Niche detection adds latency to POST /api/history** | Fire as async worker; don't block response. Return `niche: null` until detection completes. |
| **Embedding computation is expensive** | Batch on user request, cache results, use library (e.g., `sentence-transformers`) instead of API calls. |
| **Leaderboard query slow on large dataset** | Index on `(niche, weighted_score DESC)` with `is_public=true` filter. Paginate with LIMIT + OFFSET. |
| **Privacy: users don't want profiles public** | Default `is_public=true` on new validations; make opt-in to publish (not opt-out). Add user-level `is_public` flag on `users` table. |
| **Spam/low-quality validations flooding leaderboard** | Minimum score threshold (e.g., >= 2.0) for public visibility. Moderation queue (future). |

