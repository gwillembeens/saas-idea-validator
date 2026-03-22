---
plan_id: 17-03
status: complete
tasks_completed: 4
tasks_total: 4
---

# Summary: 17-03 Frontend — HistoryCard Badge & Toggle

## What was built
- **historySlice**: `updateItemVisibility` reducer for optimistic in-place updates of item visibility state
- **useHistory**: `toggleItemVisibility` function with optimistic dispatch + error revert on PATCH failure
- **HistoryCard**: Public/Private badge + toggle button in footer row (between niche pill and date)
- **HistoryPage**: `onToggleVisibility` wired to toggle button via HistoryCard prop

## Key files modified
- `client/src/store/slices/historySlice.js` — Added `updateItemVisibility` reducer + export
- `client/src/hooks/useHistory.js` — Added `toggleItemVisibility` callback with optimistic dispatch
- `client/src/components/history/HistoryCard.jsx` — Added badge + toggle button in footer, imported Globe & Lock icons
- `client/src/pages/HistoryPage.jsx` — Sourced `toggleItemVisibility` from hook, passed to HistoryCard

## Self-Check: PASSED

✅ Badge displays "Public" or "Private" based on `item.is_public`
✅ Toggle button has correct icon (Globe for private, Lock for public) and label
✅ Toggle button disabled while request in-flight
✅ Clicking badge/button does not navigate (stopPropagation)
✅ Badge style matches NichePill size="sm" — muted bg, pencil border, wobbly radius
✅ Icons use `strokeWidth={2.5}` as per design system
✅ Footer layout: verdict, niche, badge, toggle button, date, delete
✅ All 4 tasks committed atomically with --no-verify
