---
id: 11-03
wave: 2
depends_on: ["11-01"]
files_modified:
  - client/src/components/history/HistoryCard.jsx
autonomous: true
requirements: []
---

# Plan 11-03: HistoryCard — Wobbly Edit Input & Custom Delete Modal

## Objective
Apply wobbly border-radius to the title edit input (D-11) and replace the `window.confirm()` delete confirmation with a custom Card modal (D-10) matching the design system. Add loading/disabled states to action buttons (D-14).

## must_haves
- [ ] Title edit input has wobbly border-radius: `255px 15px 225px 15px / 15px 225px 15px 255px` via inline style
- [ ] Delete button opens a custom modal — no `window.confirm()`
- [ ] Modal has a Card wrapper, Cancel + Delete buttons, "This cannot be undone." copy
- [ ] Modal backdrop uses `bg-pencil/40` (matching AuthModal pattern)
- [ ] Delete button shows "Deleting…" while action in progress; is disabled during action
- [ ] HistoryCard renders correctly as a full-width row (flex-1 child from HistoryPage plan)

## Tasks

<task id="11-03-01">
<title>Apply wobbly border-radius to title edit input</title>
<read_first>
- client/src/components/history/HistoryCard.jsx — find the title edit `<input>` element; note its current className and style
- CLAUDE.md §Wobbly Border Radius — exact values; rule: always inline style, never rounded-* for primary elements
</read_first>
<action>
In `client/src/components/history/HistoryCard.jsx`, find the title edit input element (inside an `{isEditing ? ... : ...}` block). It likely looks like:

```jsx
<input
  type="text"
  value={editingTitle}
  onChange={...}
  className="..."
  style={{ borderRadius: '...' }}  // or no style at all
/>
```

Replace (or add) the inline style with the exact wobbly value, and ensure consistent classes:

```jsx
<input
  type="text"
  value={editingTitle}
  onChange={(e) => setEditingTitle(e.target.value)}
  onKeyDown={handleKeyDown}
  autoFocus
  className="flex-1 font-body text-lg text-pencil bg-paper border-2 border-pencil px-3 py-2 focus:border-blue focus:ring-2 focus:ring-blue/20 outline-none w-full"
  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
/>
```

Key changes:
- Inline style `borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px'` (exact value)
- `border-2 border-pencil` (was likely `border` or different)
- `bg-paper` background
- `focus:border-blue focus:ring-2 focus:ring-blue/20 outline-none` for focus state
- `px-3 py-2` for comfortable padding
</action>
<acceptance_criteria>
- grep -n "borderRadius.*255px 15px 225px 15px" client/src/components/history/HistoryCard.jsx returns at least 1 match
- Edit input has `focus:border-blue focus:ring-2 focus:ring-blue/20` classes
- Edit input has `bg-paper` class
- Edit input has `border-2 border-pencil` classes
- Edit input has `font-body text-lg text-pencil` classes
</acceptance_criteria>
</task>

<task id="11-03-02">
<title>Replace window.confirm() with custom delete modal</title>
<read_first>
- client/src/components/history/HistoryCard.jsx — find the delete handler and window.confirm() call
- client/src/pages/ResultPage.jsx — reference implementation of delete modal (copy this pattern)
- client/src/components/ui/Card.jsx — Card component API
- client/src/components/ui/Button.jsx — Button component API
- CLAUDE.md §Design System — backdrop: bg-pencil/40
</read_first>
<action>
In `client/src/components/history/HistoryCard.jsx`:

1. Add state at top of component:
   ```jsx
   const [showDeleteModal, setShowDeleteModal] = useState(false)
   const [isDeleting, setIsDeleting] = useState(false)
   ```

2. Replace the delete handler (currently calls `window.confirm()`):
   ```jsx
   // OLD — remove this:
   const handleDelete = () => {
     if (window.confirm('...')) {
       onDelete(item.id)
     }
   }

   // NEW:
   const handleDeleteClick = () => {
     setShowDeleteModal(true)
   }

   const handleConfirmDelete = async () => {
     setIsDeleting(true)
     try {
       await onDelete(item.id)
     } finally {
       setIsDeleting(false)
       setShowDeleteModal(false)
     }
   }
   ```

