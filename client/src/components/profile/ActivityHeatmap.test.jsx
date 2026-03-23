import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityHeatmap } from './ActivityHeatmap'

const make365Days = () => {
  const days = []
  const today = new Date()
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push({ date: d.toISOString().slice(0, 10), count: 0 })
  }
  return days
}

describe('ActivityHeatmap', () => {
  test('renders nothing when heatmap is empty', () => {
    const { container } = render(<ActivityHeatmap heatmap={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when heatmap is null', () => {
    const { container } = render(<ActivityHeatmap heatmap={null} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders cells for a full year of data', () => {
    const heatmap = make365Days()
    const { container } = render(<ActivityHeatmap heatmap={heatmap} />)
    // Count all cells with border style, minus the 4 legend cells
    const allBorderedCells = container.querySelectorAll('[style*="border: 1px solid"]')
    // Subtract legend's 4 color squares to get actual data cells
    const dataCellCount = allBorderedCells.length - 4
    expect(dataCellCount).toBe(365)
  })

  test('uses paper color for zero-count days', () => {
    const heatmap = [{ date: '2025-01-01', count: 0 }]
    const { container } = render(<ActivityHeatmap heatmap={heatmap} />)
    const cell = container.querySelector('[style*="background-color: rgb(253, 251, 247)"]')
    expect(cell).toBeTruthy()
  })

  test('uses pencil color for high-count days', () => {
    const heatmap = [{ date: '2025-01-01', count: 5 }]
    const { container } = render(<ActivityHeatmap heatmap={heatmap} />)
    const cell = container.querySelector('[style*="background-color: rgb(45, 45, 45)"]')
    expect(cell).toBeTruthy()
  })
})
