import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

import { LeaderboardCard } from './LeaderboardCard'

function renderCard(props) {
  return render(
    <BrowserRouter>
      <LeaderboardCard {...props} />
    </BrowserRouter>
  )
}

const baseEntry = {
  id: 'abc123',
  idea_text: 'A fintech app that automates invoice reconciliation for SMBs',
  scores: { weighted: 4.2 },
  niche: 'Fintech',
  user_id: 'user-1',
  author_username: 'alice',
  created_at: '2026-03-22T10:00:00Z',
}

describe('LeaderboardCard', () => {
  it('renders idea text', () => {
    renderCard({ entry: baseEntry, rank: 1, isOwn: false })
    expect(screen.getByText(baseEntry.idea_text)).toBeInTheDocument()
  })

  it('renders author username when set', () => {
    renderCard({ entry: baseEntry, rank: 1, isOwn: false })
    const link = screen.getAllByText(/alice/)[0]
    expect(link).toBeInTheDocument()
  })

  it('renders Anonymous when author_username is null', () => {
    renderCard({ entry: { ...baseEntry, author_username: null }, rank: 1, isOwn: false })
    expect(screen.getByText(/Anonymous/)).toBeInTheDocument()
  })

  it('shows You badge when isOwn is true', () => {
    renderCard({ entry: baseEntry, rank: 1, isOwn: true })
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('does not show You badge when isOwn is false', () => {
    renderCard({ entry: baseEntry, rank: 1, isOwn: false })
    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })

  it('shows score', () => {
    renderCard({ entry: baseEntry, rank: 1, isOwn: false })
    const scoreText = screen.getAllByText(/4\.2\/5/)[0]
    expect(scoreText).toBeInTheDocument()
  })

  it('shows verdict label Promising for score 4.2', () => {
    renderCard({ entry: baseEntry, rank: 1, isOwn: false })
    const verdictTexts = screen.getAllByText('Promising')
    expect(verdictTexts.length).toBeGreaterThan(0)
  })

  it('author is a link when username is set', () => {
    renderCard({ entry: baseEntry, rank: 1, isOwn: false })
    const links = screen.getAllByRole('link', { name: /alice/ })
    expect(links[0]).toHaveAttribute('href', '/profile/alice')
  })

  it('author is not a link when username is null', () => {
    renderCard({ entry: { ...baseEntry, author_username: null }, rank: 1, isOwn: false })
    expect(screen.queryByRole('link', { name: /Anonymous/ })).not.toBeInTheDocument()
  })
})
