# Research Summary: v2.0 Social Layer

## Stack Additions

- **cmpstr** (^4.1.0) — String similarity detection (Levenshtein, Dice–Sørensen) for idea versioning and duplicate detection; integrates at POST `/api/history` to check user's validation history before saving.
- **@voyageai/voyage-ai** (^1.0.0) — Embeddings for semantic niche clustering; generates 1536-dim vectors for idea text, enabling similarity scoring and category auto-detection with negligible monthly cost (~$0.02 at 1K ideas).
- **@tanstack/react-table** (^8.20.0) — Headless table for leaderboard pagination, sorting, and filtering; zero style coupling, pairs seamlessly with Tailwind and hand-drawn design system.

**No new dependencies needed for:** public/private toggle, user profiles, idea versioning meta-tracking, or challenge cards — these leverage existing Express routes, Redux slices, and schema columns.

---

## Feature Table Stakes

| Feature | Minimum Viable Implementation | Must Include |
|---------|------|-----------|
| **Leaderboard** | Top 10 ranked by score, filterable by niche, public results only | Single JOIN query (no N+1), paginated (20/page), niche-aware sorting, leaderboard_snapshots for challenge data |
| **Niche Auto-Detection** | Secondary Claude call post-validation, 8 fixed categories (Fintech, EdTech, etc.), stored in `saved_results.niche` | ≤10 max_tokens, ≤50 tokens output, rate limit 1 call/30s per user, confidence score tracking |
| **Idea Versioning** | Detect >75% similarity to user's prior ideas, prompt link option, store relationship chain with similarity_score | CmpStr similarity check on input, `idea_relationships` table, parent_idea_id tracking, version chain UI on profile |
| **User Profiles** | Public profile at `/profile/:username`, show display_name/bio, public validations list, user stats (count, avg score, top niche) | Username must be unique + immutable, only public results shown, pagination 20/page, clear "edit profile" button for owner |
| **Challenge Cards** | "Beat the Leaderboard" showing top scorer per niche, user's current rank, visual CTA | Daily/weekly snapshot logic, requires stable leaderboard rankings, personalized per user's validated niches |

---

## Architecture Highlights

### Database Schema Changes
- **New columns on `saved_results`:** `is_public BOOLEAN`, `niche VARCHAR(100)`, `parent_validation_id UUID`, `idea_semantics TEXT`
- **New columns on `users`:** `username VARCHAR(50) UNIQUE`, `display_name VARCHAR(255)`, `avatar_url TEXT`, `bio TEXT`, `is_public BOOLEAN`
- **New tables:** `validation_niches`, `idea_relationships`, `leaderboard_snapshots`
- **Critical indexes:** `saved_results(is_public, niche, scores->>'weighted')`, `users(username)`, `idea_relationships(similarity_score DESC)`

### New Express Routes
- **Public:** `GET /api/leaderboard`, `GET /api/leaderboard/niches`, `GET /api/profile/:username`, `GET /api/leaderboard/challenges`, `GET /api/leaderboard/challenge/:niche/top-scorer`
- **Private (auth required):** `PATCH /api/history/:id/visibility`, `POST /api/validations/:id/publish`, `POST /api/validations/:id/mark-revision`, `GET /api/validations/:id/similar`
- **Modified:** `POST /api/validate` (fire async niche detection), `POST /api/history` (include niche + similarity check in response)

### New Redux Slices
- **leaderboardSlice:** `items`, `status`, `selectedNiche`, `availableNiches`, `totalCount`, `hasMore`, `sort` (score|date), `error`
- **profileSlice:** `user`, `validations`, `stats` (totalValidations, avgScore, topNiche, topScore), `status`, `error`, `isOwner`
- **challengeSlice:** `challenges`, `status`, `error`
- **Modified validatorSlice:** add `niche`, `isPublic` fields and setters

### Build Order Summary (Phases 15–22)
1. **Phase 15:** Leaderboard read-only (schema + `/api/leaderboard` + TanStack table UI)
2. **Phase 16:** Niche auto-detection (secondary Claude call + `validation_niches` table)
3. **Phase 17:** Idea versioning (CmpStr similarity + `idea_relationships` + VersionChain UI)
4. **Phase 18:** User profiles (`/profile/:username` + ProfilePage + stats aggregation)
5. **Phase 19:** Publishing control (is_public toggle + `PATCH /api/history/:id/visibility`)
6. **Phase 20:** Semantic embeddings (Voyage AI embeddings + SimilarIdeasCard)
7. **Phase 21:** User-marked revisions (manual "Mark as Revision" button + relationship linking)
8. **Phase 22:** Challenge cards (leaderboard_snapshots + BeatTheLeaderboardCard)

