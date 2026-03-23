# Phase 22: Profile Analytics — Research

**Date:** 2026-03-23
**Status:** RESEARCH COMPLETE

---

## 1. Recharts Library

### Installation

**Latest version:** 3.8.0 (released 2026-03-06)

```bash
npm install recharts react-is
```

**Important:** The `react-is` package version must match your installed React version. Current project uses React 19.2.4, so `react-is@19.x` will be required.

**Compatibility:** Recharts 3.8.0 is fully compatible with React 19. Earlier versions (2.15.1, 2.15.0) also work with React 19 after the library's React 19 support was implemented.

### LineChart API

The `LineChart` component is the main container for line-based data visualization. It accepts the following key props:

**Required Props:**
- `data: array` — Array of objects containing data points. Example: `[{ name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }]`

**Optional Props:**
- `width: number` — Chart width in pixels (used when NOT wrapped in ResponsiveContainer)
- `height: number` — Chart height in pixels (used when NOT wrapped in ResponsiveContainer)
- `margin: object` — Padding around chart: `{ top, right, bottom, left }`. Default: `{ top: 5, right: 30, left: 0, bottom: 5 }`
- `layout: string` — Data orientation ('horizontal' or 'vertical'). Default: 'vertical'

**Example Structure:**
```jsx
<LineChart
  data={data}
  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
>
  {/* child components */}
</LineChart>
```

### ResponsiveContainer

The `ResponsiveContainer` component automatically scales charts to fill their parent container. Use this for responsive charts that adapt to window resizing.

**Props:**
- `width: string | number` — Default: '100%' (recommended for responsive)
- `height: number | string` — Chart height. Can be a number (pixels) or percentage
- `aspect: number` — Alternative to explicit height: maintains width-to-height ratio. Example: `aspect={3}` or `aspect={500/300}`
- `minWidth: number` — Minimum width in pixels
- `minHeight: number` — Minimum height in pixels

**Basic Pattern:**
```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    {/* components */}
  </LineChart>
</ResponsiveContainer>
```

**Mobile-safe pattern (maintains aspect ratio):**
```jsx
<ResponsiveContainer width="100%" aspect={16 / 9}>
  <LineChart data={data}>
    {/* components */}
  </LineChart>
</ResponsiveContainer>
```

### XAxis, YAxis Configuration

Both axes use similar configuration patterns:

**XAxis Props:**
- `dataKey: string` — Property name from data objects to display as labels. Example: `dataKey="date"`
- `type: string` — Data type: 'number' | 'category' | 'number' | default is auto-detected
- `stroke: string` — Line color (default: '#666')
- `label: string | object` — Axis label with optional positioning

**YAxis Props:**
- `dataKey: string` — Property to use for Y values (optional; defaults to all numeric properties)
- `type: string` — Data type (default: 'number')
- `label: string | object` — Axis label
- `stroke: string` — Line color

**Example:**
```jsx
<XAxis dataKey="date" stroke="#2d2d2d" />
<YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
```

### Line Component

The `Line` component renders the actual data series as a line on the chart.

**Key Props:**
- `dataKey: string` — Property to plot (required). Example: `dataKey="weighted_score"`
- `stroke: string` — Line color. Example: `stroke="#2d5da1"` (design system blue)
- `strokeWidth: number` — Line thickness. Default: 2. Recommend 2–3 for readability
- `dot: boolean | object` — Show circle markers at data points
  - `dot={true}` — Show default dots
  - `dot={false}` — Hide dots (clean look)
  - `dot={{ fill: '#ff4d4d', r: 4 }}` — Custom dot styling
- `type: string` — Line curve type: 'monotone' | 'linear' | 'natural' | 'cardinal'. Default: 'linear'
  - `monotone` — Smooth curve without overshoot
  - `linear` — Straight lines between points
  - `natural` — Smooth curve with potential overshoot
- `isAnimationActive: boolean` — Animate on mount. Default: true

**Example:**
```jsx
<Line
  dataKey="weighted_score"
  stroke="#2d5da1"
  strokeWidth={2}
  dot={false}
  type="monotone"
  isAnimationActive={true}
/>
```

