---
plan: 11-03-history-card
status: complete
completed: 2026-03-22
---

# Summary: Plan 11-03 — HistoryCard Polish

## What was built
Polished HistoryCard with wobbly border-radius on the title edit input, replaced `window.confirm()` with a custom in-component delete confirmation modal, and added proper loading/disabled states throughout.

## Key files
### Modified
- `client/src/components/history/HistoryCard.jsx`
  - Title edit input: inline style `borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px'` + `focus:border-blue focus:ring-2 focus:ring-blue/20`
  - Added `showDeleteModal` and `isDeleting` state
  - `handleDeleteClick` sets `showDeleteModal(true)` instead of `window.confirm()`
  - `handleConfirmDelete` async function with `isDeleting` guard + try/finally cleanup
  - Delete modal: `fixed inset-0 bg-pencil/40` backdrop, `Card decoration="none"`, Cancel + Delete `<Button>` components
  - Delete button shows "Deleting…" while `isDeleting` is true
  - Component wrapped in `<>` fragment to accommodate the modal
  - Added `Button` import from `'../ui/Button'`

## Decisions
- Modal lives inside the card component (not a portal) — acceptable for this use case, z-50 ensures it overlays correctly
- Used `try/finally` in `handleConfirmDelete` to always close the modal even on error
- "This cannot be undone." kept concise — matches the design tone

## Self-Check: PASSED
- Wobbly border-radius on edit input ✓
- No more window.confirm() ✓
- Custom modal with Cancel/Delete buttons ✓
- isDeleting state disables buttons and shows "Deleting…" ✓
- Modal closes on cancel and after delete ✓
