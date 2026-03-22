# Phase 14: Improve Code on ResultPage — Research Report

**Gathered:** 2026-03-22
**Status:** Complete
**File:** `.planning/phases/14-improve-code-on-resultpage/14-RESEARCH.md`

---

## Executive Summary

ResultPage.jsx is the single largest and most complex page in the application (333 lines). It handles multiple concerns: page data fetching, state management, title editing, deletion, sharing, and rendering. While functionally complete, the code exhibits numerous opportunities for improvement:

- **Size:** 333 lines — too large, violates "200–400 lines typical, 800 max" guidelines (near ceiling)
- **Complexity:** 8 local useState hooks + 3 Redux selectors + 4 async handlers + hardcoded magic values
- **Design system violations:** 3 inline border-radius styles, 1 hardcoded hex color for verdict badges
- **Component extraction:** At least 5 logical sub-components should be extracted
- **Duplication:** Verdict badge logic duplicated (getVerdict function in ResultPage vs. VerdictCard)
- **Architecture:** Modal and button logic intermingled with page-level rendering

This research identifies the specific issues, provides prioritized recommendations, and outlines a safe refactoring strategy.

---

## Section 1: Current State Analysis

### 1.1 File Metrics

| Metric | Value | Assessment |
|--------|-------|-----------|
| **Lines of code** | 333 | At upper limit; typical is 200–400, max 800 |
| **Functions** | 4 (helpers + 1 main component) | Acceptable |
| **useState hooks** | 8 | High; indicates mixed concerns |
| **useSelector calls** | 2 | Acceptable |
| **useEffect blocks** | 1 | Acceptable |
| **Async functions** | 4 | handleTitleSave, handleRevalidate, handleDelete, fetchResult |
| **Local variables** | 15+ | Mix of Redux state, local state, derived values |
| **Inline styles** | 3 | Violations of design system (border-radius) |

### 1.2 Code Structure Breakdown

```
ResultPage.jsx (333 lines)
├── Imports (lines 1–18) — 7 imports, good organization
├── Constants (lines 20–32)
│   ├── PHASE_LABELS (4 phases array) ✓ Could be utility
│   └── getVerdict(weighted) function — **DUPLICATE LOGIC**
├── Main component (lines 34–333)
│   ├── Params, Redux setup (lines 35–48)
│   ├── Data fetching effect (lines 49–63) ✓ Good
│   ├── Title editing handlers (lines 65–91) — **3 handlers, 27 lines**
│   ├── Revalidate handler (lines 93–98)
│   ├── Delete handler (lines 100–112)
│   ├── Render logic (lines 114–333)
│   │   ├── Loading state (lines 115–122)
│   │   ├── Error state (lines 124–134)
│   │   ├── Success state (lines 144–331)
│   │   │   ├── Page header + title (lines 149–185) — **37 lines, complex title editing UI**
│   │   │   ├── Verdict badge (lines 188–204) — **Duplicates VerdictCard logic**
│   │   │   ├── Content cards (lines 207–245) — ✓ Component composition good
│   │   │   ├── Action buttons (lines 248–290) — **43 lines, 5 buttons**
│   │   │   ├── Delete confirmation modal (lines 294–311)
│   │   │   └── CTA for non-owners (lines 314–323)
│   │   └── AuthModal at end (line 330)
```

### 1.3 State Management Issues

**Local state (8 useState hooks):**
```javascript
const [result, setResult]           // Page data from API
const [loading, setLoading]         // Fetch progress
const [error, setError]             // Fetch error
const [showDeleteConfirm, setShowDeleteConfirm]     // Modal visibility
const [isDeleting, setIsDeleting]   // Delete button state
const [isEditingTitle, setIsEditingTitle]           // Title edit mode
const [editingTitle, setEditingTitle]               // Title input value
const [isSavingTitle, setIsSavingTitle]             // Title save progress
```

**Issues:**
- 8 hooks is high; suggests some should be extracted to sub-components
- `result`, `loading`, `error` could be combined into a single `useAsync` pattern
- Delete/save progress states could be internal to button components
- Title edit state could live in a dedicated `TitleEditor` component

---

## Section 2: Design System Compliance

### 2.1 Violations Found

| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 158 | Inline border-radius (title input) | `borderRadius: '255px 15px ...'` | Remove; use Card or Button wrapper |
| 168 | Inline border-radius (save button) | `borderRadius: '255px 15px ...'` | Use Button component (already has it) |
| 195 | Inline border-radius (verdict badge) | `borderRadius: '255px 15px ...'` | Extract to VerdictBadgeCard component |
| 28–31 | Hardcoded verdict colors | `bg: '#d1fae5'`, etc. | Move to `tailwind.config.js` tokens or constants.js |
| 261, 267, 274 | Inline border-radius (share buttons) | `borderRadius: '255px 15px ...'` | Use Button component variant |