### Tooltip Component & Customization

The `Tooltip` component displays data on hover/touch.

**Props:**
- `content: ReactElement | function` — Custom tooltip component
- `contentStyle: object` — CSS styles for tooltip container
- `cursor: boolean | object` — Show/style the cursor line
- `wrapperStyle: object` — Outer wrapper styles

**Custom Tooltip Pattern:**

To create a custom tooltip, define a component that receives `{ active, payload, label }` props:

```jsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-paper border-2 border-pencil p-2 shadow-hard"
           style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}>
        <p className="font-body text-sm text-pencil font-bold">{label}</p>
        <p className="font-body text-sm text-pencil">
          Score: {payload[0].value.toFixed(2)}/5
        </p>
      </div>
    );
  }
  return null;
};

// Usage:
<Tooltip content={<CustomTooltip />} />
```

**Payload structure:** `payload` is an array of objects: `[{ name, value, dataKey, ... }]`

### CartesianGrid (Optional)

The `CartesianGrid` component renders background gridlines for easier value reading.

**Props:**
- `strokeDasharray: string` — Dashed grid: "3 3" for dashes, "0" for solid
- `stroke: string` — Grid color (default: '#f0f0f0')
- `opacity: number` — Grid opacity (0–1)

**Design system example (subtle muted grid):**
```jsx
<CartesianGrid stroke="#e5e0d8" opacity={0.3} />
```

---

## 2. Streak Algorithm

### Current Streak Logic

A "current streak" counts consecutive calendar days ending on today OR yesterday. The streak does NOT break if the user hasn't validated today yet, as long as they validated yesterday.

**Pseudocode:**

```
function calculateCurrentStreak(activeDays: string[]): number {
  // activeDays = sorted ISO date strings (YYYY-MM-DD)
  // Examples: ["2026-03-20", "2026-03-21", "2026-03-22"]

  const today = new Date(new Date().toISOString().split('T')[0])
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // If neither today nor yesterday is in the list, streak is 0
  if (!activeDays.includes(todayStr) && !activeDays.includes(yesterdayStr)) {
    return 0
  }

  // Start from the most recent date and count backwards
  const lastActiveDateStr = activeDays[activeDays.length - 1]
  let streak = 0
  let currentDate = new Date(lastActiveDateStr)

  for (let i = activeDays.length - 1; i >= 0; i--) {
    const dateStr = activeDays[i]
    const date = new Date(dateStr)

    // Check if this date is consecutive to the previous
    if (i === activeDays.length - 1) {
      // First date: count it
      streak = 1
    } else {
      const prevDate = new Date(activeDays[i + 1])
      const dayDiff = Math.floor((prevDate - date) / (1000 * 60 * 60 * 24))

      if (dayDiff === 1) {
        // Consecutive: increment
        streak++
      } else {
        // Gap detected: stop
        break
      }
    }
  }

  return streak
}
```

**JavaScript Implementation:**

```javascript
function getCurrentStreak(activeDays) {
  if (!activeDays.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If neither today nor yesterday is active, streak is 0
  if (!activeDays.includes(todayStr) && !activeDays.includes(yesterdayStr)) {
    return 0;
  }

  // Count backwards from the last active day
  let streak = 1;
  for (let i = activeDays.length - 1; i > 0; i--) {
    const currentDate = new Date(activeDays[i]);
    const previousDate = new Date(activeDays[i - 1]);
    const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
```

### Longest Streak Logic

The "longest streak" is the maximum sequence of consecutive days found anywhere in the history.

**Pseudocode:**

```
function calculateLongestStreak(activeDays: string[]): number {
  // activeDays = sorted ISO date strings

  if (!activeDays.length) return 0
  if (activeDays.length === 1) return 1

  let longestStreak = 1
  let currentStreak = 1

  for (let i = 1; i < activeDays.length; i++) {
    const currentDate = new Date(activeDays[i])
    const previousDate = new Date(activeDays[i - 1])

    const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24))

    if (dayDiff === 1) {
      // Consecutive: increment
      currentStreak++
    } else {
      // Gap detected: reset and update longest
      longestStreak = Math.max(longestStreak, currentStreak)
      currentStreak = 1
    }
  }

  // Check the final streak
  return Math.max(longestStreak, currentStreak)
}
```

