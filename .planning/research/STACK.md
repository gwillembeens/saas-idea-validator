# Stack Research: Social Layer

## Summary

The social layer features (leaderboard, niche auto-detection via Claude, idea similarity/versioning, user profiles, public/private validation toggles) can be built with **minimal new dependencies**. The existing stack (PostgreSQL, Express, React Router, Redux Toolkit) handles most requirements. Only three packages are recommended: **CmpStr** for text similarity detection (idea versioning), **Voyage AI embeddings** (via SDK) for semantic niche categorization, and **TanStack Table** for leaderboard pagination. No Redis or external caching is needed for v1.

---

## New Dependencies Needed

| Package | Version | Purpose | Why needed | Integration |
|---------|---------|---------|-----------|-------------|
| `cmpstr` | ^4.1.0 | Idea similarity/versioning | Detect duplicate or near-duplicate ideas via Levenshtein/Dice–Sørensen algorithms. Decides when to create new versions vs. mark as duplicate. | Backend: `/api/ideas/similarity` endpoint checks incoming idea text against user's history |
| `@voyageai/voyage-ai` | ^1.0.0 | Niche auto-detection embeddings | Generate embeddings for idea text + framework analysis, cluster ideas by semantic niche without manual tagging. Pass embedding to Claude for niche label generation. | Backend: Call after validation, store embedding + niche in saved_results. Frontend: display niche tag on cards. |
| `@tanstack/react-table` | ^8.20.0 | Leaderboard table with pagination | Headless table logic for sorting, filtering, pagination on public leaderboard (top ideas by score + saves). Zero styling overhead, pairs with Tailwind. | Client: New `Leaderboard` page component. Fetch `/api/leaderboard?page=1&sort=score`. |

---

## No New Dependencies Needed For

- **Public/private toggle on validations** — Already in schema (`saved_results` needs `is_public` column). Use `PATCH /api/history/:id/visibility` to flip. Redux slice dispatches `togglePublic`. Zero libraries.
- **User profiles** — Use existing auth structure (users table + OAuth accounts). Create `/api/users/:username/profile` GET and `/api/users/:id/validations` GET. Route component reads from Redux. No new packages.
- **Idea versioning** — Schema already supports `saved_results` per user with `created_at`. Add `parent_idea_id UUID` + `similarity_score FLOAT` to track versions. Query `/api/history/:id/versions` for version chain. Use CmpStr to populate similarity_score on create.
- **Leaderboard ordering** — SQL `ORDER BY scores -> 'weighted' DESC LIMIT 10` handles top 10 by weighted score. Add `saves_count INT` column, `ORDER BY saves_count DESC` for alternate sort.

---

## Integration Points

### Backend Additions

1. **Database Schema Changes**
   ```sql
   -- Add to saved_results table
   ALTER TABLE saved_results ADD COLUMN is_public BOOLEAN DEFAULT false;
   ALTER TABLE saved_results ADD COLUMN niche VARCHAR(100) DEFAULT NULL;
   ALTER TABLE saved_results ADD COLUMN niche_embedding vector(1536) DEFAULT NULL;  -- if using pgvector
   ALTER TABLE saved_results ADD COLUMN parent_idea_id UUID REFERENCES saved_results(id) ON DELETE SET NULL;
   ALTER TABLE saved_results ADD COLUMN similarity_score FLOAT DEFAULT NULL;
   ALTER TABLE saved_results ADD COLUMN saves_count INT DEFAULT 0;

   -- Leaderboard view
   CREATE INDEX saved_results_is_public_weighted_score_idx
   ON saved_results(is_public, (scores -> 'weighted') DESC)
   WHERE deleted_at IS NULL AND is_public = true;
   ```

2. **New Routes (Express)**
   - `PATCH /api/history/:id/visibility` — toggle is_public
   - `GET /api/leaderboard?page=1&limit=20&sort=score|saves` — public results, paginated, sorted
   - `GET /api/users/:username` — public profile data
   - `GET /api/users/:id/validations?page=1` — public validations from user
   - `POST /api/history/:id/save` — increment saves_count, add user to saves list (new table: `validation_saves`)
   - `GET /api/ideas/similar?text=...&threshold=0.8` — check for similar ideas in user's history