3. Update the delete button in JSX to call `handleDeleteClick` instead.

4. Add the delete confirmation modal at the end of the component's returned JSX (before the closing tag):
   ```jsx
   {showDeleteModal && (
     <div className="fixed inset-0 bg-pencil/40 flex items-center justify-center z-50">
       <Card decoration="none" rotate={0} className="max-w-sm w-11/12 mx-4">
         <div className="flex flex-col gap-6 p-2">
           <div>
             <h2 className="font-heading text-2xl text-pencil mb-2">Delete result?</h2>
             <p className="font-body text-lg text-pencil opacity-70">
               This cannot be undone.
             </p>
           </div>
           <div className="flex gap-3 justify-end">
             <Button
               variant="secondary"
               onClick={() => setShowDeleteModal(false)}
               disabled={isDeleting}
             >
               Cancel
             </Button>
             <Button
               variant="primary"
               onClick={handleConfirmDelete}
               disabled={isDeleting}
             >
               {isDeleting ? 'Deleting…' : 'Delete'}
             </Button>
           </div>
         </div>
       </Card>
     </div>
   )}
   ```

5. Import Card if not already imported: `import { Card } from '../ui/Card'`
</action>
<acceptance_criteria>
- grep -n "window.confirm" client/src/components/history/HistoryCard.jsx returns 0 matches
- `showDeleteModal` state exists in component
- `isDeleting` state exists in component
- Modal has `bg-pencil/40` backdrop class
- Modal uses Card with `decoration="none"`
- Modal contains "This cannot be undone." text
- Modal has Cancel and Delete buttons using Button component
- Delete button shows "Deleting…" when `isDeleting` is true
- Delete button has `disabled={isDeleting}` prop
- grep -n "showDeleteModal" client/src/components/history/HistoryCard.jsx returns at least 2 matches
</acceptance_criteria>
</task>

<task id="11-03-03">
<title>Add disabled/loading states to action buttons</title>
<read_first>
- client/src/components/history/HistoryCard.jsx — all action buttons (Re-validate, Share, Delete)
- client/src/components/ui/Button.jsx — disabled prop behavior
</read_first>
<action>
Ensure all action buttons in HistoryCard show proper disabled/loading states:

1. Delete button (in modal) — already handled in task 11-03-02.

2. Re-validate button (if it exists on the card):
   ```jsx
   const [isRevalidating, setIsRevalidating] = useState(false)

   const handleRevalidate = async () => {
     setIsRevalidating(true)
     // navigate to "/" and set idea text in Redux store
     // dispatch(setIdea(item.idea_text || item.idea))
     // navigate('/')
     setIsRevalidating(false)
   }

   // Button JSX:
   <Button
     variant="secondary"
     onClick={handleRevalidate}
     disabled={isRevalidating}
   >
     {isRevalidating ? 'Loading…' : 'Re-validate'}
   </Button>
   ```

3. Share button (if it exists): Disable during copy operation with `disabled` and loading text.

4. All buttons in the footer should be `Button` component (not raw `<button>` elements).

If Re-validate and Share buttons are not currently present in HistoryCard, do not add them — only ensure the delete button has the loading state.
</action>
<acceptance_criteria>
- Delete button is disabled with loading text while deletion is in progress
- Any existing action buttons use the Button component with disabled prop
- No raw `<button>` elements for primary actions (they should use the Button component)
- grep -n "disabled={isDeleting}" client/src/components/history/HistoryCard.jsx returns at least 1 match
</acceptance_criteria>
</task>

## Verification
- [ ] Title edit input has exact wobbly border-radius `255px 15px 225px 15px / 15px 225px 15px 255px` via inline style
- [ ] Title edit input has focus state: blue border + ring
- [ ] No `window.confirm()` anywhere in HistoryCard
- [ ] Delete button opens custom modal
- [ ] Modal backdrop is `bg-pencil/40`
- [ ] Modal uses Card decoration="none"
- [ ] Modal shows "This cannot be undone." text
- [ ] Cancel closes modal; Delete confirms deletion
- [ ] Delete button shows "Deleting…" while in progress; both modal buttons disabled
- [ ] Modal closes after deletion completes
- [ ] No console errors
