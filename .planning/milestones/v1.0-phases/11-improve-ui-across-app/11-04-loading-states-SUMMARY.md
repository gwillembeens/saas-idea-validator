---
plan: 11-04-loading-states
status: complete
completed: 2026-03-22
---

# Summary: Plan 11-04 — Loading States (ProgressBar & Skeleton Rows)

## What was built
Added polished loading states: a green animated progress bar during validation and skeleton placeholder rows during history loading.

## Key files
### Created
- `client/src/components/validator/ProgressBar.jsx` — hand-drawn progress bar with wobbly border-radius, `shadow-hard`, `border-2 border-pencil` track, green (#10b981) fill with CSS transition

### Modified
- `client/src/store/slices/validatorSlice.js` — added `progress: 0` to initialState, `setProgress` reducer, reset in `startValidation`/`reset`, set to 100 in `finishValidation`
- `client/src/hooks/useValidate.js` — dispatches `setProgress(15)` on start, `setProgress(40)` when streaming begins, then increments by 2 every 500ms (capped at 90) via setInterval; clears interval on done/error; exports `progress`
- `client/src/pages/HomePage.jsx` — imports `ProgressBar`, renders between IdeaInput and arrow section when status is 'loading' or 'streaming'
- `client/src/pages/HistoryPage.jsx` — added `SkeletonHistoryRow` component (inline above main component) rendering 5 staggered skeleton rows with animate-pulse; replaced "Loading..." text with skeleton rows

## Decisions
- Progress is simulated (not actual API progress) — 15→40 on connect, then +2/500ms up to 90, then jumps to 100 on finish. Gives visual feedback without needing server-sent progress events.
- Used local `currentProgress` variable in interval (not Redux state read) to avoid stale closure issues
- Skeleton row `animationDelay` applied inline on each animated element for stagger effect

## Self-Check: PASSED
- ProgressBar component exists and exports correctly ✓
- Wobbly border-radius on both track and fill ✓
- Shadow-hard and border-2 border-pencil on track ✓
- Green fill (#10b981) with CSS transition ✓
- Progress bar visible during 'loading' and 'streaming' ✓
- 5 skeleton rows during history 'loading' ✓
- Skeleton rows match HistoryCard structure ✓
- animate-pulse + bg-muted on skeleton fills ✓