3. **Niche Detection Flow**
   ```js
   // After validation succeeds, in validateRoute:
   const embedding = await voyageClient.embed({
     input: idea,
     model: 'voyage-3.5'
   })
   const niche = await extractNicheViaPrompt(markdown_result, embedding)
   // Store niche + embedding in saved_results
   ```

4. **Similarity Check on Create**
   ```js
   // In saveResultRoute, before INSERT:
   const similar = await checkSimilarity(idea_text, user_id, threshold = 0.75)
   if (similar) {
     return res.json({
       similar_to_id: similar.id,
       similarity: 0.82,
       message: 'This idea is similar to a previous one. Create version or discard?'
     })
   }
   ```

### Client Additions

1. **New Pages**
   - `/leaderboard` — TanStack Table with public results, sorting, pagination
   - `/users/:username` — public profile card, list their public validations, bio section
   - `/history/:id/versions` — version chain for an idea

2. **Redux Slice Updates**
   - Add `leaderboardSlice` for paginated results, filters, sorting state
   - Extend `validatorSlice` with `isPublic`, `niche` fields
   - Add `userProfileSlice` for `/users/:username` data

3. **Component Additions**
   - `Leaderboard.jsx` — TanStack Table wrapper, sorting/pagination UI
   - `UserProfile.jsx` — public profile card, validation list
   - `VersionChain.jsx` — timeline of idea versions with similarity scores
   - `VisibilityToggle.jsx` — radio group (public/private) in result details
   - `NicheTag.jsx` — styled badge for niche label (red, blue, yellow themes per niche)
   - `ShareButton.jsx` — copy public profile URL

---

## What NOT to Add

| Package | Why to Avoid |
|---------|---|
| **typeorm / Sequelize / Prisma** | Existing schema is PostgreSQL-only, raw pg client is battle-tested in this codebase. ORMs add complexity + runtime overhead. Stick with parameterized queries. |
| **Redis** | For v1 leaderboard (< 1000 ideas), simple SQL pagination + in-process caching of embeddings suffice. Add Redis only when you cross 10K ideas and need distributed cache for multi-server. Single-server? No Redis. |
| **Elasticsearch / Meilisearch** | Niche search is solved by Voyage embeddings + SQL filtering. Full-text search overhead not justified until you need faceted drill-down by multiple niche categories. |
| **Socket.io / real-time updates** | Leaderboard is read-heavy, updated ~1x per new validation. Polling or simple refresh is fine. WebSockets only if you add live comments or voting. |
| **Chart.js / Recharts** | Leaderboard is a sorted table, not a graph. No charting needed for v1. |
| **Auth0 / Supabase** | Existing JWT + OAuth (Google/GitHub) via custom code works well. Avoid vendor lock-in. |
| **TailwindUI / DaisyUI** | Already committed to custom hand-drawn design system (wobbly borders, Patrick Hand font). Component libraries fight that aesthetic. Build components from scratch + Tailwind primitives. |

---

## Recommended Install Order

1. **Backend first** (Express routes + schema):
   ```bash
   cd server
   npm install cmpstr@^4.1.0 @voyageai/voyage-ai@^1.0.0
   ```
   - Rationale: similarity detection + niche embedding happen server-side before results are sent to client.

2. **Database migration**:
   ```bash
   # Run schema.sql changes (is_public, niche, niche_embedding, parent_idea_id, similarity_score, saves_count)
   psql $DATABASE_URL < db/schema.sql
   ```

3. **Client second** (leaderboard UI):
   ```bash
   cd client
   npm install @tanstack/react-table@^8.20.0
   ```
   - Rationale: depends on backend `/api/leaderboard` endpoint being live.

---

## Key Design Decisions

### Voyage AI vs. Claude Embeddings
- **Why Voyage?** Anthropic officially recommends Voyage for text similarity + RAG. Claude API does not offer embeddings (text-only). Voyage embeddings are normalized (length 1), making cosine similarity efficient.
- **Cost:** Voyage-3.5 is ~$0.02 per 1M tokens. At 1K ideas, cost is negligible (~$0.02/month).
- **Storage:** Store normalized vectors in PostgreSQL as `vector(1536)` with pgvector extension (optional; can store as JSONB if pgvector unavailable).

