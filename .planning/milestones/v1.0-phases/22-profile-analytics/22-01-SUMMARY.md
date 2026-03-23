# Plan 22-01 Summary

**Status:** Complete ✓
**Tasks:** 8/8

## Changes Made
- server/routes/profile.js: Added heatmap SQL query to fetch 365 days of activity data, buildHeatmapArray function to fill gaps in the 365-day calendar, calculateStreaks function to compute current and longest streaks, scoreTrend extraction from last 20 validations, nicheBreakdown computation from all niches, and analytics field in response containing heatmap, scoreTrend, nicheBreakdown, and streaks
- server/routes/profile.js: Exported calculateStreaks and buildHeatmapArray helper functions for testing
- server/routes/profile.test.js: Created new test file with 5 calculateStreaks unit tests

## Test Results
All tests passing (53/53)
- 5 new calculateStreaks tests all pass
- All existing 48 tests remain passing (no regressions)

## Implementation Details

### Heatmap (365 days)
- SQL query groups public, non-deleted validations by DATE(created_at) for past 365 days
- buildHeatmapArray fills gaps so all calendar days are represented with count: 0 for inactive days
- Returns array of { date: "YYYY-MM-DD", count: number }

### Score Trend
- Takes up to 20 most recent public validations (already DESC sorted)
- Reverses to chronological (oldest → newest)
- Each entry: { title, score (weighted), created_at }

### Niche Breakdown
- Counts all niches from user's public validations
- Sorts by count descending
- Returns array of { niche, count }

### Streaks
- Current: consecutive days ending on today or yesterday
- Longest: maximum consecutive active days in 365-day window
- Handles edge cases: empty heatmap returns 0/0, gap of 2+ days breaks current streak

### Response Shape
```json
{
  "analytics": {
    "heatmap": [{ date, count }, ...],
    "scoreTrend": [{ title, score, created_at }, ...],
    "nicheBreakdown": [{ niche, count }, ...],
    "streaks": { current: number, longest: number }
  }
}
```
