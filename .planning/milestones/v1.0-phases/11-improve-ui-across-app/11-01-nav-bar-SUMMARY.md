---
plan: 11-01-nav-bar
status: complete
completed: 2026-03-22
---

# Summary: Plan 11-01 — Navigation Bar with Search & Auth Actions

## What was built
Unified NavBar component replacing all scattered SignInButton headers. NavBar appears at the top of every page via AppShell and includes the "SaaS Validator" logo linking to `/`, a search bar visible only on HistoryPage (with live filtering via Redux), and auth actions on the right (Sign In when logged out; History link + Sign Out when logged in).

## Key files
### Created
- `client/src/components/layout/NavBar.jsx` — sticky header with logo, search, and auth actions
- `client/src/components/layout/SearchBar.jsx` — lucide Search icon input with wobbly border-radius, dispatches `setSearchTerm`

### Modified
- `client/src/components/layout/AppShell.jsx` — added `<NavBar />` as first child
- `client/src/store/slices/historySlice.js` — added `searchTerm` state, `setSearchTerm` reducer, `selectFilteredHistory` memoized selector
- `client/src/pages/HomePage.jsx` — removed inline `<header>` + `<SignInButton>`
- `client/src/pages/HistoryPage.jsx` — removed inline `<header>` + `<SignInButton>` from both auth states; uses `selectFilteredHistory` for displayed items

## Decisions
- NavBar uses `useAuth()` directly (not an `onSignInClick` prop) — consistent with existing SignInButton pattern and avoids prop-threading through AppShell
- No username display per D-04 requirement
- `selectFilteredHistory` uses `createSelector` from `@reduxjs/toolkit` for memoized filtering

## Self-Check: PASSED
- NavBar renders on all pages ✓
- Search bar visible only on HistoryPage ✓
- Auth actions conditional on login state ✓
- Old SignInButton removed from both pages ✓
- Filtering is case-insensitive, matches title + idea_text ✓