---

## Watch Out For

1. **N+1 Query Explosion on Leaderboard Ranking** — Naive loop fetching users for each ranked result causes 20+ round-trip queries per request at scale. **Prevention:** Single JOIN query, composite index on `(is_public, niche, scores->>'weighted')`, materialized view cache refreshed every 5 minutes.

2. **Unoptimized Public/Private Toggle Breaks Data Isolation** — Missing `is_public` filter in one query exposes private validations on leaderboard or profile. **Prevention:** Audit every `saved_results` query for explicit WHERE clause; write defensive tests for 401/403 boundaries; use username (not user_id) in profile URLs to prevent ID enumeration.

3. **Secondary Claude API Calls for Niche Tagging Explode Costs** — Unbounded max_tokens or infinite loops calling Claude cost $100+ in hours. At 1K validations/day, uncontrolled tagging adds $138/month. **Prevention:** Cap max_tokens to 10, use fixed enum of 7 niches, rate limit 1 call/30s per user, track spend weekly, add cost alerts at 80% budget.

---

## Recommended Build Order

**Phase 15:** Leaderboard Foundation
- Add `is_public`, `niche` columns to `saved_results`; create `leaderboard_snapshots` table.
- Build `/api/leaderboard` with JOIN to users, niche filter, pagination.
- Create `leaderboardSlice` Redux; wire TanStack Table component.
- Add NavBar link; verify single JOIN query, <50ms latency on 10k results.

**Phase 16:** Niche Auto-Detection
- Add secondary Claude prompt to `systemPrompt.js` (max_tokens=10, fixed 7 niches).
- Async worker: after streaming completes, call Claude for niche, store in `saved_results.niche`.
- Create `/api/leaderboard/niches` endpoint for filter dropdown.
- Implement per-user rate limiting (1 call/30s); add cost tracking.

**Phase 17:** Idea Versioning (Semantic)
- Add `idea_relationships` table; install cmpstr library.
- Implement similarity check in POST `/api/history` (before INSERT); if >75%, return prompt + similar_to_id.
- Build SimilarIdeasCard component for ResultPage; show "Similar to [past idea]" with link.
- Test similarity threshold, chain integrity, zero loops.

**Phase 18:** User Profiles & Public/Private
- Create `/api/profile/:username` endpoint; profile page with stats, public validations list.
- Add `username`, `display_name`, `bio`, `avatar_url` to users table; ensure username unique.
- Build ProfilePage, ProfileHeader, ProfileValidationsList components.
- Audit all queries for `is_public=true` WHERE clauses; write data isolation tests.

**Phase 19:** Niche-Based Filtering & Publishing Control
- Add `PATCH /api/history/:id/visibility` route; toggle is_public.
- Build PublishToggle component on ResultPage.
- Add niche column to HistoryPage; allow bulk publish.
- Update `validatorSlice` with `isPublic` field; ensure profile URLs respect visibility.

**Phase 20:** Advanced Similarity Detection (Embeddings)
- Install Voyage AI SDK; add `idea_semantics` column to `saved_results`.
- Async worker: after niche detection, generate embedding via Voyage API (1–2s latency, negligible cost).
- Compute cosine similarity with user's past embeddings; upsert `idea_relationships` if >0.75.
- Build SimilarIdeasCard with side-by-side comparison; test embedding cost <$1 per 100 ideas.

**Phase 21:** User-Marked Revisions
- Add "Mark as Revision" button to ResultPage ActionButtons.
- Modal shows user's past validations; POST to `/api/validations/:id/mark-revision` with parent_id.
- Update profile to show version chains and revision count in stats.
- Test chain DAG integrity (no circular references); display "View revisions" link.

**Phase 22:** Challenge Cards & Leaderboard Snapshots
- Scheduled job: daily/weekly cron populates `leaderboard_snapshots` (top 10 per niche).
- Build `/api/leaderboard/challenges` endpoint; show top scorer + user's rank per niche.
- Create BeatTheLeaderboardCard + ChallengeBoard components.
- Add to HomePage or NavBar; personalize challenges per user's niches.
- Test snapshot logic, challenge freshness, user rank accuracy.