**JavaScript Implementation:**

```javascript
function getLongestStreak(activeDays) {
  if (!activeDays.length) return 0;
  if (activeDays.length === 1) return 1;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < activeDays.length; i++) {
    const currentDate = new Date(activeDays[i]);
    const previousDate = new Date(activeDays[i - 1]);
    const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }

  return Math.max(longestStreak, currentStreak);
}
```

### Combined Function for Both Streaks

```javascript
export function calculateStreaks(activeDays) {
  // activeDays = sorted array of ISO date strings: ["2026-03-20", "2026-03-21", ...]

  if (!activeDays.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Current streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 0;
  if (activeDays.includes(todayStr) || activeDays.includes(yesterdayStr)) {
    currentStreak = 1;
    for (let i = activeDays.length - 1; i > 0; i--) {
      const curr = new Date(activeDays[i]);
      const prev = new Date(activeDays[i - 1]);
      const diff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) currentStreak++;
      else break;
    }
  }

  // Longest streak
  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < activeDays.length; i++) {
    const curr = new Date(activeDays[i]);
    const prev = new Date(activeDays[i - 1]);
    const diff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
```

---

## 3. PostgreSQL Date Grouping Patterns

### Heatmap Query (GROUP BY DATE)

This query aggregates validations by date, returning the count of validations per calendar day for the last 365 days.

**Base Query (from CONTEXT.md):**

```sql
SELECT
  DATE(created_at) as day,
  COUNT(*) as count
FROM saved_results
WHERE user_id = $1
  AND is_public = true
  AND deleted_at IS NULL
  AND created_at >= NOW() - INTERVAL '365 days'
GROUP BY DATE(created_at)
ORDER BY day ASC
```

**Key Points:**
- `DATE(created_at)` converts the timestamp to a date (YYYY-MM-DD), discarding time
- The WHERE clause filters for:
  - User ownership (`user_id = $1`)
  - Public validations only (`is_public = true`)
  - Non-deleted records (`deleted_at IS NULL`)
  - Last 365 calendar days (not "past 365 * 24 hours", which would be about 12 months ago)
- `GROUP BY DATE(created_at)` aggregates multiple validations on the same day into a single row
- `COUNT(*)` gives the number of validations per day
- `ORDER BY day ASC` ensures chronological order (oldest first)

**Result Shape:**
```
day        | count
-----------+-------
2025-03-24 | 1
2025-03-25 | 3
2025-03-26 | 1
...
2026-03-23 | 2
```

### Streak Query (Derived Data)

The streak data is derived in the backend service layer from the heatmap results, NOT computed in SQL. The algorithm above processes the sorted date array to find current and longest streaks.

**Why not SQL-based?** PostgreSQL can compute streaks using window functions (`ROW_NUMBER`, `LAG`), but the logic is complex and less readable. Since the heatmap is already queried, processing the dates in JavaScript is simpler and more maintainable.

**If SQL streak calculation is needed later:**

PostgreSQL uses `ROW_NUMBER() OVER (ORDER BY date)` to detect gaps:

```sql
WITH dated_rows AS (
  SELECT
    DATE(created_at) as day,
    ROW_NUMBER() OVER (ORDER BY DATE(created_at)) as rn
  FROM saved_results
  WHERE user_id = $1
    AND is_public = true
    AND deleted_at IS NULL
    AND created_at >= NOW() - INTERVAL '365 days'
),
streak_groups AS (
  SELECT
    day,
    day - (rn || ' days')::INTERVAL as streak_group
  FROM dated_rows
)
SELECT
  COUNT(*) as streak_length,
  MIN(day) as start_date,
  MAX(day) as end_date
FROM streak_groups
GROUP BY streak_group
ORDER BY end_date DESC
LIMIT 1
```

This finds the longest streak. However, for this project, the JS-based approach is recommended.

---

## 4. Component Architecture Recommendation

Based on CONTEXT.md decisions and the research above, here's the recommended structure:

