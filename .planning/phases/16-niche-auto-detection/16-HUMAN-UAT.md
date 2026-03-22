---
phase: 16
type: human-uat
status: pending
created: 2026-03-22
---

# Phase 16: Niche Auto-Detection — Human UAT

> All automated checks passed (13/13 server + 12/12 client). These 3 items require manual browser testing.

---

## UAT Checklist

### UAT-1: Niche absent during live streaming view
**Requirement:** NICHE-01 (D-06 — niche absent from fresh validation view)

**Steps:**
1. Start the dev server (`npm run dev` in client + `node server/index.js`)
2. Log in, paste a new idea, click Validate
3. While the result is streaming — confirm no niche pill appears on the ResultPage

**Expected:** No niche pill visible during streaming. The result page shows only the live markdown output.

**Status:** ⬜ pending

---

### UAT-2: Niche appears on revisit via /history/:id
**Requirement:** NICHE-01 (D-07 — niche surfaces on GET /api/history/:id)

**Steps:**
1. Complete a validation (let it finish streaming)
2. Save the result
3. Wait ~5 seconds (background generateNiche call completes)
4. Navigate to History page, click on the saved entry
5. Confirm niche pill appears between IdeaSummaryCard and Scorecard

**Expected:** Niche pill visible on revisit with one of: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other.

**Status:** ⬜ pending

---

### UAT-3: Niche pill hidden on mobile (HistoryCard)
**Requirement:** NICHE-03 (D-17 — `hidden md:inline-flex`)

**Steps:**
1. Navigate to the History page (`/history`)
2. Open browser DevTools → Device emulation → set width to 375px (iPhone)
3. Confirm niche pill is NOT visible in the history card footer row
4. Resize to 768px+ — confirm niche pill becomes visible

**Expected:** Pill hidden at <768px, visible at md+ breakpoint.

**Status:** ⬜ pending

---

## Sign-Off

- [ ] UAT-1 passed
- [ ] UAT-2 passed
- [ ] UAT-3 passed

**Approved by:** ___________  **Date:** ___________
