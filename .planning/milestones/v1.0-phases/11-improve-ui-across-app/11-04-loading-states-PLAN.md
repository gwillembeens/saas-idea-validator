---
id: 11-04
wave: 3
depends_on: ["11-01", "11-02", "11-03"]
files_modified:
  - client/src/components/validator/ProgressBar.jsx
  - client/src/pages/HomePage.jsx
  - client/src/pages/HistoryPage.jsx
  - client/src/hooks/useValidate.js
autonomous: true
requirements: []
---

# Plan 11-04: Loading States — Green Progress Bar & Skeleton Rows

## Objective
Add polished loading states: a hand-drawn green progress bar during validation (D-13), and skeleton placeholder rows matching the actual row shape during history loading (D-12). All loading UI follows the sketchbook design system.

## must_haves
- [ ] `client/src/components/validator/ProgressBar.jsx` created
- [ ] Progress bar appears when validation status is 'loading' or 'streaming'
- [ ] Progress bar has wobbly border-radius, hard shadow, pencil border (hand-drawn style)
- [ ] Progress bar fills left-to-right with smooth animated transition
- [ ] HistoryPage shows skeleton placeholder rows during initial load (status: 'loading')
- [ ] Skeleton rows match actual row structure (ranking placeholder + card placeholder)
- [ ] Skeleton rows use `bg-muted` + `animate-pulse` gray animation

## Tasks