### Backend Changes (profileRoute)

Extend the existing `GET /api/profile/:username` response with an `analytics` field:

```javascript
{
  username: "alice",
  display_name: "Alice",
  stats: { /* existing stats */ },
  validations: [ /* existing */ ],
  chains: [ /* existing */ ],
  analytics: {
    heatmap: [
      { day: "2026-01-01", count: 2 },
      { day: "2026-01-02", count: 0 },
      // ... 365 days
    ],
    scoreTrend: [
      { index: 0, score: 3.5, date: "2026-02-01" },
      { index: 1, score: 3.8, date: "2026-02-05" },
      // ... last 20 validations
    ],
    nicheBreakdown: {
      "SaaS": 12,
      "AI": 8,
      "Other": 3,
      // ...
    },
    streaks: {
      currentStreak: 7,
      longestStreak: 23
    }
  }
}
```

### Frontend Components

**File Structure:**
```
client/src/components/profile/
├── ActivityHeatmap.jsx       ← Hand-rolled 52-week grid (no library)
├── ScoreTrendChart.jsx       ← Recharts LineChart, wraps in ResponsiveContainer
├── NicheBreakdownChart.jsx   ← CSS percentage bars (no library)
├── StreakStats.jsx           ← StatItem components, reuses existing pattern
└── AnalyticsSection.jsx      ← Container, renders all 4 subsections
```

**Component Hierarchy:**

```
ProfilePage
└── AnalyticsSection (new, below RevisionChains)
    ├── Heading "Activity"
    ├── ActivityHeatmap (responsive grid, mobile scrollable)
    ├── ScoreTrendChart (Recharts, hidden if < 2 points)
    ├── NicheBreakdownChart (CSS bars)
    └── StreakStats (StatItem pair)
```

### Key Design Decisions

1. **No new dependencies except Recharts:** D-05 mandates hand-rolled heatmap, D-11 mandates CSS bars. Only Recharts added.

2. **Heatmap Grid (52 weeks):** 7 columns (Sun–Sat), 52 rows. Each cell is a clickable div with wobbly border-radius and color scale:
   - White/paper: no activity (count = 0)
   - Light muted: 1 validation
   - Medium muted: 2–3 validations
   - Pencil dark: 4+ validations
   - Hover/tap reveals tooltip with count

