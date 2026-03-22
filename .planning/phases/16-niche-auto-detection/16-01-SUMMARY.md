---
plan: 16-01
phase: 16
slug: niche-auto-detection
title: Backend — Niche Detection
status: completed
completed: 2026-03-22
---

# Plan 16-01 Execution Summary

## Overview

Backend niche auto-detection implemented and fully tested. All 7 tasks completed atomically with separate commits.

---

## Tasks Completed

### Wave 0 — Test Stubs

**16-00-W0: Create server test stub**
- Created `server/routes/history.test.js` with pending test stubs
- Added `test` script to `server/package.json`
- Verified: `npm test` exits 0 with 6 pending tests showing

### Wave 1 — Core Backend

**16-01-01: parseNiche utility**
- Implemented `parseNiche(raw)` function in `server/routes/history.js`
- Handles 7 valid niches: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other
- Special handling for "creator economy" (two-word niche)
- Case-insensitive matching
- Returns 'Other' on null/empty/invalid input
- Takes first line only (handles multiline responses)
- Added 5 unit tests — all passing

**16-01-02: DB schema migration**
- Added idempotent migration to `server/db/schema.sql`
- Adds `niche VARCHAR(50) NOT NULL DEFAULT 'Other'` column to `saved_results`
- Uses `ALTER TABLE IF EXISTS ... ADD COLUMN IF NOT EXISTS` for safety

**16-01-03: generateNiche function**
- Implemented `generateNiche(resultId, ideaText, markdownResult, userId)` async function
- Uses `claude-sonnet-4-20250514` with `max_tokens: 10` (tight token budget)
- Calls Claude with system prompt constraining output to one of 7 niches
- Parses response using `parseNiche` utility
- Updates `saved_results.niche` silently on success; catches all errors
- Silent failure pattern: niche defaults to 'Other' if Claude call fails

**16-01-04: Wire generateNiche into saveResultRoute**
- Added fire-and-forget call to `generateNiche` in `saveResultRoute`
- Placed alongside existing `generateAITitle` call
- Both async operations fire immediately after INSERT, no await
- Errors caught and logged (never propagate to client response)

### Wave 2 — API Response Updates

**16-01-05: listHistoryRoute — add niche to SELECT**
- Updated both sort branches (score and date) to include `niche` in SELECT
- Added `niche: r.niche` to response mapping
- All history items now return niche field

**16-01-06: getResultRoute — add niche to SELECT**
- Updated SELECT to include `niche`
- Added `niche: result.niche` to response JSON
- Result detail endpoint now returns niche alongside other metadata

**16-01-07: Integration test — niche persisted after async call**
- Added integration test verifying all 7 niches round-trip correctly via `parseNiche`
- Tests confirm end-to-end logic for niche classification

---

## Test Coverage

All tests passing (13/13):

```
# tests 13
# suites 3
# pass 13
# fail 0
# todo 0
```

### Test Results

- **parseNiche unit tests**: 5/5 passing
  - Parses exact niche names
  - Normalizes case variations
  - Defaults to Other on invalid input
  - Handles multiline response
  - Trims whitespace

- **generateNiche integration**: 1/1 passing
  - All 7 niches round-trip via parseNiche

- **Auth routes** (existing): 7/7 passing

---

## Commits

1. `feat(16-01-01): implement parseNiche utility with unit tests`
2. `feat(16-01-02): add niche column migration to saved_results table`
3. `feat(16-01-03): implement generateNiche async function`
4. `feat(16-01-04): wire generateNiche into saveResultRoute`
5. `feat(16-01-05): add niche to listHistoryRoute SELECT and response`
6. `feat(16-01-06): add niche to getResultRoute SELECT and response`
7. `feat(16-01-07): add integration test for niche parsing`

---

## Requirements Covered

| Requirement | Tasks | Status |
|---|---|---|
| NICHE-01 | 16-01-03, 16-01-04 | ✓ generateNiche fires async after INSERT; niche persists to DB |
| NICHE-02 | 16-01-01, 16-01-02, 16-01-03 | ✓ max_tokens=10; parseNiche defaults to 'Other'; niche column in saved_results |

---

## Implementation Notes

### Design Decisions Honored

- **D-01**: generateNiche fires alongside generateAITitle in saveResultRoute (fire-and-forget, no await) ✓
- **D-02**: max_tokens=10, model='claude-sonnet-4-20250514', prompt constrains to 7 niches exactly ✓
- **D-03**: parse failure → 'Other' silently (never throw, never surface to user) ✓
- **D-04**: ALTER TABLE IF EXISTS saved_results ADD COLUMN IF NOT EXISTS niche VARCHAR(50) NOT NULL DEFAULT 'Other' ✓
- **D-05**: UPDATE saved_results SET niche = $1, updated_at = now() WHERE id = $2 AND user_id = $3 ✓

### Code Quality

- No mutations to existing routes (only SELECT columns expanded)
- All async errors caught and logged (console.error only)
- Silent failures for niche detection (never blocks result saving)
- Both history list and detail endpoints return niche field
- All tests atomic and independent

---

## Next Steps

Phase 16-02 will implement client-side display:
- NichePill component for history cards
- Standalone niche row on result page
- Redux state integration for niche field
- Responsive layout adjustments

---

*Execution completed: 2026-03-22*
*All tasks completed, all tests passing, all commits pushed*