**Total violations:** 3 inline styles + hardcoded hex colors

### 2.2 Duplication: getVerdict Logic

**Location 1 — ResultPage.jsx lines 27–32:**
```javascript
function getVerdict(weighted) {
  if (weighted >= 4.5) return { emoji: '🟢', label: 'Strong Signal', bg: '#d1fae5', border: '#6ee7b7' }
  // ...
}
```

**Location 2 — VerdictCard.jsx (implied via rendering):**
The VerdictCard component renders verdict badge styling, but doesn't duplicate the getVerdict logic (it's only in ResultPage).

**Issue:** The verdict logic lives in ResultPage but should be centralized. A `VerdictBadge` component already exists (from phase 5), but ResultPage implements its own getVerdict() instead of using the component.

---

## Section 3: Component Extraction Opportunities

### 3.1 Identified Sub-Components

| Component | Lines | Current Location | Recommended Extraction |
|-----------|-------|------------------|----------------------|
| **1. TitleHeader** | 37 (lines 149–185) | Inline in page | `components/validator/TitleHeader.jsx` |
| **2. VerdictBadgeDisplay** | 16 (lines 188–204) | Inline in page | Use existing VerdictBadge component |
| **3. ActionButtons** | 43 (lines 248–290) | Inline in page | `components/validator/ActionButtons.jsx` |
| **4. DeleteConfirmModal** | 18 (lines 294–311) | Inline in page | `components/validator/DeleteConfirmModal.jsx` |
| **5. NonOwnerCTA** | 10 (lines 314–323) | Inline in page | `components/validator/NonOwnerCTA.jsx` |

**Post-extraction size:** ResultPage would shrink to ~150 lines (title, verdict, cards, footer + imports).

### 3.2 TitleHeader Component

**Current inline code (37 lines):**
```javascript
<div className="w-full max-w-4xl text-center mb-12">
  {isEditingTitle ? (
    // 11 lines: input + save button
  ) : (
    // 6 lines: h1 + date
  )}
</div>
```

**Proposed:**
```javascript
<TitleHeader
  result={result}
  isEditingTitle={isEditingTitle}
  editingTitle={editingTitle}
  isSavingTitle={isSavingTitle}
  onEditStart={() => setEditingTitle(result.title); setIsEditingTitle(true)}
  onEditCancel={() => setIsEditingTitle(false)}
  onEditSave={handleTitleSave}
/>
```

**Benefits:**
- Encapsulates title edit logic
- Reduces main component complexity
- Reusable for other pages (e.g., history bulk edit)

### 3.3 ActionButtons Component

**Current inline code (43 lines):**
- Re-validate button + 3 share buttons + delete button (owner-only)
- Repeated inline border-radius styling on every button

**Proposed:**
```javascript
<ActionButtons
  result={result}
  isDeleting={isDeleting}
  onRevalidate={handleRevalidate}
  onDelete={() => setShowDeleteConfirm(true)}
/>
```

**Benefits:**
- Centralizes all button styling (no repeated inline border-radius)
- Encapsulates share URL generation (already in utils)
- Reusable across result display pages

### 3.4 DeleteConfirmModal Component

**Current inline code (18 lines):**
```javascript
{showDeleteConfirm && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
    <Card decoration="tack">
      {/* 7 lines */}
    </Card>
  </div>
)}
```

**Proposed:**
```javascript
<DeleteConfirmModal
  isOpen={showDeleteConfirm}
  isDeleting={isDeleting}
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

**Benefits:**
- Separates modal concern from page logic
- Reusable for other delete confirmations
- Easier to test

---

## Section 4: Identified Code Quality Issues

### 4.1 Magic Values & Hardcoded Constants

| Line | Value | Issue | Solution |
|------|-------|-------|----------|
| 28–31 | Hex colors for verdict | Hardcoded in function | Move to `src/constants/verdictColors.js` |
| 141 | Default weighted score | `0` when falsy | Explicit constant `DEFAULT_SCORE = 0` |
| 146 | Page wrapper width | `max-w-4xl` | Consistent with other pages (`max-w-2xl` vs `max-w-4xl`) |
| 216 | Scorecard max-width | `max-w-2xl` | Verify consistency across all card pages |
| 183 | Date format string | Inline `toLocaleDateString` | Extract to utility `formatResultDate()` |

### 4.2 Inconsistency: Page Width

**ResultPage uses `max-w-4xl`** for the main wrapper (line 146):
```javascript
<div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">
  <div className="w-full max-w-4xl text-center mb-12">
