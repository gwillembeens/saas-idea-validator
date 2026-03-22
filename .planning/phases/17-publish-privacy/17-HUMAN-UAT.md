---
phase: 17
status: pending
created: "2026-03-22"
---

# Phase 17 — Human UAT Checklist

All 14 automated checks passed. The following items require manual browser testing.

---

## UAT-01: Toggle visible to owner on result page

**Setup:** Log in as the result owner, navigate to a saved result page.

**Steps:**
1. Confirm "Make Private" button is visible in ActionButtons (result is public by default)
2. Click "Make Private" — button should immediately update to "Make Public" (disabled during request)
3. Reload page — verify result shows as private ("Make Public" button)
4. Click "Make Public" — verify it flips back

**Pass criteria:**
- Toggle button visible when owner
- Label switches immediately (before network response)
- Button disabled while request in-flight
- State persists after page reload

---

## UAT-02: Badge flips on history page

**Setup:** Log in, navigate to History page.

**Steps:**
1. Confirm each card shows "Public" badge by default
2. Click toggle button on one card — badge should immediately flip to "Private"
3. Button label should change from "Make Private" to "Make Public"
4. Refresh page — verify the card still shows "Private"

**Pass criteria:**
- Badge flips immediately (optimistic)
- Button label updates in sync with badge
- Redux state persists across card interactions
- State reflects server truth after reload

---

## UAT-03: Non-owner sees no toggle button

**Setup:** Log in as a different user (or log out), navigate to a shared result URL.

**Steps:**
1. Visit `/results/:id` for a result owned by another user
2. Confirm no "Make Private" / "Make Public" button is visible in ActionButtons

**Pass criteria:**
- Toggle button is absent for non-owners
- All other result page content renders normally

---

## UAT-04 (optional): Error revert behavior

**Setup:** Use browser devtools to simulate a network failure mid-toggle.

**Steps:**
1. Open Network tab, set to "Offline" or block `PATCH /api/history/*/visibility`
2. Click toggle on a history card
3. Badge should flip optimistically, then revert after the failed request

**Pass criteria:**
- Badge reverts to original state on network error
- No stuck loading state

---

Reply **"approved"** when all items pass, or describe any issues found.
