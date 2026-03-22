# Pitfalls Research: Adding Social Layer to SaaS Idea Validator

## Summary

Adding leaderboards, AI auto-tagging, idea versioning, and public profiles to an existing auth'd application introduces three critical risk categories: **database performance degradation** (N+1 queries, unoptimized ranking), **AI cost explosion** (secondary Claude calls, embedding vectors), and **security boundary erosion** (public/private toggle bugs, data exposure through public profiles). Without preventive architecture in phases 15–18, v2.0 will ship with slow leaderboards, unpredictable API costs, and authentication/authorization gaps that compound as feature surface area expands.

---

## Pitfall Table

| # | Pitfall | Risk Level | Prevention | When to Address |
|---|---------|-----------|------------|-----------------|
| 1 | N+1 query explosion on leaderboard ranking queries | High | Pre-compute materialized view of top scores; use window functions (ROW_NUMBER); cache results; filter by niche before fetching user profiles | Phase 15 (Leaderboard) |
| 2 | Unoptimized public/private toggle breaks data isolation | High | Add `is_public` boolean WITH explicit index; test permission checks on every query (get, list, share); audit history table queries to prevent private data leakage | Phase 15 (Leaderboard) |
| 3 | Secondary Claude API calls for niche tagging cost explodes unexpectedly | High | Budget & implement cost per request: set max_tokens=50, use enum of 7 fixed niches only, batch tag generation on off-peak, add rate limiting per user (1 tag call per 30s), track spend weekly | Phase 16 (Auto-Niche-Tagging) |
| 4 | Idea versioning without similarity detection leaves duplicate chains | Medium | Store embedding fingerprint (hash of first 500 chars) for quick rejection; implement pgvector for semantic similarity (0.75+ threshold); validate chain logic in tests before release | Phase 17 (Idea Versioning) |
| 5 | User profile pages leak private ideas or auth tokens via public URLs | High | Never expose user_id in profile URL (use username/slug instead, add unique constraint); render only public results on profile; add tests for 401/403 boundary conditions | Phase 18 (User Profiles) |
| 6 | Missing database indexes on new public columns causes cascading slowdown | High | Add indexes to: `saved_results(is_public, created_at)` for listing; `saved_results(user_id, is_public)` for user's public items; `saved_results(niche)` for filtering; measure before merging | Phase 15 (Leaderboard) |
| 7 | Unbounded similarity queries (every new idea compared to all prior ideas) | Medium | Limit comparison batch to last 500 ideas; use chunking to avoid timeout; only flag for manual review if similarity >0.85 with same user in same niche | Phase 17 (Idea Versioning) |
| 8 | Public leaderboard without rate limiting enables scraping / DDoS | Medium | Add global rate limit (100 req/min per IP) to `/api/leaderboard`; add pagination with max 20 results per request; cache results for 5 min; monitor query patterns | Phase 15 (Leaderboard) |
| 9 | Niche tag change breaks ranking / leaderboard UI after edit | Medium | Never allow retroactive niche tag change. Tag once at creation, lock it. If retagging needed, create new validation version instead. Test tag immutability in suite. | Phase 16 (Auto-Niche-Tagging) |
| 10 | Stale `is_public` cache mismatch between result detail and leaderboard listing | Medium | Use direct table reads (not cache) for permission checks; disable result caching on history slice; always check DB at query time for public/private state | Phase 15 (Leaderboard) |
| 11 | AI tagging confidence <0.7 pollutes leaderboard with vague niches | Medium | Store confidence score in DB; only display results with confidence ≥0.75 on leaderboard; show "Other" for low-confidence; add manual review queue for edge cases | Phase 16 (Auto-Niche-Tagging) |
| 12 | Password reset form wired to backend but no validation on old token expiry | Medium | Ensure reset tokens expire after 1 hour (enforce in backend); verify token not already used; test expired token rejection in e2e; add clear error UI | Phase 18+ (Tech Debt) |
| 13 | Public profile page lists all validations, including deleted ones via data extraction | Medium | Use soft delete (deleted_at IS NOT NULL filter); never expose deleted records in public lists; verify query excludes deleted_at IS NULL records | Phase 18 (User Profiles) |
| 14 | Rapid-fire validation + tagging calls cause burst API costs if rate limiting absent | Medium | Per-user rate limit: 10 validations/hour during off-peak, 5/hour peak; per-IP leaderboard rate limit 100req/min; add spend alerts at 80% of weekly budget | Phase 15–16 |
| 15 | Version chain UI confusion: user sees old scores as current, causing incorrect decisions | Low | Display score deltas clearly (Phase 1: 4→4, Phase 2: 3→4); always show "latest" badge; surface "view all versions" link; test UI comprehensibility with user session | Phase 17 (Idea Versioning) |

