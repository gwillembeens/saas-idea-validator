---
id: 11-01
wave: 1
depends_on: []
files_modified:
  - client/src/components/layout/NavBar.jsx
  - client/src/components/layout/SearchBar.jsx
  - client/src/components/layout/AppShell.jsx
  - client/src/pages/HomePage.jsx
  - client/src/pages/HistoryPage.jsx
autonomous: true
requirements: []
---

# Plan 11-01: Navigation Bar with Search & Auth Actions

## Objective
Create a unified navigation bar that replaces scattered SignInButton instances. The nav appears at the top of all pages with consistent styling. It includes the app logo/title on the left, a search bar in the middle (active only on HistoryPage), and auth-related actions on the right (Sign In, History link, Sign Out).

## must_haves
- [ ] NavBar component created at `client/src/components/layout/NavBar.jsx`
- [ ] NavBar renders "SaaS Validator" text linking to `/` on the left
- [ ] Search bar with live filtering visible only on HistoryPage; hidden/inactive on other pages
- [ ] Right side shows: "Sign In" button when logged out; "History" link + "Sign Out" button when logged in
- [ ] No username display (D-04 requirement met)
- [ ] NavBar integrated into AppShell so it appears on all pages
- [ ] History and Sign Out buttons use Button secondary variant or consistent custom style (D-05)
- [ ] All text uses `font-body` (Patrick Hand), colors `text-pencil` and `text-blue`
- [ ] Nav has hard shadow, wobbly styling consistent with design system

## Tasks

<task id="11-01-01">
<title>Create NavBar component</title>
<read_first>
- client/src/components/layout/AppShell.jsx — current layout structure
- client/src/components/auth/SignInButton.jsx — existing auth UI patterns
- client/src/components/ui/Button.jsx — button styling and API
- CLAUDE.md §Design System — wobbly border-radius, hard shadows, color palette, fonts
</read_first>
<action>
Create `client/src/components/layout/NavBar.jsx` as a functional React component:

```jsx
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../ui/Button'
import { SearchBar } from './SearchBar'
import { signOut } from '../../store/slices/authSlice' // adjust import path as needed

export function NavBar({ onSignInClick }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector(s => s.auth.user)
  const isHistoryPage = location.pathname === '/history'

  return (
    <header
      className="w-full bg-white border-b-2 border-pencil shadow-hard z-50 sticky top-0"
      style={{ borderRadius: '0 0 15px 15px / 0 0 15px 15px' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* LEFT: Logo */}
        <Link
          to="/"
          className="font-heading text-xl md:text-2xl text-pencil hover:text-accent transition-colors flex-shrink-0"
        >
          SaaS Validator
        </Link>

        {/* MIDDLE: Search bar — only shown on HistoryPage */}
        <div className="flex-1 max-w-md mx-4">
          <SearchBar isVisible={isHistoryPage} />
        </div>

        {/* RIGHT: Auth actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <Link
                to="/history"
                className="font-body text-lg text-blue hover:text-accent transition-colors"
              >
                History
              </Link>
              <Button variant="secondary" onClick={() => dispatch(signOut())}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onSignInClick}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
```

Note: If there is no `signOut` action in authSlice, use whatever auth sign-out mechanism exists (check useAuth hook or auth slice for the correct action/function). Also check how AppShell currently handles the auth modal open state and pass `onSignInClick` accordingly.
</action>
<acceptance_criteria>
- File `client/src/components/layout/NavBar.jsx` exists
- NavBar exports a named `NavBar` component
- Component renders a `<header>` or `<nav>` element
- Left section contains Link to "/" with "SaaS Validator" text using `font-heading`
- Right section contains conditional auth buttons (Sign In OR History+Sign Out)
- NavBar includes `shadow-hard` class
- NavBar includes sticky/fixed positioning with z-index
- grep -n "font-heading" client/src/components/layout/NavBar.jsx returns at least 1 match
- grep -n "SaaS Validator" client/src/components/layout/NavBar.jsx returns at least 1 match
</acceptance_criteria>
</task>

<task id="11-01-02">
<title>Create SearchBar component</title>
<read_first>
- client/src/components/layout/NavBar.jsx — where SearchBar will be imported
- CLAUDE.md §TextArea Component — input styling (wobbly border, focus states)
- CLAUDE.md §Design System — fonts, colors
</read_first>
<action>
Create `client/src/components/layout/SearchBar.jsx`:

```jsx
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Search } from 'lucide-react'
import { setSearchTerm } from '../../store/slices/historySlice' // adjust import path

export function SearchBar({ isVisible }) {
  const dispatch = useDispatch()

  const handleChange = useCallback((e) => {
    dispatch(setSearchTerm(e.target.value))
  }, [dispatch])

  if (!isVisible) return null

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search size={18} className="text-pencil opacity-60" strokeWidth={2.5} />
      </div>
      <input
        type="text"
        placeholder="Search by title or idea..."
        onChange={handleChange}
        className="w-full pl-9 pr-3 py-2 font-body text-base text-pencil bg-paper border-2 border-pencil focus:border-blue focus:ring-2 focus:ring-blue/20 outline-none"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      />
    </div>
  )
}
```

Note: If the history state is in a different slice or uses a different action name, adjust the import. Check the actual slice name for history items.
</action>
<acceptance_criteria>
- File `client/src/components/layout/SearchBar.jsx` exists
- Component accepts `isVisible` prop; returns null when false
- Input has wobbly border-radius via inline style with `255px 15px 225px 15px / 15px 225px 15px 255px`
- Input has `focus:border-blue focus:ring-2 focus:ring-blue/20` classes
- Input has `font-body text-pencil` classes
- Search icon from lucide-react is present
- grep -n "borderRadius.*255px" client/src/components/layout/SearchBar.jsx returns at least 1 match
</acceptance_criteria>
</task>