3. **Score Trend (Recharts LineChart):**
   - Data: last 20 validations by created_at (oldest → newest)
   - If fewer than 2 points, hide the chart entirely (D-09)
   - X-axis: validation index or date (skip labels for clean look)
   - Y-axis: weighted score 1.0–5.0
   - Line: smooth (type="monotone"), pencil color (#2d5da1), strokeWidth=2
   - Dots: hidden (dot={false}) for minimal aesthetic
   - Tooltip: custom, shows date + score rounded to 2 decimals
   - Grid: subtle muted (#e5e0d8)

4. **Niche Breakdown (CSS bars):**
   - Sorted by count descending
   - Each row: niche pill (reuse NichePill component) + percentage bar
   - Bar width calculated as `(count / maxCount) * 100%`
   - Bar: muted bg with pencil border, wobbly, subtle shadow

5. **Streak Stats (StatItem):**
   - Two StatItem components side-by-side
   - Labels: "current streak" and "longest streak"
   - Values: e.g. "7" and "23"
   - Inline layout with optional separator (dot, like existing stat bar)

6. **Mobile Responsiveness:**
   - Heatmap: horizontal scroll on mobile (D-06), full grid on desktop
   - Score trend: height scales with viewport (aspect ratio maintained)
   - Niche breakdown: full width, bars don't truncate
   - Streak stats: stack vertically on mobile (below 640px), inline on desktop

---

## 5. Testing Approach

### Unit Tests

**File: `client/src/utils/streakCalculator.test.js`**

Test the streak calculation functions in isolation:

```javascript
describe('calculateStreaks', () => {
  test('returns 0 streaks when no active days', () => {
    const result = calculateStreaks([])
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 })
  })

  test('returns 1 current streak and 1 longest for single day today', () => {
    const today = new Date().toISOString().split('T')[0]
    const result = calculateStreaks([today])
    expect(result).toEqual({ currentStreak: 1, longestStreak: 1 })
  })

  test('does not break current streak if only yesterday is active', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const result = calculateStreaks([yesterdayStr])
    expect(result.currentStreak).toBe(1)
  })

  test('calculates current streak from consecutive days ending yesterday', () => {
    // 5 consecutive days ending yesterday
    const dates = []
    for (let i = 6; i >= 1; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }
    const result = calculateStreaks(dates)
    expect(result.currentStreak).toBe(5)
    expect(result.longestStreak).toBe(5)
  })

  test('breaks current streak if gap between yesterday and older days', () => {
    // [Jan 1, Jan 2, Jan 3] (gap), [yesterday, today-1]
    // Hard to test without mocking Date. Use date library or mock.
  })

  test('finds longest streak across gaps', () => {
    // Multiple streaks: 3 days, 2 day gap, 5 days
    // Should find 5 as longest
  })
})
```

**File: `client/src/components/profile/ScoreTrendChart.test.jsx`**

Test chart rendering and data handling:

```javascript
import { render, screen } from '@testing-library/react'
import { ScoreTrendChart } from './ScoreTrendChart'

describe('ScoreTrendChart', () => {
  test('renders nothing when fewer than 2 data points', () => {
    const { container } = render(<ScoreTrendChart data={[]} />)
    expect(container.firstChild).toBeEmptyDOMElement()
  })

  test('renders when 2 or more data points', () => {
    const data = [
      { index: 0, score: 3.5, date: '2026-03-01' },
      { index: 1, score: 3.8, date: '2026-03-02' },
    ]
    const { container } = render(<ScoreTrendChart data={data} />)
    expect(container.querySelector('.score-trend-chart')).toBeInTheDocument()
  })

  test('renders ResponsiveContainer with correct aspect ratio', () => {
    // Mock Recharts to verify props
  })
})
```

**File: `client/src/components/profile/ActivityHeatmap.test.jsx`**

Test heatmap grid rendering:

```javascript
describe('ActivityHeatmap', () => {
  test('renders 52 rows × 7 columns grid', () => {
    const data = {} // 365 days of data
    const { container } = render(<ActivityHeatmap data={data} />)
    const cells = container.querySelectorAll('[data-testid="heatmap-cell"]')
    expect(cells.length).toBe(52 * 7) // 364 cells
  })

  test('applies correct color class based on count', () => {
    const data = {
      '2026-03-01': 0,  // white
      '2026-03-02': 1,  // light muted
      '2026-03-03': 5,  // dark pencil
    }
    const { container } = render(<ActivityHeatmap data={data} />)
    // Query cells and verify className matches intensity
  })

  test('shows tooltip on hover with validation count', () => {
    // Simulate hover event and verify tooltip text
  })
})
```

### Integration Tests

**File: `client/src/pages/ProfilePage.test.jsx`**

Extend existing ProfilePage tests to cover new analytics section:

```javascript
describe('ProfilePage with Analytics', () => {
  test('renders analytics section below revision chains', async () => {
    const mockProfile = {
      username: 'alice',
      display_name: 'Alice',
      stats: { /* ... */ },
      validations: [ /* ... */ ],
      chains: [ /* ... */ ],
      analytics: {
        heatmap: [ /* 365 days */ ],
        scoreTrend: [ /* last 20 scores */ ],
        nicheBreakdown: { 'SaaS': 10, 'AI': 5 },
        streaks: { currentStreak: 7, longestStreak: 23 }
      }
    }

    // Mock fetch
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockProfile)
    }))

    render(<ProfilePage />)

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText(/Activity/i)).toBeInTheDocument()
    })

    // Verify sections render
    expect(screen.getByTestId('heatmap')).toBeInTheDocument()
    expect(screen.getByTestId('score-chart')).toBeInTheDocument()
    expect(screen.getByTestId('niche-breakdown')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument() // current streak
  })

  test('does not render score chart if fewer than 2 data points', async () => {
    const mockProfile = { /* ... */, analytics: { scoreTrend: [{ ... }] } }
    // ...
    expect(screen.queryByTestId('score-chart')).not.toBeInTheDocument()
  })
})
```

### Test Utilities Needed

**Mock Recharts:**

```javascript
// __mocks__/recharts.js
export const ResponsiveContainer = ({ children }) => <div data-testid="responsive-container">{children}</div>
export const LineChart = ({ data, children }) => <div data-testid="line-chart">{children}</div>
export const Line = (props) => <div data-testid="line" {...props} />
export const XAxis = (props) => <div data-testid="x-axis" {...props} />
export const YAxis = (props) => <div data-testid="y-axis" {...props} />
export const CartesianGrid = (props) => <div data-testid="grid" {...props} />
export const Tooltip = (props) => <div data-testid="tooltip" {...props} />
```

**Mock Date for Streak Tests:**

```javascript
// utils/testHelpers.js
export function setMockDate(dateStr) {
  // Mock Date.now() to return a specific date
  jest.useFakeTimers()
  jest.setSystemTime(new Date(dateStr))
}

export function restoreMockDate() {
  jest.useRealTimers()
}
```

---

## 6. Validation Architecture

### Backend Validation (`server/routes/profile.js`)

**Data Flow:**

1. Accept `username` route parameter
2. Query `users` table for existence
3. Query `saved_results` with GROUP BY DATE for 365 days
4. Calculate streaks in JS from sorted date array
5. Construct niche breakdown and score trend from validations
6. Return unified response with `analytics` field

**Validation Points:**

- Username parameter: alphanumeric, max 50 chars (mirrors `users.username` constraint)
- SQL injection: use parameterized query (`$1`)
- Empty result sets: return empty analytics gracefully
- Score data: ensure scores are valid JSON before inclusion

### Frontend Validation (`client/src/pages/ProfilePage.jsx`)

**Data Validation on Fetch:**

```javascript
// Validate analytics shape before rendering
function validateAnalytics(analytics) {
  const required = ['heatmap', 'scoreTrend', 'nicheBreakdown', 'streaks']
  return required.every(key => key in analytics)
    && Array.isArray(analytics.heatmap)
    && Array.isArray(analytics.scoreTrend)
    && typeof analytics.streaks === 'object'
}

// Use before rendering
if (profile.analytics && validateAnalytics(profile.analytics)) {
  // render analytics
}
```

**Component-Level Validation:**

- **ScoreTrendChart:** Hide if fewer than 2 data points (D-09)
- **ActivityHeatmap:** Render empty grid if no data
- **NicheBreakdownChart:** Hide if no niches
- **StreakStats:** Show 0 if missing data

---

## Summary: What to Build

1. **Add `recharts` dependency** to client/package.json (^3.8.0)
2. **Extend profileRoute** to compute and return analytics data
3. **Create 4 profile analytics components:**
   - Hand-rolled 52-week heatmap grid
   - Recharts LineChart for score trends
   - CSS-based niche distribution bars
   - StatItem pair for streaks
4. **Update ProfilePage** to render AnalyticsSection below RevisionChains
5. **Write comprehensive unit and integration tests** covering all data paths and edge cases
6. **Verify mobile responsiveness** (heatmap horizontal scroll, responsive chart heights, layout stacking)

---

## Sources & References

- [Recharts GitHub Repository](https://github.com/recharts/recharts)
- [Recharts npm Package](https://www.npmjs.com/package/recharts)
- [Create charts using Recharts - Refine](https://refine.dev/blog/recharts/)
- [Date Streaks Algorithm - GitHub](https://github.com/jonsamp/date-streaks)
- [Streak Calculation in PostgreSQL - Peter Morgenstern](https://www.petergundel.de/postgresql/2023/04/23/streak-calculation-in-postgresql.html)
- [Creating Custom Tooltip in Recharts - Borstch](https://borstch.com/snippet/creating-custom-tooltip-in-recharts)
- [Implementing Custom Tooltips and Legends using Recharts - Medium](https://medium.com/@rutudhokchaule/implementing-custom-tooltips-and-legends-using-recharts-98b6e3c8b712)

---

*Research completed: 2026-03-23*