<task id="11-04-01">
<title>Create ProgressBar component</title>
<read_first>
- CLAUDE.md §Design System — wobbly border-radius values, shadow tokens (shadow-hard), colors (#2d2d2d pencil, #fdfbf7 paper)
- CLAUDE.md §Score Bar (ScoreBar) — reference for hand-drawn visual indicator style
- client/src/components/ui/Card.jsx — reference for shadow-hard and wobbly styling patterns
</read_first>
<action>
Create `client/src/components/validator/ProgressBar.jsx`:

```jsx
export function ProgressBar({ isVisible, progress = 0, label = 'Validating your idea…' }) {
  if (!isVisible) return null

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      {/* Label */}
      {label && (
        <p className="font-body text-lg text-pencil mb-3 text-center">{label}</p>
      )}

      {/* Progress bar outer track */}
      <div
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        className="w-full h-5 bg-paper border-2 border-pencil shadow-hard p-1 overflow-hidden"
      >
        {/* Progress bar fill */}
        <div
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            backgroundColor: '#10b981',  // emerald-500 / green
            transition: 'width 0.5s ease-out',
          }}
          className="h-full"
        />
      </div>
    </div>
  )
}
```

Key design decisions:
- Outer track: `border-2 border-pencil shadow-hard bg-paper` — sketchbook aesthetic
- Inner fill: `backgroundColor: '#10b981'` (vibrant green) with CSS transition for smooth fill
- Both elements use wobbly border-radius via inline style
- `Math.min(100, Math.max(0, progress))` clamps progress to 0–100 range
- Returns null when not visible (clean mount/unmount)
</action>
<acceptance_criteria>
- File `client/src/components/validator/ProgressBar.jsx` exists and exports `ProgressBar`
- Component returns null when `isVisible` is false
- Outer track has `shadow-hard border-2 border-pencil bg-paper` classes
- Outer track has wobbly border-radius inline style
- Inner fill has `backgroundColor: '#10b981'` inline style
- Inner fill has `transition: 'width 0.5s ease-out'` inline style
- Inner fill width is `${progress}%` (clamped)
- grep -n "255px 15px 225px 15px" client/src/components/validator/ProgressBar.jsx returns at least 2 matches
</acceptance_criteria>
</task>

<task id="11-04-02">
<title>Integrate progress bar with simulated progress in useValidate</title>
<read_first>
- client/src/hooks/useValidate.js — current validate function and status transitions
- client/src/store/slices/validatorSlice.js — check for a `progress` field; if absent, plan to add it
- client/src/pages/HomePage.jsx — where ProgressBar will be rendered
</read_first>
<action>
1. Add `progress` field to `client/src/store/slices/validatorSlice.js` if not present:
   ```js
   // In initialState:
   progress: 0,

   // In reducers:
   setProgress: (state, action) => { state.progress = action.payload },

   // In startValidation reducer, reset progress:
   startValidation: (state) => {
     state.status = 'loading'
     state.result = ''
     state.error = null
     state.progress = 0   // add this line
   },

   // In finishValidation, set progress to 100:
   finishValidation: (state) => {
     state.status = 'done'
     state.progress = 100  // add this line
   },
   ```

2. In `client/src/hooks/useValidate.js`, add progress simulation:
   ```js
   import { ..., setProgress } from '../store/slices/validatorSlice'

   // Inside the validate function, after dispatch(startValidation()):
   dispatch(setProgress(15))  // initial

   // After dispatch(startStreaming()):
   dispatch(setProgress(40))  // streaming started

   // Add a simple interval to increment progress during streaming:
   let progressInterval = null
   progressInterval = setInterval(() => {
     dispatch(setProgress(prev => Math.min(prev + 2, 90)))
   }, 500)

   // In the cleanup (after stream done or error):
   if (progressInterval) clearInterval(progressInterval)
   dispatch(setProgress(100))
   ```

   Note: If `setProgress` with a function form doesn't work in Redux Toolkit (it uses Immer), use a ref to track current progress:
   ```js
   let currentProgress = 40
   progressInterval = setInterval(() => {
     currentProgress = Math.min(currentProgress + 2, 90)
     dispatch(setProgress(currentProgress))
   }, 500)
   ```

3. Export `progress` from useValidate hook: `const { idea, status, result, error, progress, validate } = useSelector(...)` — add `progress` to the selector.

4. In `client/src/pages/HomePage.jsx`:
   - Import ProgressBar: `import { ProgressBar } from '../components/validator/ProgressBar'`
   - Add to JSX between IdeaInput and the results section:
     ```jsx
     <ProgressBar
       isVisible={status === 'loading' || status === 'streaming'}
       progress={progress}
       label={status === 'loading' ? 'Sending to Claude…' : 'Analyzing your idea…'}
     />
     ```
</action>
<acceptance_criteria>
- validatorSlice.js has `progress: 0` in initialState
- validatorSlice.js exports `setProgress` action
- useValidate.js dispatches `setProgress` at key points (start, streaming, done)
- `progress` is returned from useValidate hook
- ProgressBar is imported in HomePage.jsx
- ProgressBar renders when status is 'loading' or 'streaming'
- ProgressBar is hidden when status is 'idle', 'done', or 'error'
- grep -n "ProgressBar" client/src/pages/HomePage.jsx returns at least 2 matches (import + render)
- grep -n "setProgress" client/src/store/slices/validatorSlice.js returns at least 2 matches
</acceptance_criteria>
</task>

<task id="11-04-03">
<title>Add skeleton loading rows to HistoryPage</title>
<read_first>
- client/src/pages/HistoryPage.jsx — loading state section; the current loading indicator
- client/src/components/history/HistoryCard.jsx — structure to replicate in skeleton (title, snippet, footer)
- CLAUDE.md §Design System — bg-muted (#e5e0d8) for skeleton fill, wobbly border-radius
</read_first>
<action>
In `client/src/pages/HistoryPage.jsx`:

1. Create a `SkeletonHistoryRow` component inline (above the main component or as a named inner component):
   ```jsx
   function SkeletonHistoryRow({ delay = 0 }) {
     return (
       <div className="flex items-start gap-4" style={{ animationDelay: `${delay}s` }}>
         {/* Ranking placeholder */}
         <div className="w-10 pt-4 flex-shrink-0 flex justify-center">
           <div className="w-7 h-7 bg-muted rounded animate-pulse" />
         </div>

         {/* Card placeholder */}
         <div
           style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
           className="flex-1 bg-white border-2 border-muted shadow-hardSm p-6 space-y-4"
         >
           {/* Title skeleton */}
           <div className="h-6 bg-muted rounded animate-pulse w-2/3" />

           {/* Snippet skeleton — 2 lines */}
           <div className="space-y-2">
             <div className="h-4 bg-muted rounded animate-pulse" />
             <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
           </div>

           {/* Footer skeleton */}
           <div className="flex items-center justify-between pt-2">
             <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
             <div className="h-4 bg-muted rounded animate-pulse w-1/5" />
           </div>
         </div>
       </div>
     )
   }
   ```

2. Replace the current loading indicator in HistoryPage (e.g., `<p>Loading...</p>` or the simple dots indicator from plan 11-02-04) with skeleton rows:
   ```jsx
   {status === 'loading' && (
     <div className="w-full max-w-4xl flex flex-col gap-4 mb-12">
       {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
         <SkeletonHistoryRow key={`skeleton-${i}`} delay={delay} />
       ))}
     </div>
   )}
   ```

3. The `delay` prop applies a CSS `animation-delay` directly on the inner animated elements for a staggered effect. Alternatively, you can apply it on the row container `style={{ animationDelay }}` if that works with Tailwind's `animate-pulse`.

Note: Tailwind's `animate-pulse` is a CSS animation on the element class. To stagger, either use inline style on each pulse element or set a CSS variable. The simplest approach is to keep the stagger small (0.1s intervals) and accept they pulse in unison if CSS variable approach is too complex.
</action>
<acceptance_criteria>
- `SkeletonHistoryRow` component defined in HistoryPage.jsx
- 5 skeleton rows render when status is 'loading'
- Skeleton rows match actual row structure (ranking placeholder + card placeholder)
- Card placeholder has wobbly border-radius inline style
- Skeleton fills use `bg-muted` and `animate-pulse` classes
- grep -n "SkeletonHistoryRow" client/src/pages/HistoryPage.jsx returns at least 2 matches (definition + usage)
- grep -n "animate-pulse" client/src/pages/HistoryPage.jsx returns at least 3 matches
</acceptance_criteria>
</task>

## Verification
- [ ] ProgressBar component exists at `client/src/components/validator/ProgressBar.jsx`
- [ ] Progress bar visible on HomePage during 'loading' and 'streaming' states
- [ ] Progress bar has wobbly border-radius (both track and fill)
- [ ] Progress bar has shadow-hard and border-2 border-pencil
- [ ] Progress bar fill is green (#10b981)
- [ ] Progress bar animates smoothly (CSS transition, not instant jumps)
- [ ] Progress bar hidden when status is 'idle', 'done', or 'error'
- [ ] HistoryPage shows 5 skeleton rows during 'loading' status
- [ ] Skeleton rows match HistoryCard structure (ranking + title + snippet + footer)
- [ ] Skeleton rows use bg-muted + animate-pulse
- [ ] Skeleton rows staggered (different animation delays)
- [ ] Skeleton rows replaced by real content when history loads
- [ ] No layout shift during skeleton → real content transition
- [ ] No console errors
