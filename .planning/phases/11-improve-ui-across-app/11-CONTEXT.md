# Phase 11: Improve UI Across App - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish and consistency pass across the full app. No page redesigns — this phase fixes navigation, unifies conflicting patterns, improves loading/empty states, and tidies the HistoryPage layout. Feature scope is limited to a search bar (client-side filtering) added to the nav.

</domain>

<decisions>
## Implementation Decisions

### Navigation bar
- **D-01:** Add a proper nav bar — "SaaS Validator" text on the left links to `/`
- **D-02:** Search bar in the middle — live client-side filtering by title + idea text (HistoryPage only; hidden or inactive on other pages)
- **D-03:** Right side: when logged in → History button + Sign Out button (same style, side by side); when logged out → Sign In button
- **D-04:** Drop username display entirely
- **D-05:** History and Sign Out use the same button style (matching the existing Button component secondary variant or consistent custom style)
- **D-06:** Nav replaces each page's independently positioned `absolute top-right` SignInButton — AppShell or a shared Layout component renders the nav

### HistoryPage layout
- **D-07:** Title "Your Validation History" on its own line; sort filter/toggle on a separate line below it
- **D-08:** Items rendered as full-width rows (not a 2-column grid) — width matches `max-w-4xl` (same as validator page cards)
- **D-09:** Ranking number (#1, #2, #3…) displayed before each row; ranking reflects the active sort order (date sort → #1 = most recent; score sort → #1 = highest score)

### Delete confirmation
- **D-10:** Replace `window.confirm()` in HistoryCard with a custom Card modal matching the one on ResultPage (Cancel + Delete buttons, "This cannot be undone" copy)

### HistoryCard title edit input
- **D-11:** Title edit input uses wobbly border-radius (inline style: `255px 15px 225px 15px / 15px 225px 15px 255px`) — consistent with design system

### Loading states
- **D-12:** HistoryPage loading → skeleton placeholder rows matching the actual row shape (gray animated shapes, not "Loading..." text)
- **D-13:** Validation in progress (HomePage) → green progress bar that fills up, rendered in the hand-drawn style (hard shadow, wobbly edges, pencil border) — replaces or augments the current streaming indicator
- **D-14:** Action buttons (Re-validate, Delete, Share) → show disabled + loading state while action is in progress

### Empty states
- **D-15:** HistoryPage empty state → visually prominent centered card with an icon and a styled CTA button linking to `/` — replaces plain text

### Share buttons
- **D-16:** Claude's discretion — can unify with Button component or keep distinct; maintain visual consistency with the rest of the page

### Claude's Discretion
- Exact skeleton animation style (pulse, shimmer, etc.) as long as it matches hand-drawn aesthetic
- Icon choice for empty state
- Whether nav is implemented as a component inside AppShell or as a standalone Layout wrapper
- Mobile nav behaviour (not a priority for this phase)
- Share button treatment (D-16)

</decisions>

<specifics>
## Specific Ideas

- Green progress bar during validation should feel hand-drawn — wobbly border, hard shadow, pencil border, fills left-to-right
- The ranking number on history rows (#1, #2…) should visually precede the row content — styled consistently with the rest of the page (font-heading or font-body)
- Nav should feel like part of the page, not a clinical app chrome — consistent with the sketchbook aesthetic

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Design system reference
- `CLAUDE.md` §Design System — Hand-Drawn Sketchbook — wobbly border-radius values, shadow tokens, color palette, font rules. All new components must follow these rules.
- `CLAUDE.md` §Button Component API — primary/secondary variants, hover/active behavior
- `CLAUDE.md` §Card Component API — decoration, rotate props

### Existing components to modify or replace
- `client/src/components/auth/SignInButton.jsx` — replaced by new nav bar
- `client/src/components/history/HistoryCard.jsx` — row layout, ranking number, wobbly edit input, custom delete modal
- `client/src/pages/HistoryPage.jsx` — title/filter layout, skeleton loading, empty state, row grid
- `client/src/components/layout/AppShell.jsx` — add nav bar here or create Layout wrapper
- `client/src/hooks/useValidate.js` — may need progress simulation for green loading bar

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` component: use for delete confirmation modal and empty state card
- `Button` component: use for nav buttons, empty state CTA, modal actions
- `ScoreBar` / `ScoreBar` pattern: reference for hand-drawn progress bar style
- `AuthModal.jsx`: reference for custom modal overlay pattern (use same backdrop opacity `bg-pencil/40`)
- `ResultPage.jsx` delete modal: copy this pattern to HistoryCard

### Established Patterns
- Wobbly border-radius: always inline style, never `rounded-*` Tailwind classes
- Hard shadow: `shadow-hard` (4px 4px 0px 0px #2d2d2d)
- Fonts: `font-heading` (Kalam) for titles/numbers, `font-body` (Patrick Hand) for all other text
- Colors: `text-pencil`, `bg-paper`, `text-muted`, `text-accent`, `text-blue`

### Integration Points
- Nav bar needs access to auth state (`useSelector(s => s.auth.user)`) and history search state
- Search bar filters HistoryPage items — either lift filter state to URL params or keep in HistoryPage local state and pass down
- Ranking number derived from items array index after sort is applied (index + 1)
- Green loading bar ties to `status: 'loading' | 'streaming'` in `validatorSlice`

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-improve-ui-across-app*
*Context gathered: 2026-03-22*