---

## Top 3 Critical Pitfalls

### 1. N+1 Query Explosion on Leaderboard Ranking (Risk: HIGH)

**The Pitfall:**
Naively fetching top validations and then loading user profiles for each row in a loop:
```javascript
// WRONG: This is N+1
const results = await db.query('SELECT * FROM saved_results WHERE is_public=true ORDER BY (scores->>\'weighted\')::float DESC LIMIT 20');
for (const result of results) {
  const user = await db.query('SELECT * FROM users WHERE id=$1', [result.user_id]); // 20 queries total
  result.user = user;
}
```

**Why It's Critical Now:**
- At v1.0 ship (~50–200 public validations), a 20-row leaderboard takes 21 queries — imperceptible.
- At v2.0 launch (~1000–5000 public validations), that same view might fetch 20 rows but face 20+ network round-trips per request.
- Each leaderboard load becomes 100–200ms slower. Pagination requests stack. Database connection pool fills up.
- Filtering by niche multiplies the effect: if 30% of results match "FinTech", the ranking query becomes a full table scan.

**Prevention (Phase 15 — Leaderboard):**
1. **Use a single JOIN query:**
   ```sql
   SELECT sr.id, sr.title, sr.scores, sr.niche, sr.created_at, u.id as user_id, u.username, u.avatar_url
   FROM saved_results sr
   JOIN users u ON sr.user_id = u.id
   WHERE sr.is_public = true AND sr.niche = $1
   ORDER BY (sr.scores->>'weighted')::float DESC
   LIMIT 20;
   ```

2. **Add indexes:**
   - `saved_results(is_public, niche, (scores->>'weighted') DESC)` — composite index for ranking
   - `users(id)` — already indexed, but ensure it exists

3. **Pre-compute materialized view:**
   - Create a `leaderboard_cache` table with top 100 per niche, refreshed every 5 minutes.
   - Query the cache instead of live table for initial leaderboard load.
   - Fallback to live query only for pagination beyond top 100.

4. **Test in suite:**
   - Log query count in test helper; assert `queryCount <= 1 + (pagination_param ? 1 : 0)`.
   - Simulate 10k public results; measure time to fetch top 20 by niche — should be <50ms.

---

### 2. Unoptimized Public/Private Toggle Breaks Data Isolation (Risk: HIGH)

**The Pitfall:**
A boolean `is_public` column added to `saved_results` without audit:
- Forgot to filter `is_public=true` in the public leaderboard list → **private validations appear on leaderboard**.
- Added `is_public` toggle in UI but permission check is client-side only → **anyone can flip private→public by modifying fetch request**.
- Shared result page queries include private results if `share_token` is missing → **share links expose private validations**.
- History page sorts by score but doesn't filter by user — **users see other people's history**.

**Why It's Critical Now:**
- Founders may include confidential traction numbers, unreleased business models, or IP in their idea descriptions.
- Public exposure of private validations erodes trust immediately — users delete account, leave bad reviews.
- A single permission check bug in _one_ query affects dozens of pages downstream.

**Prevention (Phase 15 — Leaderboard, Phase 18 — Profiles):**
1. **Add explicit indexes and constraints:**
   ```sql
   ALTER TABLE saved_results ADD CONSTRAINT is_public_not_null CHECK (is_public IS NOT NULL);
   CREATE INDEX idx_public_results ON saved_results(is_public, created_at DESC) WHERE is_public = true;
   CREATE INDEX idx_user_public ON saved_results(user_id, is_public) WHERE is_public = true;
   ```