<task id="11-01-03">
<title>Add setSearchTerm action to history state</title>
<read_first>
- client/src/store/slices/ — find the slice managing history items (check for historySlice.js or similar)
- client/src/hooks/useHistory.js — understand how history state is managed
</read_first>
<action>
Find the Redux slice or hook managing history state. Add a `searchTerm` field and a filter:

1. In the history slice (e.g., `client/src/store/slices/historySlice.js`):
   ```js
   // Add to initialState:
   searchTerm: '',

   // Add reducer:
   setSearchTerm: (state, action) => {
     state.searchTerm = action.payload
   },
   ```

2. In the slice selectors or in the hook, filter items based on searchTerm:
   ```js
   // If using a selector:
   export const selectFilteredHistory = createSelector(
     (s) => s.history.items,
     (s) => s.history.searchTerm,
     (items, searchTerm) => {
       if (!searchTerm) return items
       const lower = searchTerm.toLowerCase()
       return items.filter(item =>
         (item.title || '').toLowerCase().includes(lower) ||
         (item.idea_text || item.idea || '').toLowerCase().includes(lower)
       )
     }
   )
   ```

3. Export `setSearchTerm` action from the slice.

4. In `HistoryPage.jsx`, switch from `useSelector(s => s.history.items)` to `useSelector(selectFilteredHistory)` (or equivalent).
</action>
<acceptance_criteria>
- History slice has `searchTerm` field in initialState
- History slice exports `setSearchTerm` action
- HistoryPage uses filtered items (not raw items) when rendering
- Filtering is case-insensitive
- Filtering matches both title and idea text fields
- grep -n "setSearchTerm" client/src/store/slices/historySlice.js returns at least 2 matches (definition + export)
</acceptance_criteria>
</task>

<task id="11-01-04">
<title>Integrate NavBar into AppShell</title>
<read_first>
- client/src/components/layout/AppShell.jsx — current layout structure, how auth modal is controlled
- client/src/components/layout/NavBar.jsx — NavBar component to integrate
</read_first>
<action>
Modify `client/src/components/layout/AppShell.jsx`:

1. Import NavBar: `import { NavBar } from './NavBar'`

2. Identify how the auth modal open state is currently managed in AppShell (e.g., `showAuthModal` state, passed to SignInButton). Pass this to NavBar as `onSignInClick`.

3. Add NavBar as first child in AppShell's main div:
   ```jsx
   export function AppShell({ children }) {
     const [showAuthModal, setShowAuthModal] = useState(false) // if not already there

     return (
       <div
         style={{
           backgroundColor: '#fdfbf7',
           backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)',
           backgroundSize: '24px 24px',
         }}
         className="min-h-screen w-full"
       >
         <NavBar onSignInClick={() => setShowAuthModal(true)} />
         {children}
         {/* Auth modal if currently managed here */}
       </div>
     )
   }
   ```

4. Ensure the `showAuthModal` state + AuthModal are retained if they currently live in AppShell. Do not break existing auth modal functionality.
</action>
<acceptance_criteria>
- AppShell.jsx imports NavBar
- NavBar is rendered as first visible child in AppShell
- NavBar receives an `onSignInClick` prop wired to auth modal open logic
- grep -n "NavBar" client/src/components/layout/AppShell.jsx returns at least 2 matches (import + render)
</acceptance_criteria>
</task>

<task id="11-01-05">
<title>Remove old SignInButton from pages</title>
<read_first>
- client/src/pages/HomePage.jsx — look for `absolute top-4 right-4` header with SignInButton
- client/src/pages/HistoryPage.jsx — look for same pattern
</read_first>
<action>
Remove the standalone `<header>` + `<SignInButton>` pattern from both pages:

1. In `client/src/pages/HomePage.jsx`:
   - Remove: `import { SignInButton } from '../components/auth/SignInButton'` (if it becomes unused)
   - Remove: `<header className="absolute top-4 right-4 md:top-6 md:right-6 z-10"><SignInButton /></header>`

2. In `client/src/pages/HistoryPage.jsx`:
   - Remove: `import { SignInButton } from '../components/auth/SignInButton'` (if it becomes unused)
   - Remove all `<header>` elements containing SignInButton (both the "not logged in" gating section header and any main section header)

Both pages rely on NavBar (via AppShell) for auth UI.
</action>
<acceptance_criteria>
- grep -n "SignInButton" client/src/pages/HomePage.jsx returns 0 matches
- grep -n "SignInButton" client/src/pages/HistoryPage.jsx returns 0 matches
- grep -n "absolute top-4 right-4" client/src/pages/HomePage.jsx returns 0 matches
- grep -n "absolute top-4 right-4" client/src/pages/HistoryPage.jsx returns 0 matches
</acceptance_criteria>
</task>

## Verification
- [ ] NavBar appears at top of all pages (HomePage, HistoryPage, ResultPage if applicable)
- [ ] Logo "SaaS Validator" links to "/"
- [ ] Search bar visible and functional only on HistoryPage
- [ ] Sign In button visible when logged out; History link + Sign Out visible when logged in
- [ ] Old SignInButton instances removed from pages
- [ ] Search filters history items in real-time by title and idea text (case-insensitive)
- [ ] NavBar styling matches design system (font-heading for logo, font-body for other text, shadow-hard)
- [ ] No console errors after changes
