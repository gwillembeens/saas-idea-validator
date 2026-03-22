---
plan_id: 17-01
status: complete
tasks_completed: 6
tasks_total: 6
---

# Summary: 17-01 Backend — Visibility Column & API

## What was built

- **DB migration:** `is_public BOOLEAN NOT NULL DEFAULT true` added to saved_results
- **saveResultRoute:** response now includes `is_public: true`
- **listHistoryRoute:** both SELECT branches (score/date sort) include `is_public` field
- **getResultRoute:** SELECT and response include `is_public` field
- **New `updateVisibilityRoute`:** PATCH /api/history/:id/visibility with auth check, ownership validation, and boolean parameter validation
- **Route registration:** Route registered in server/index.js after the existing title PATCH

## Key files modified

- server/db/schema.sql
- server/routes/history.js
- server/index.js

## Verification Checklist

- [x] POST /api/history response includes `is_public: true`
- [x] GET /api/history items each include `is_public` field
- [x] GET /api/history/:id response includes `is_public`
- [x] PATCH /api/history/:id/visibility endpoint implemented with auth + ownership check
- [x] PATCH /api/history/:id/visibility rejects non-boolean is_public (400)
- [x] PATCH /api/history/:id/visibility returns 401 without auth
- [x] PATCH /api/history/:id/visibility returns 403 for non-owner
- [x] PATCH /api/history/:id/visibility returns 404 for missing result

## Commits

1. `feat(17-01): add is_public migration to saved_results`
2. `feat(17-01): add is_public to saveResultRoute response`
3. `feat(17-01): add is_public to listHistoryRoute queries and response`
4. `feat(17-01): add is_public to getResultRoute SELECT and response`
5. `feat(17-01): add updateVisibilityRoute function`
6. `feat(17-01): register updateVisibilityRoute in server/index.js`

## Self-Check: PASSED