### CmpStr vs. Alternatives
- **Why CmpStr?** Redesigned in 2025 with multiple algorithms (Levenshtein, Dice–Sørensen, Jaro-Winkler, LCS). Lightweight, zero dependencies, TypeScript-friendly.
- **Alternatives considered:**
  - `string-similarity` — simpler, slower, fewer algorithms.
  - `fast-fuzzy` — uses Damerau-Levenshtein, good for typo tolerance. Slightly heavier than CmpStr.
  - **Decision:** CmpStr is modern, actively updated, multiple algorithms in one package.

### TanStack Table vs. Material-UI / react-data-grid
- **Why TanStack?** Headless (no locked-in styling), works seamlessly with Tailwind, zero dependencies for core logic.
- **Alternatives considered:**
  - `react-data-grid` — powerful, but opinionated styling conflicts with hand-drawn system.
  - `Material React Table` — adds Material UI, breaks custom design system.
  - **Decision:** TanStack gives you sorting + pagination logic; you style with Tailwind + custom wobbly components.

### Niche Detection: Claude Prompt vs. Embeddings
- **Hybrid approach:** Use Voyage embeddings for clustering, then pass top 3 similar ideas to Claude in a prompt: *"These ideas are in the same semantic cluster: {cluster}. What niche do they belong to? (e.g., 'Revenue Intelligence', 'Compliance Automation', 'Supply Chain Optimization'). Choose one short label."*
- **Why?** Embeddings alone don't produce human-readable labels. Claude generates semantically accurate niches without retraining. Cost: ~0.5-1 cent per idea.

### Public/Private + Saves
- **Saves are non-binding** — idea stays in author's history whether it has 0 or 1000 saves. Saves are a public metric only (leaderboard sort).
- **Is Public toggle:** author chooses. If false, idea appears only to author + anyone with direct URL (who is logged in). Public means searchable + ranked on leaderboard.

---

## Performance Expectations (v1)

| Operation | Latency | Notes |
|---|---|---|
| Validate idea + generate niche embedding | 15–25s | Claude streaming (4–8s) + Voyage embed (1–2s) + parsing (1s) |
| Check similarity in user's history | 50–200ms | CmpStr string ops (O(n·m) for n ideas, m avg length). Cached in process. |
| Fetch leaderboard (page 1, 20 results) | 100–300ms | SQL sort + limit, no N+1 queries (use JOIN on user table) |
| Fetch user profile (10 validations) | 150–400ms | Two queries: user data + validations. No N+1. |
| Save validation (w/ similarity check + embedding) | 2–5s | Similarity check (50ms) + Voyage call (2–3s) + INSERT (100ms) |

For 1K–10K validations, these remain sub-second except the Claude/Voyage async ops (which are fine — they don't block the client).

---

## Rollout Phases (Recommended)

**Phase 1 (MVP):** Public/private toggle + basic leaderboard (top 10 by score)
- Schema: add `is_public` + `saves_count`
- Backend: `/api/leaderboard`, `PATCH /api/history/:id/visibility`
- Frontend: Leaderboard page, VisibilityToggle component
- **Dependencies:** TanStack Table only. No Voyage, no CmpStr.
- **Effort:** ~1–2 dev days

**Phase 2 (Week 2):** Niche auto-detection + user profiles
- Add Voyage SDK, embed ideas on validate
- Backend: `/api/users/:username`, niche storage
- Frontend: UserProfile page, NicheTag component
- **Dependencies:** @voyageai/voyage-ai
- **Effort:** ~2–3 dev days

**Phase 3 (Week 3+):** Idea versioning + advanced similarity
- Add CmpStr for similarity scoring
- Backend: `/api/ideas/similar`, version chain logic
- Frontend: VersionChain page, SimilarityWarning on save
- **Dependencies:** cmpstr
- **Effort:** ~2–3 dev days

This allows you to ship leaderboard + public/private independently, then layer niche + versioning without breaking existing features.
