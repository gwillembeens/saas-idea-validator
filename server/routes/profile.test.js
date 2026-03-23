import { describe, it } from 'node:test'
import assert from 'node:assert'
import { calculateStreaks, buildHeatmapArray } from './profile.js'

describe('calculateStreaks', () => {
  const makeHeatmap = (activeDates) => {
    // Build minimal heatmap array with just the given active dates
    return activeDates.map(date => ({ date, count: 1 }))
  }

  it('returns 0/0 for empty heatmap', () => {
    assert.deepEqual(calculateStreaks([]), { current: 0, longest: 0 })
  })

  it('returns 1/1 for single active day that is today', () => {
    const today = new Date().toISOString().slice(0, 10)
    assert.deepEqual(calculateStreaks(makeHeatmap([today])), { current: 1, longest: 1 })
  })

  it('returns current=1 if last active day is yesterday', () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const yesterday = d.toISOString().slice(0, 10)
    assert.deepEqual(calculateStreaks(makeHeatmap([yesterday])), { current: 1, longest: 1 })
  })

  it('returns current=0 if last active day is 2 days ago', () => {
    const d = new Date()
    d.setDate(d.getDate() - 2)
    const twoDaysAgo = d.toISOString().slice(0, 10)
    assert.deepEqual(calculateStreaks(makeHeatmap([twoDaysAgo])), { current: 0, longest: 1 })
  })

  it('counts consecutive days correctly for longest streak', () => {
    const dates = ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-10', '2025-01-11']
    const heatmap = dates.map(date => ({ date, count: 1 }))
    const result = calculateStreaks(heatmap)
    assert.equal(result.longest, 3)
  })
})
