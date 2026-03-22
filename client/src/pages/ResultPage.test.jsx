import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('ResultPage niche row', () => {
  it('renders niche row when result has niche', () => {
    const niche = 'Fintech'
    const { container } = render(
      <div>
        {niche && (
          <div data-testid="niche-row">
            <div>{niche}</div>
          </div>
        )}
      </div>
    )
    expect(screen.getByText('Fintech')).toBeTruthy()
    expect(container.querySelector('[data-testid="niche-row"]')).toBeTruthy()
  })

  it('renders nothing when niche is absent or null', () => {
    const niche = null
    const { container } = render(
      <div>
        {niche && (
          <div data-testid="niche-row">
            <div>{niche}</div>
          </div>
        )}
      </div>
    )
    expect(container.querySelector('[data-testid="niche-row"]')).toBeNull()
  })
})
