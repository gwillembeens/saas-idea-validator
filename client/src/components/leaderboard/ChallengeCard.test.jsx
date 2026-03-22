import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import validatorReducer from '../../store/slices/validatorSlice'
import ChallengeCard from './ChallengeCard'

function makeStore() {
  return configureStore({ reducer: { validator: validatorReducer } })
}

function renderCard(props) {
  return render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <ChallengeCard {...props} />
      </MemoryRouter>
    </Provider>
  )
}

describe('ChallengeCard', () => {
  it('renders niche name', () => {
    renderCard({ niche: 'Fintech', topScore: 4.8, onTryNiche: vi.fn() })
    expect(screen.getByText('Fintech')).toBeInTheDocument()
  })

  it('renders score as X.X/5 when topScore is provided', () => {
    renderCard({ niche: 'Fintech', topScore: 4.8, onTryNiche: vi.fn() })
    expect(screen.getByText('4.8/5')).toBeInTheDocument()
  })

  it('renders "—" and "Be the first!" when topScore is null', () => {
    renderCard({ niche: 'PropTech', topScore: null, onTryNiche: vi.fn() })
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Be the first!')).toBeInTheDocument()
  })

  it('renders "Can you beat it?" label when score is present', () => {
    renderCard({ niche: 'Fintech', topScore: 3.5, onTryNiche: vi.fn() })
    expect(screen.getByText('Can you beat it?')).toBeInTheDocument()
  })

  it('renders "Try This Niche" button', () => {
    renderCard({ niche: 'Fintech', topScore: 4.8, onTryNiche: vi.fn() })
    expect(screen.getByRole('button', { name: /try this niche/i })).toBeInTheDocument()
  })

  it('calls onTryNiche when button is clicked', () => {
    const onTryNiche = vi.fn()
    renderCard({ niche: 'Fintech', topScore: 4.8, onTryNiche })
    fireEvent.click(screen.getByRole('button', { name: /try this niche/i }))
    expect(onTryNiche).toHaveBeenCalledTimes(1)
  })
})