2. **Audit every query touching `saved_results`:**
   - **Leaderboard endpoint:** `WHERE is_public = true AND niche = $1` ← required filter
   - **User profile endpoint:** `WHERE user_id = $1 AND is_public = true` ← required filter
   - **Share endpoint:** `WHERE share_token = $1 OR (id = $1 AND share_token IS NOT NULL)` ← explicit logic
   - **History endpoint (private):** `WHERE user_id = $1` ← no `is_public` filter, auth required
   - **Search endpoint (future):** `WHERE is_public = true` ← required filter

3. **Add defensive tests before shipping:**
   ```javascript
   describe('Data Isolation Tests', () => {
     test('leaderboard never returns private results', async () => {
       await createValidation({ is_public: false });
       const resp = await fetch('/api/leaderboard');
       expect(resp.data).toHaveLength(0);
     });

     test('user profile endpoint returns only public results', async () => {
       const user1 = await createUser();
       const user2 = await createUser();
       await createValidation({ user_id: user1.id, is_public: true });
       await createValidation({ user_id: user1.id, is_public: false });
       const resp = await fetch(`/api/users/${user1.username}`);
       expect(resp.data).toHaveLength(1);
     });

     test('unauthenticated user cannot fetch private history', async () => {
       const result = await createValidation({ is_public: false });
       const resp = await fetch(`/api/history/${result.id}`);
       expect(resp.status).toBe(401 or 403);
     });
   });
   ```

4. **Never expose `is_public` state in client state after toggle:**
   - Update UI optimistically, but always verify with backend on mount.
   - If toggle fails server-side, re-sync from DB.

---

### 3. Secondary Claude API Calls for Niche Tagging Explode Costs (Risk: HIGH)

**The Pitfall:**
Auto-tagging requires a second Claude API call after the main validation:
```javascript
// Phase 16 implementation
async function tagWithNiche(ideaText) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,  // ← unbounded, could output full essay
    system: 'Return ONLY one niche from: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other',
    messages: [{ role: 'user', content: ideaText }],
  });
  return response.content[0].text.trim();
}
```

**Cost Breakdown:**
- Main validation: ~1,500 tokens (output) × $3 per 1M tokens = $0.0045
- Niche tagging: ~50 tokens (output) × $3 per 1M = $0.00015
- Per validation cost becomes **$0.0046** instead of $0.0045.
- At 1,000 validations/day: **$4.60/day** (tagging), or **$138/month** extra.
- If max_tokens=200 and users paste 5,000-char ideas: **worst case $25/day** for a single feature.

**Why It's Critical Now:**
- Customers see unexpected charges if costs are unbounded.
- One bug (infinite loop calling Claude) can cost $100+ in an hour.
- Niche detection confidence varies: some ideas are clear (FinTech lender), others ambiguous (multi-industry platform) — wasting API calls on low-confidence outputs.

**Prevention (Phase 16 — Auto-Niche-Tagging):**

1. **Bound the niche-tagging prompt:**
   ```javascript
   const nichePrompt = `Classify this startup idea into ONE of these niches: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other.
   Return ONLY the niche name. Do not explain.`;

   const response = await client.messages.create({
     model: 'claude-sonnet-4-20250514',
     max_tokens: 10,  // ← "Fintech" is max 10 tokens
     temperature: 0,  // ← deterministic
     system: nichePrompt,
     messages: [{ role: 'user', content: ideaText.substring(0, 500) }],  // ← truncate input
   });
   ```

2. **Implement rate limiting per user:**
   - 1 validation + tag per 30 seconds per user.
   - Prevents burst behavior (user submitting 100 ideas at once).
   - Enforced in middleware before route handler.

3. **Track spending weekly:**
   - Log each API call with cost estimate.
   - Alert ops if weekly spend >$1,000.
   - Monthly cap per customer (higher tiers unlock higher caps).

4. **Store confidence and delay low-confidence tags:**
   - Return niche from Claude with a confidence score (inferred from response certainty).
   - Only tag immediately if confidence ≥0.75.
   - Queue low-confidence tags for manual review (no API call).
   - Batch manual review once/day or on demand.

