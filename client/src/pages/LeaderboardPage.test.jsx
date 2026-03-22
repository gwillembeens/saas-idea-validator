import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../store/slices/authSlice'

vi.mock('../hooks/useLeaderboard', () => ({
  useLeaderboard: () => ({
    items: [],
    page: 0,
    hasMore: false,
    loading: false,
    error: null,
    sentinelRef: { current: null },
    setNiche: vi.fn(),
    loadMore: vi.fn(),
    currentNiche: 'All',
  }),
}))

vi.mock('../hooks/useChallengeScores', () => ({
  useChallengeScores: () => ({
    topScores: [
      { niche: 'Fintech', score: 4.8, count: 5 },
      { niche: 'Logistics', score: null, count: 0 },
      { niche: 'Creator Economy', score: 3.9, count: 2 },
      { niche: 'PropTech', score: null, count: 0 },
      { niche: 'HealthTech', score: 4.2, count: 3 },
      { niche: 'EdTech', score: null, count: 0 },
      { niche: 'HRTech', score: 3.5, count: 1 },
      { niche: 'Other', score: null, count: 0 },
    ],
    loading: false,
    error: null,
  }),
}))

import { LeaderboardPage } from './LeaderboardPage'

const makeStore = (user = null) =>
  configureStore({ reducer: { auth: authReducer }, preloadedState: { auth: { user } } })

function renderPage(user = null) {
  return render(
    <Provider store={makeStore(user)}>
      <BrowserRouter>
        <LeaderboardPage />
      </BrowserRouter>
    </Provider>
  )
}

describe('LeaderboardPage', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument()
  })

  it('renders All niche pill', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
  })

  it('renders Fintech niche pill', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Fintech' })).toBeInTheDocument()
  })

  it('shows unauthenticated CTA when no user', () => {
    renderPage(null)
    expect(screen.getByText(/Think yours can beat these/)).toBeInTheDocument()
  })

  it('hides unauthenticated CTA when logged in', () => {
    renderPage({ id: 'user-1', email: 'test@test.com' })
    expect(screen.queryByText(/Think yours can beat these/)).not.toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    renderPage()
    expect(screen.getByText(/No validations yet/)).toBeInTheDocument()
  })

  it('renders ChallengeSection between CTA banner and niche filter pills', () => {
    renderPage(null)
    expect(screen.getByText('Beat the Leaderboard')).toBeInTheDocument()
  })
})
