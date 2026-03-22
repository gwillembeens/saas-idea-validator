---
id: 11-02
wave: 2
depends_on: ["11-01"]
files_modified:
  - client/src/pages/HistoryPage.jsx
autonomous: true
requirements: []
---

# Plan 11-02: HistoryPage Layout — Full-Width Rows, Ranking & Empty State

## Objective
Restructure HistoryPage to display items as full-width rows (not a 2-column grid), add ranking numbers (#1, #2, etc.), create a visually prominent empty state card with icon and CTA, and improve layout with title/sort on separate lines.

## must_haves
- [ ] HistoryPage displays items as full-width rows, not a 2-column grid
- [ ] Each item has a ranking number (#1, #2, #3…) before the row
- [ ] Ranking reflects the active sort order (date sort → #1 = most recent; score sort → #1 = highest score)
- [ ] Empty state is a centered Card with icon and styled CTA button linking to `/`
- [ ] Title "Your Validation History" on its own line
- [ ] Sort filter/toggle on a separate line below the title
- [ ] Item rows match `max-w-4xl` width constraint
- [ ] Responsive design maintained (single column on all screen sizes)

## Tasks

<task id="11-02-01">
<title>Refactor grid to full-width rows with ranking numbers</title>
<read_first>
- client/src/pages/HistoryPage.jsx — current grid layout and how items are mapped
- client/src/components/history/HistoryCard.jsx — component being rendered in each cell
- CLAUDE.md §Responsive Rules — mobile-first, expand at md: breakpoint
</read_first>
<action>
In `client/src/pages/HistoryPage.jsx`, find the items grid section (the `grid grid-cols-1 md:grid-cols-2` or similar div) and replace it with:

```jsx
<div className="w-full max-w-4xl flex flex-col gap-4 mb-12">
  {items.map((item, index) => (
    <div key={item.id} className="flex items-start gap-4">
      {/* Ranking number */}
      <div className="flex items-center justify-center w-10 pt-4 flex-shrink-0">
        <span className="font-heading text-2xl text-pencil">
          #{index + 1}
        </span>
      </div>
      {/* HistoryCard — full width */}
      <div className="flex-1 min-w-0">
        <HistoryCard
          item={item}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      </div>
    </div>
  ))}
</div>
```

The ranking number `#{index + 1}` automatically reflects sort order since `items` is already sorted (by date or score depending on toggle).

Ensure `handleDelete` and `handleRename` are the correct prop names matching HistoryCard's expected props (check HistoryCard for onDelete, onRename, or similar).
</action>
<acceptance_criteria>
- grep -n "grid-cols-1 md:grid-cols-2" client/src/pages/HistoryPage.jsx returns 0 matches
- Items are rendered in a flex column layout (flex flex-col)
- Each item row has a ranking number `#{index + 1}` with `font-heading text-2xl text-pencil`
- HistoryCard is inside a `flex-1 min-w-0` wrapper
- Container uses `max-w-4xl`
- grep -n "index \+ 1" client/src/pages/HistoryPage.jsx returns at least 1 match
</acceptance_criteria>
</task>

<task id="11-02-02">
<title>Separate title and sort filter onto distinct lines</title>
<read_first>
- client/src/pages/HistoryPage.jsx — find the title/sort section (currently flex row with title and sort button together)
- CLAUDE.md §Typography Rules — h1 sizing: text-5xl md:text-6xl; font-heading
</read_first>
<action>
In `client/src/pages/HistoryPage.jsx`, find the section where "Your Validation History" title and the sort toggle appear together. Replace with separate blocks:

```jsx
{/* Title — its own line */}
<div className="w-full max-w-4xl mb-6">
  <h1 className="font-heading text-5xl md:text-6xl text-pencil">
    Your Validation History
  </h1>
</div>

{/* Sort toggle — separate line below title */}
<div className="w-full max-w-4xl mb-8 flex items-center justify-end">
  <button
    onClick={toggleSort}
    className="font-body text-lg text-blue hover:text-accent transition-colors underline decoration-dotted"
  >
    Sort by: {sort === 'date' ? 'Date ↓' : 'Score ↓'}
  </button>
</div>
```

Keep the same toggle logic — just separate the visual layout into two distinct elements.
</action>
<acceptance_criteria>
- Title "Your Validation History" is in its own `<div>` or `<section>` with `mb-6`
- Title uses `font-heading text-5xl md:text-6xl text-pencil`
- Sort toggle is in a separate `<div>` with `mb-8`
- Sort toggle uses `font-body text-lg text-blue`
- Title and sort are not in the same flex row anymore
- grep -n "text-5xl md:text-6xl" client/src/pages/HistoryPage.jsx returns at least 1 match
</acceptance_criteria>
</task>

<task id="11-02-03">
<title>Replace plain text empty state with visual Card</title>
<read_first>
- client/src/pages/HistoryPage.jsx — current empty state (plain text or simple div)
- client/src/components/ui/Card.jsx — Card component API (decoration, rotate props)
- client/src/components/ui/Button.jsx — Button component API (variant prop)
- CLAUDE.md §Card Component API — decoration="tape"|"tack"|"none", rotate prop
</read_first>
<action>
In `client/src/pages/HistoryPage.jsx`, find the empty state section (when items.length === 0 and status is not loading). Replace it with:

```jsx
import { History } from 'lucide-react'  // add to imports at top of file
import { Link } from 'react-router-dom'  // add if not already imported

// In JSX, replace empty state:
{items.length === 0 && status !== 'loading' && (
  <div className="w-full max-w-4xl py-16 px-4">
    <Card decoration="none" rotate={0}>
      <div className="flex flex-col items-center text-center py-8 gap-6">
        {/* Icon */}
        <History size={48} className="text-pencil opacity-50" strokeWidth={2.5} />

        {/* Heading */}
        <h2 className="font-heading text-3xl md:text-4xl text-pencil">
          No validations yet
        </h2>

        {/* Description */}
        <p className="font-body text-lg text-pencil opacity-70 max-w-sm leading-relaxed">
          Validate your first SaaS idea to start building your history.
        </p>

        {/* CTA */}
        <Link to="/">
          <Button variant="primary">
            Validate Your First Idea
          </Button>
        </Link>
      </div>
    </Card>
  </div>
)}
```

Make sure Card and Button are imported (they likely already are; check existing imports).
</action>
<acceptance_criteria>
- Empty state uses Card component
- Card has `decoration="none"` and `rotate={0}`
- Card contains a History (or equivalent) icon from lucide-react
- Card contains heading "No validations yet" with `font-heading`
- Card contains CTA button with `Button variant="primary"`
- CTA button is wrapped in `Link to="/"`
- grep -n "No validations yet" client/src/pages/HistoryPage.jsx returns at least 1 match
- grep -n "decoration=\"none\"" client/src/pages/HistoryPage.jsx returns at least 1 match
</acceptance_criteria>
</task>

## Verification
- [ ] HistoryPage displays items as full-width rows (not grid)
- [ ] Each item has ranking number (#1, #2, etc.) reflecting sort order
- [ ] Empty state is a prominent Card with icon, heading, description, and CTA button
- [ ] CTA button links to "/"
- [ ] Title "Your Validation History" on its own line with text-5xl md:text-6xl sizing
- [ ] Sort toggle on a separate line below title
- [ ] All text uses correct fonts (font-heading for titles, font-body for body)
- [ ] max-w-4xl applied consistently across all sections
- [ ] No console errors