5. **Test cost impact in suite:**
   ```javascript
   test('tagging 100 ideas costs <$1', async () => {
     const costs = [];
     for (let i = 0; i < 100; i++) {
       const idea = `An idea about ${randomNiche()}`;
       const cost = await estimateTagCost(idea);
       costs.push(cost);
     }
     const total = costs.reduce((a, b) => a + b, 0);
     expect(total).toBeLessThan(1.0);
   });
   ```

---

## Integration Pitfalls (Cross-Phase)

### Phase 15–16: Leaderboard + Tagging
- **Risk:** Niche filter on leaderboard queries untagged results (empty leaderboard at launch until all old results are re-tagged).
  - **Fix:** Backfill niche tags for all existing public results before leaderboard launch. Async job, verify completion before enabling filter.

### Phase 16–17: Tagging + Versioning
- **Risk:** User creates version 2 with different niche; leaderboard ranking changes retroactively, breaking "Beat the Leaderboard" challenge.
  - **Fix:** Allow niche retagging only on create, not on edit. Versioning creates a new row, so old niche stays locked.

### Phase 17–18: Versioning + Profiles
- **Risk:** User's profile page shows "3 validations" but lists 5 if one idea has 2 versions.
  - **Fix:** Count only the root idea (parent_validation_id IS NULL), link to full version chain as expandable detail.

### Phase 18+ (Future): Profiles + Search
- **Risk:** Public profile page doesn't paginate; user with 10,000 validations crashes browser.
  - **Fix:** Implement pagination (20 per page) with cursor-based pagination, not offset (prevents skipping on concurrent deletes).

---

## Security Boundaries to Test (All Phases)

Before each phase ships, verify:

1. **Unauthenticated access:**
   - Leaderboard is readable without login ✓
   - User profile is readable without login ✓
   - Private validations are NOT readable ✓

2. **Authorization:**
   - User A cannot see User B's private validations ✓
   - User A cannot unpublish User B's public result ✓
   - User A cannot delete User B's validation ✓

3. **Token expiry:**
   - Share tokens don't grant access to private data ✓
   - Expired reset tokens are rejected ✓
   - Refresh tokens rotate and invalidate old tokens ✓

---

## Prevention Roadmap by Phase

| Phase | Feature | Pre-Ship Checklist |
|-------|---------|-------------------|
| 15 | Leaderboard | ☐ N+1 test (query count ≤2); ☐ is_public index; ☐ Permission audit (all queries); ☐ Rate limit test; ☐ 10k result perf test |
| 16 | Auto-Tagging | ☐ Cost per request <$0.001; ☐ Rate limit test; ☐ Confidence scoring; ☐ Cost alert test; ☐ Batch backfill for existing results |
| 17 | Versioning | ☐ Similarity threshold test (0.75); ☐ Embedding cost test; ☐ Chain integrity test; ☐ Chain loop detection; ☐ Niche immutability test |
| 18 | User Profiles | ☐ Profile URL uses username, not user_id; ☐ Permission tests (all combinations); ☐ Pagination test (10k results); ☐ Public/private filtering test |

---

## Sources

- [N+1 Query Problem: Medium](https://medium.com/databases-in-simple-words/the-n-1-database-query-problem-a-simple-explanation-and-solutions-ef11751aef8a)
- [SQL Performance: Ranking Queries](https://medium.com/itversity/sql-performance-tuning-scenario-8-optimizing-ranking-queries-b15b5ad588c3)
- [Real-Time Leaderboards with Redis](https://aws.amazon.com/blogs/database/building-a-real-time-gaming-leaderboard-with-amazon-elasticache-for-redis/)
- [Authentication Bypass Vulnerabilities](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [AI Auto-Tagging: Data Quality](https://www.iconik.io/blog/ai-metadata-tagging-how-it-works-and-what-you-should-know)
- [Vector Embeddings & Cost](https://www.institutepm.com/knowledge-hub/vector-databases-explained)
- [Embedding Cost Optimization](https://elephas.app/blog/best-embedding-models)
- [Schema Evolution Best Practices](https://dev.to/dhanush___b/database-schema-design-for-scalability-best-practices-techniques-and-real-world-examples-for-ida)
