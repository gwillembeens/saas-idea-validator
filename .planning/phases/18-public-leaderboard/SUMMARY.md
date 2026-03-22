# Plan 18-01 — Backend: Leaderboard Route — SUMMARY

**Status:** COMPLETED ✓

**Date:** 2026-03-22

---

## Overview

Successfully implemented the backend foundation for a public leaderboard that serves paginated, niche-filtered validation results ranked by weighted score.

---

## Tasks Completed

### Task 1: DB Migration — Add username column ✓
**File:** `server/db/init.js`
**Commit:** `353a5c2`

Added Phase 18 migration to create `username VARCHAR(50) UNIQUE` column on `users` table. Backward compatible — NULL by default for existing users.

**Expected:** Server starts without error. Column added successfully.
**Result:** Migration inserted correctly between Phase 17 and console.log.

---

### Task 2: Create leaderboard route handler ✓
**File:** `server/routes/leaderboard.js` (NEW)
**Commit:** `c994b72`

Created `leaderboardRoute()` handler with:
- Paginated responses (20 items per page, ?page=0 query param)
- Niche filtering (?niche=Fintech, validates against 8 valid niches)
- Sorted by weighted score descending, then created_at DESC
- Entry shape: `{ id, idea_text (≤150 chars), scores, niche, user_id, author_username (nullable), created_at }`
- Response envelope: `{ entries, total, page, hasMore }`

Exports `VALID_NICHES` and `truncateIdeaText()` helper for testing.

**Coverage:**
- LEAD-01: Returns all public validations sorted by weighted score ✓
- LEAD-02: Supports ?niche= query param ✓
- LEAD-03: Entry includes idea_text (150 chars), scores, author_username, niche ✓
- LEAD-04: Entry includes id for /history/:id linking ✓
- LEAD-05: author_username is nullable; no email exposed ✓

---

### Task 3: Register leaderboard route in Express ✓
**File:** `server/index.js`
**Commit:** `059daeb`

Added:
- Import: `import { leaderboardRoute } from './routes/leaderboard.js'`
- Mount: `app.get('/api/leaderboard', optionalAuth, leaderboardRoute)`

Route accessible to both logged-in and anonymous users (optionalAuth). No authentication required.

---

### Task 4: Write backend tests ✓
**File:** `server/routes/leaderboard.test.js` (NEW)
**Commit:** `5b89d27`

Created comprehensive test suite using Node's native test runner (`node --test`):

**VALID_NICHES (3 tests):**
- ✓ Includes all 8 expected niches
- ✓ Rejects invalid niche names
- ✓ Accepts 'All' as special case (not in list, handled by route logic)

**truncateIdeaText (4 tests):**
- ✓ Returns text unchanged when under 150 chars
- ✓ Truncates text to 150 chars
- ✓ Replaces newlines with spaces
- ✓ Handles empty string

**Result:** 7/7 tests passing. Exit code 0.

---

## Verification

**Tests:** All 7 tests passing with `node --test server/routes/leaderboard.test.js`

**Server syntax:** Valid (checked with `node --check`)

**Manual verification pending:** GET http://localhost:3001/api/leaderboard?page=0

---

## Implementation Notes

- Route uses parameterized queries to prevent SQL injection
- Niche validation happens before DB query (fail-fast)
- idea_text truncated to 150 chars with newlines replaced by spaces
- Pagination: LIMIT 20, OFFSET = page * LIMIT
- Weighted score extraction: `(sr.scores->>'weighted')::float DESC`
- Created_at secondary sort ensures deterministic ordering

---

## What's Next

Phase 18-02 (Frontend — Leaderboard Page) will consume this API to display results in a paginated, filterable UI with niche pills and score bars.

---

*Completed: 2026-03-22*
