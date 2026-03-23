import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ScoreTrendChart } from './ScoreTrendChart'

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}))

describe('ScoreTrendChart', () => {
  test('renders nothing when scoreTrend is null', () => {
    const { container } = render(<ScoreTrendChart scoreTrend={null} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when fewer than 2 data points', () => {
    const { container } = render(<ScoreTrendChart scoreTrend={[{ title: 'A', score: 3, created_at: '2025-01-01' }]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders chart when 2 or more data points', () => {
    const { getByTestId } = render(
      <ScoreTrendChart
        scoreTrend={[
          { title: 'A', score: 3, created_at: '2025-01-01' },
          { title: 'B', score: 4, created_at: '2025-01-02' },
        ]}
      />
    )
    expect(getByTestId('line-chart')).toBeTruthy()
  })

  test('renders chart when exactly 20 data points', () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      title: `Idea ${i}`,
      score: (i % 5) + 1,
      created_at: `2025-01-${String(i + 1).padStart(2, '0')}`,
    }))
    const { getByTestId } = render(<ScoreTrendChart scoreTrend={data} />)
    expect(getByTestId('line-chart')).toBeTruthy()
  })
})
