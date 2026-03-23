import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalyticsSection } from './AnalyticsSection'

vi.mock('./ActivityHeatmap', () => ({
  ActivityHeatmap: ({ heatmap }) => <div data-testid="activity-heatmap">{heatmap?.length} days</div>,
}))
vi.mock('./ScoreTrendChart', () => ({
  ScoreTrendChart: ({ scoreTrend }) => <div data-testid="score-trend">{scoreTrend?.length} points</div>,
}))
vi.mock('./NicheBreakdown', () => ({
  NicheBreakdown: ({ nicheBreakdown }) => <div data-testid="niche-breakdown">{nicheBreakdown?.length} niches</div>,
}))

const mockAnalytics = {
  heatmap: [{ date: '2025-01-01', count: 1 }],
  scoreTrend: [
    { title: 'A', score: 3, created_at: '2025-01-01' },
    { title: 'B', score: 4, created_at: '2025-01-02' },
  ],
  nicheBreakdown: [{ niche: 'SaaS', count: 5 }],
  streaks: { current: 3, longest: 7 },
}

describe('AnalyticsSection', () => {
  test('renders nothing when analytics is null', () => {
    const { container } = render(<AnalyticsSection analytics={null} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders "Activity" heading when there is activity', () => {
    render(<AnalyticsSection analytics={mockAnalytics} />)
    expect(screen.getByText('Activity')).toBeTruthy()
  })

  test('renders streak stats when streaks are non-zero', () => {
    render(<AnalyticsSection analytics={mockAnalytics} />)
    expect(screen.getByText('day streak')).toBeTruthy()
    expect(screen.getByText('longest streak')).toBeTruthy()
  })

  test('renders ActivityHeatmap when heatmap has data', () => {
    render(<AnalyticsSection analytics={mockAnalytics} />)
    expect(screen.getByTestId('activity-heatmap')).toBeTruthy()
  })

  test('renders ScoreTrendChart when scoreTrend has 2+ points', () => {
    render(<AnalyticsSection analytics={mockAnalytics} />)
    expect(screen.getByTestId('score-trend')).toBeTruthy()
  })

  test('renders NicheBreakdown when nicheBreakdown has data', () => {
    render(<AnalyticsSection analytics={mockAnalytics} />)
    expect(screen.getByTestId('niche-breakdown')).toBeTruthy()
  })

  test('does not render streak stats when both streaks are zero', () => {
    const analytics = { ...mockAnalytics, streaks: { current: 0, longest: 0 } }
    render(<AnalyticsSection analytics={analytics} />)
    expect(screen.queryByText('day streak')).toBeNull()
  })
})
