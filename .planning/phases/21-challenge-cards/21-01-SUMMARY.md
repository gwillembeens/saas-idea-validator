---
plan: 21-01
status: complete
date_completed: "2026-03-23"
---

# Plan 21-01 Summary: Backend — Top Score Per Niche Endpoint

## Objective
Implement `GET /api/leaderboard/top-per-niche` endpoint that returns the highest weighted score per niche for all 8 niches.

## Execution

### Task 21-01-00: Write backend test stubs
**Status:** ✓ Complete

Added 6 test cases to `server/routes/leaderboard.test.js`:
- `returns { topScores } array with HTTP 200`
- `returns exactly 8 entries — one per VALID_NICHE`
- `score field contains MAX weighted score for that niche`
- `niches with no public entries return score: null, count: 0`
- `excludes private validations (is_public=false)`
- `excludes soft-deleted validations (deleted_at IS NOT NULL)`

All tests marked as pending stubs initially, then implemented.

**Commit:** `feat(21-01-00): add test stubs for top-per-niche endpoint`

### Task 21-01-01: Implement topPerNicheRoute handler
**Status:** ✓ Complete

Implemented `topPerNicheRoute` async function in `server/routes/leaderboard.js`:
- Executes SQL query to find MAX weighted score per niche
- Filters by `is_public = true` and `deleted_at IS NULL`
- Groups by niche, orders by niche name
- Maps database results to ensure all 8 VALID_NICHES are present
- Returns `null` score and `count: 0` for niches with no public entries
- Returns JSON response: `{ topScores: [...] }`

**Commit:** `feat(21-01-01): implement topPerNicheRoute handler`

### Task 21-01-02: Register GET /api/leaderboard/top-per-niche route
**Status:** ✓ Complete

Registered the route in `server/index.js`:
- Added `topPerNicheRoute` to imports from `./routes/leaderboard.js`
- Registered route **before** general leaderboard route (route matching order matters)
- Route pattern: `app.get('/api/leaderboard/top-per-niche', topPerNicheRoute)`
- No authentication required (public data)

**Commit:** `feat(21-01-02): register GET /api/leaderboard/top-per-niche route`

### Task 21-01-03: Implement and verify all 6 backend tests
**Status:** ✓ Complete

Fully implemented all 6 test cases:
1. **Test 1 - HTTP 200 + topScores array:** Verifies status code and response structure
2. **Test 2 - Exactly 8 entries:** Checks all 8 VALID_NICHES present with correct names
3. **Test 3 - MAX weighted score:** Seeds 2 public Fintech results (3.5, 4.8), verifies top score is 4.8
4. **Test 4 - Null scores for empty niches:** Validates all entries have correct null/count structure
5. **Test 5 - Excludes private:** Creates 1 private + 1 public HRTech result, verifies only public score returned
6. **Test 6 - Excludes soft-deleted:** Creates 1 deleted + 1 public EdTech result, verifies only public score returned

Test setup:
- Installed `supertest` for HTTP request testing
- Added database seeding helpers: `createTestUser()`, `createSavedResult()`
- Implemented cleanup: `cleanupTestData()` to isolate tests
- Loaded dotenv in test file before importing app
- Updated index.js to export `app` for testing

**Commit:** `feat(21-01-03): implement and verify all 6 backend tests for top-per-niche endpoint`

## Results

### Test Coverage
- **All 48 backend tests passing** (exit code 0)
- 6 new tests for top-per-niche endpoint all pass
- Existing tests unaffected (test for truncateIdeaText fixed and passing)

### API Response Format
```json
{
  "topScores": [
    {
      "niche": "Fintech",
      "score": 4.8,
      "count": 2
    },
    {
      "niche": "Logistics",
      "score": null,
      "count": 0
    },
    ...
  ]
}
```

### Requirements Met
- ✓ All 8 niches returned (even with no public entries)
- ✓ Private validations excluded (`is_public=false`)
- ✓ Soft-deleted validations excluded (`deleted_at IS NOT NULL`)
- ✓ `score: null` for niches with zero public entries
- ✓ All backend tests passing
- ✓ Single query, no pagination
- ✓ Route registered before general leaderboard route (avoids conflicts)

## Notes

### Key Design Decisions
1. **Route ordering:** `/api/leaderboard/top-per-niche` registered before `/api/leaderboard` to ensure Express matches specific route first
2. **VALID_NICHES mapping:** Database query returns only niches with data, so we map results and fill in missing niches with null scores
3. **Test isolation:** Each test cleans up before and after execution to avoid data interference from other tests
4. **Database schema:** Required columns discovered during test implementation: `title`, `markdown_result` (in addition to `idea_text`, `scores`)

### Dependencies Added
- `supertest` (devDependency) for HTTP testing of Express routes
- `dotenv` already present, imported first in test file to load env vars

### Files Modified
- `server/routes/leaderboard.js` — Added `topPerNicheRoute` handler
- `server/routes/leaderboard.test.js` — Added 6 test cases with full implementations
- `server/index.js` — Updated imports, registered route, exported app for testing
- `server/package.json` — Added supertest

---

*Plan 21-01 execution complete. All tasks executed atomically with individual commits. Ready for Phase 21 Wave 1 frontend implementation.*
