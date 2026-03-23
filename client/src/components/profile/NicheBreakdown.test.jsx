import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NicheBreakdown } from './NicheBreakdown'

describe('NicheBreakdown', () => {
  test('renders nothing when null', () => {
    const { container } = render(<NicheBreakdown nicheBreakdown={null} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when empty array', () => {
    const { container } = render(<NicheBreakdown nicheBreakdown={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders niche rows when populated', () => {
    const data = [
      { niche: 'SaaS', count: 5 },
      { niche: 'E-commerce', count: 2 },
    ]
    render(<NicheBreakdown nicheBreakdown={data} />)
    expect(screen.getByText('5 validations')).toBeTruthy()
    expect(screen.getByText('2 validations')).toBeTruthy()
  })

  test('uses singular "validation" for count of 1', () => {
    render(<NicheBreakdown nicheBreakdown={[{ niche: 'SaaS', count: 1 }]} />)
    expect(screen.getByText('1 validation')).toBeTruthy()
  })

  test('top niche bar has 100% width', () => {
    const { container } = render(
      <NicheBreakdown nicheBreakdown={[
        { niche: 'SaaS', count: 5 },
        { niche: 'E-commerce', count: 2 },
      ]} />
    )
    const bars = container.querySelectorAll('.bg-pencil')
    expect(bars[0].style.width).toBe('100%')
  })

  test('second niche bar reflects relative count', () => {
    const { container } = render(
      <NicheBreakdown nicheBreakdown={[
        { niche: 'SaaS', count: 4 },
        { niche: 'E-commerce', count: 2 },
      ]} />
    )
    const bars = container.querySelectorAll('.bg-pencil')
    expect(bars[1].style.width).toBe('50%')
  })
})