```

**But Scorecard cards use `max-w-2xl`:**
```javascript
<Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
```

**Other pages (HomePage, HistoryPage) use `max-w-2xl`** consistently.

**Issue:** Asymmetry creates visual layout shift between title and cards.

**Solution:** Use `max-w-2xl` consistently throughout ResultPage.

### 4.3 Error Handling

**Current approach:**
```javascript
try {
  const res = await fetch(`/api/history/${id}`)
  if (!res.ok) throw new Error('Result not found')
  const data = await res.json()
  setResult(data)
} catch (err) {
  setError(err.message)
} finally {
  setLoading(false)
}
```

**Issues:**
- No user-facing error message for specific error types
- Network errors surface raw error.message
- No retry logic
- No timeout handling

**Solution:**
Extract to a custom hook `useHistoryResult(id)` that:
- Returns `{ data, loading, error, refetch }`
- Provides friendly error messages
- Handles 404 vs network errors separately
- Implements retry logic

---

## Section 5: Architecture Compliance

### 5.1 Redux Pattern Adherence

**Current usage (lines 36–38):**
```javascript
const user = useSelector(s => s.auth.user)
```

**Good:**
- Reads only what's needed (user auth state)
- No mutations of Redux state
- Selector is minimal

**Issue:** Redux is under-utilized. Result data is fetched locally (not persisted in Redux history state). This means:
- Refreshing ResultPage requires re-fetching from API
- No offline access to previously viewed results
- Browser back/forward on `/history/:id` triggers full re-fetch

**Note:** This is likely intentional to keep server-side history as the source of truth. Not flagged as violation.

### 5.2 useEffect Pattern

**Current (lines 49–63):**
```javascript
useEffect(() => {
  async function fetchResult() {
    // ...
  }
  fetchResult()
}, [id])
```

**Good:**
- Proper dependency array `[id]`
- Async function declared inside effect (correct pattern)
- No data fetching on every render

**Opportunity:**
- Could be extracted to `useHistoryResult(id)` hook to reduce boilerplate

---

## Section 6: Performance Considerations

### 6.1 Unnecessary Re-Renders

**Risk areas:**

| Component | Risk | Mitigation |
|-----------|------|-----------|
| Verdict badge render (lines 188–204) | Recalculates getVerdict() on every render | Memoize verdict calculation |
| Share buttons (lines 258–278) | Re-creates generateShareUrls() on every render | Memoize with useMemo |
| Date formatting (line 183) | Formats date string on every render | Could be pre-formatted on server |

**Severity:** Low — these are small operations, but good practice.

### 6.2 Missing Memoization

```javascript
const shareUrls = generateShareUrls(result?.title, window.location.href)
```

This is recalculated on every render. Should be:
```javascript
const shareUrls = useMemo(
  () => generateShareUrls(result?.title, window.location.href),
  [result?.title]
)
```

---

## Section 7: What Phase 13 Added

Phase 13 (Framework Page) completed successfully:
- Created `/framework` route with auth guard
- Built `FrameworkPage` component (clean, simple, ~100 lines)
- Created `frameworkSteps.js` utility with 30 steps
- Linked from navbar and home page

**Relevance to Phase 14:** Phase 13 was separate from ResultPage. It does NOT affect ResultPage code, but it demonstrates how to:
- Create a page with auth guard
- Use the Card component in a simple, clean way
- Extract data to a utility file

Phase 14's scope is to apply similar improvements to ResultPage (which predates Phase 13).

---

## Section 8: Improvement Opportunities — Prioritized

### Priority 1: Critical (Design System & Architecture)

**P1a: Extract verdict badge logic** (BLOCKS other work)
- **Issue:** Duplicated color logic (getVerdict function in ResultPage)
- **Action:** Move verdict colors to `src/constants/verdictColors.js`, reuse existing VerdictBadge component
- **Impact:** Eliminates hardcoded hex colors, centralizes verdict styling
- **Effort:** 1 hour (refactor getVerdict → lookup table, use VerdictBadge)

**P1b: Consolidate page width** (BLOCKS layout consistency)
- **Issue:** ResultPage uses `max-w-4xl`, but cards use `max-w-2xl`, other pages use `max-w-2xl`
- **Action:** Change page wrapper to `max-w-2xl` to match card widths
- **Impact:** Uniform layout, no visual shift
- **Effort:** 15 minutes

**P1c: Extract TitleHeader component**
- **Issue:** Title editing logic (37 lines) is tangled with page rendering
- **Action:** Extract to `components/validator/TitleHeader.jsx`
- **Impact:** Reduces ResultPage from 333 → 296 lines, simplifies main component
- **Effort:** 45 minutes (component + tests)

### Priority 2: High (Code Quality & Maintainability)

**P2a: Extract ActionButtons component**
- **Issue:** 43 lines of button logic + repeated inline border-radius styling
- **Action:** Extract to `components/validator/ActionButtons.jsx`
- **Impact:** Centralizes button styling, improves reusability
- **Effort:** 1 hour

**P2b: Extract DeleteConfirmModal component**
- **Issue:** Modal logic (18 lines) intermingled with page logic
- **Action:** Extract to `components/validator/DeleteConfirmModal.jsx`
- **Impact:** Cleaner page, reusable modal
- **Effort:** 45 minutes

**P2c: Create useHistoryResult() hook**
- **Issue:** Data fetching logic (15 lines) clutters component
- **Action:** Extract to `hooks/useHistoryResult.js`
- **Impact:** Reduces ResultPage to ~310 lines, improves testability
- **Effort:** 1 hour

**P2d: Create verdictColors constant**
- **Issue:** Hardcoded hex colors in getVerdict() (lines 28–31)
- **Action:** Move to `src/constants/verdictColors.js`
- **Impact:** Centralizes colors, easier to maintain
- **Effort:** 15 minutes

### Priority 3: Medium (Polish & Optimization)

**P3a: Memoize calculateShareUrls**
- **Issue:** Share URLs recalculated on every render
- **Action:** Wrap with `useMemo`
- **Impact:** Minor performance improvement
- **Effort:** 10 minutes

**P3b: Extract date formatter utility**
- **Issue:** Date formatting is inline (line 183)
- **Action:** Create `utils/formatResultDate.js`
- **Impact:** Reusable, consistent formatting
- **Effort:** 15 minutes

**P3c: Improve error messages**
- **Issue:** Network errors surface raw error.message
- **Action:** Add user-friendly error messages for 404 vs network errors
- **Impact:** Better UX on failure
- **Effort:** 30 minutes

---

## Section 9: Recommended Refactoring Strategy

### Phase 14 Implementation Plan (Phased Approach)

**Wave 1: Foundations (P1 items)** — 2–3 hours
1. Extract `verdictColors` constant file
2. Change page width from `max-w-4xl` → `max-w-2xl`
3. Move getVerdict() to use verdictColors lookup

**Wave 2: Component Extraction (P2a, P2b, P2c)** — 3–4 hours
1. Create `useHistoryResult()` hook
2. Extract `TitleHeader` component
3. Extract `ActionButtons` component
4. Extract `DeleteConfirmModal` component

**Wave 3: Polish (P3 items)** — 1–2 hours
1. Memoize shareUrls calculation
2. Extract date formatter utility
3. Improve error messages

**Post-refactoring ResultPage size:** ~150–180 lines (45% reduction)

---

## Section 10: Files That Will Need Changes

### Files Modified

| File | Lines | Change | Why |
|------|-------|--------|-----|
| `client/src/pages/ResultPage.jsx` | 333 → 180 | Major refactoring | Main target |
| `client/src/components/validator/TitleHeader.jsx` | NEW | Create | Extract title edit logic |
| `client/src/components/validator/ActionButtons.jsx` | NEW | Create | Extract button logic |
| `client/src/components/validator/DeleteConfirmModal.jsx` | NEW | Create | Extract modal logic |
| `client/src/hooks/useHistoryResult.js` | NEW | Create | Extract data fetch logic |
| `client/src/constants/verdictColors.js` | NEW | Create | Centralize verdict colors |
| `client/src/utils/formatResultDate.js` | NEW | Create | Date formatting utility |

### Files NOT Modified

| File | Reason |
|------|--------|
| `client/src/App.jsx` | No changes needed; routing untouched |
| `client/src/components/validator/IdeaSummaryCard.jsx` | Already clean; no changes |
| `client/src/components/validator/CommentaryCard.jsx` | Already clean; no changes |
| `client/src/components/validator/VerdictCard.jsx` | Already clean; no changes |
| `client/src/utils/parseSections.js` | Already clean; no changes |
| `client/src/utils/parseResult.js` | Already clean; no changes |
| `client/src/store/slices/validatorSlice.js` | No changes needed |
| `CLAUDE.md` | No changes needed |

---

## Section 11: Testing & Validation Strategy

### 11.1 Regression Testing

**Before extraction:**
- [ ] Manual test: Load ResultPage, verify all UI renders
- [ ] Manual test: Edit title, verify save works
- [ ] Manual test: Delete result, verify confirmation modal works
- [ ] Manual test: Revalidate button navigates to home
- [ ] Manual test: Share buttons open correct URLs
- [ ] Manual test: Non-owner CTA displays correctly

**After extraction:**
- [ ] Run same manual tests (should pass without changes)
- [ ] Verify no console errors
- [ ] Verify page load time unchanged

### 11.2 Component-Level Testing

**For new components:**
- `TitleHeader`: Test edit mode enter/exit, save, cancel, keyboard shortcuts (Enter/Escape)
- `ActionButtons`: Test all buttons are present, onClick handlers fire
- `DeleteConfirmModal`: Test modal visibility toggle, confirm/cancel actions
- `useHistoryResult`: Test fetch success/error, refetch logic

### 11.3 Architecture Validation

**Checklist:**
- [ ] No new Redux state added (all state managed locally in ResultPage)
- [ ] All components remain "dumb" (receive data via props, no direct Redux access except page)
- [ ] New utility files follow existing pattern (pure functions, no side effects)
- [ ] New hooks follow existing pattern (use Redux selectors, return simplified interface)

---

## Section 12: Risks & Dependencies

### 12.1 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Title editing breaks | Low | High (user feature) | Comprehensive manual testing of edit mode |
| Delete modal doesn't render | Medium | High | Test modal visibility logic extensively |
| Page layout shifts after width change | Low | Medium | Visual regression testing, check on mobile |
| Date formatting breaks | Low | Low | Test with various locales |
| Performance regression | Low | Low | Check bundle size, render count |

### 12.2 Dependencies

- **No upstream dependencies** — Phase 13 did not modify any files that Phase 14 touches
- **No downstream dependencies** — Phase 14 does not add new routes or APIs

---

## Section 13: Success Criteria

### Definition of Done (Phase 14)

- [ ] ResultPage.jsx reduced from 333 → <200 lines (via component extraction)
- [ ] All 3 inline border-radius styles removed from ResultPage
- [ ] getVerdict() logic moved to `src/constants/verdictColors.js`
- [ ] Page width changed to `max-w-2xl` (consistent with other pages)
- [ ] 5 new sub-components created:
  - `TitleHeader.jsx`
  - `ActionButtons.jsx`
  - `DeleteConfirmModal.jsx`
  - `useHistoryResult.js` (hook)
  - `verdictColors.js` (constants)
- [ ] All manual regression tests pass
- [ ] No console errors or warnings
- [ ] 0 hardcoded hex colors in ResultPage
- [ ] Commit message: `refactor(12): improve code on ResultPage — extract components, reduce complexity`

---

## Section 14: Architecture Notes for Planners

### Why These Extractions?

1. **TitleHeader** — Title editing is a distinct UX concern; its 37 lines don't belong in the main page rendering logic.
2. **ActionButtons** — Buttons are a cohesive unit; extracting prevents repeated inline styles and improves reusability.
3. **DeleteConfirmModal** — Modals have distinct lifecycle (show/hide); extracting makes page logic easier to follow.
4. **useHistoryResult** — Data fetching is orthogonal to rendering; custom hooks encapsulate this pattern (already used elsewhere in codebase).
5. **verdictColors** — Color mappings should be centralized constants, not buried in a function; this matches design system principles.

### Pattern Alignment

These extractions follow established patterns in the codebase:
- **Components:** Mimic IdeaSummaryCard, CommentaryCard, VerdictCard (pure, stateless, render content)
- **Hooks:** Mimic useAuth, useValidate (encapsulate complex logic, return simplified interface)
- **Constants:** Mimic FRAMEWORK_PHASES, PHASE_LABELS (data as utilities, not inline)

---

## RESEARCH COMPLETE

This research report identifies:
- **Current state:** 333-line ResultPage with 8 hooks, 3 design violations, 5 extractable components
- **Key issues:** High complexity, hardcoded colors, repeated inline styles, tangled concerns
- **Solution:** 5 component/hook extractions + 1 constants file, reducing page to ~150 lines
- **Effort:** ~6–8 hours total (split into 3 waves, manageable chunks)
- **Risk:** Low (regression tests provide safety, no API changes, no new patterns)

Planner should use this research to:
1. Break Phase 14 into 3 waves (foundations → extraction → polish)
2. Create detailed task breakdown for each wave
3. Establish testing checklist (regression + new component tests)
4. Review extracted components for design system compliance before implementation

---

*Research completed: 2026-03-22*
*Next: /gsd:plan-phase 14*
