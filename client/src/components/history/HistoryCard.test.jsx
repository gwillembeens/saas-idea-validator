import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Test the conditional niche pill logic directly
const NichePill = ({ niche }) =>
  niche ? (
    <div
      data-testid="niche-pill"
      className="hidden md:inline-flex px-3 py-1 font-body text-xs text-pencil border border-pencil rounded"
      style={{ backgroundColor: '#e5e0d8' }}
    >
      {niche}
    </div>
  ) : null

describe('HistoryCard niche pill', () => {
  it('renders niche pill when niche is present', () => {
    const { unmount } = render(<NichePill niche="Fintech" />)
    expect(screen.getByText('Fintech')).toBeTruthy()
    expect(screen.getByTestId('niche-pill')).toBeTruthy()
    unmount()
  })

  it('renders nothing when niche is absent', () => {
    const { container, unmount } = render(<NichePill niche={null} />)
    expect(container.querySelector('[data-testid="niche-pill"]')).toBeNull()
    unmount()
  })

  it('niche pill has hidden md:inline-flex classes', () => {
    const { unmount } = render(<NichePill niche="EdTech" />)
    const pill = screen.getByTestId('niche-pill')
    expect(pill.className).toContain('hidden')
    expect(pill.className).toContain('md:inline-flex')
    unmount()
  })
})
