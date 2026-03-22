import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import validatorReducer from '../../store/slices/validatorSlice'
import ChallengeSection from './ChallengeSection'

vi.mock('../../hooks/useChallengeScores')
import { useChallengeScores } from '../../hooks/useChallengeScores'

const ALL_NICHES = ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'HRTech', 'Other']
const MOCK_TOP_SCORES = ALL_NICHES.map(niche => ({ niche, score: null, count: 0 }))

function makeStore() {
  return configureStore({ reducer: { validator: validatorReducer } })
}

function renderSection() {
  return render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <ChallengeSection />
      </MemoryRouter>
    </Provider>
  )
}

describe('ChallengeSection', () => {
  it('renders 8 cards after fetch resolves', () => {
    useChallengeScores.mockReturnValue({ topScores: MOCK_TOP_SCORES, loading: false, error: null })
    renderSection()
    const buttons = screen.getAllByRole('button', { name: /try this niche/i })
    expect(buttons).toHaveLength(8)
  })

  it('shows loading skeleton while fetching', () => {
    useChallengeScores.mockReturnValue({ topScores: [], loading: true, error: null })
    renderSection()
    expect(screen.queryAllByRole('button', { name: /try this niche/i })).toHaveLength(0)
  })

  it('handles API error gracefully — shows error message, no crash', () => {
    useChallengeScores.mockReturnValue({ topScores: [], loading: false, error: 'Network error' })
    renderSection()
    expect(screen.getByText(/could not load challenge scores/i)).toBeInTheDocument()
  })

  it('passes correct niche to each ChallengeCard', () => {
    useChallengeScores.mockReturnValue({ topScores: MOCK_TOP_SCORES, loading: false, error: null })
    renderSection()
    expect(screen.getByText('Fintech')).toBeInTheDocument()
    expect(screen.getByText('PropTech')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })
})
