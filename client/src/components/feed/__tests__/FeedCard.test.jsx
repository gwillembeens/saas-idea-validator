import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { FeedCard } from '../FeedCard'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: null, openModal: vi.fn() }),
}))

const defaultProps = {
  id: 'abc-123',
  idea_text: 'A SaaS tool for automating invoice processing',
  scores: { phase1: 4, phase2: 3, phase3: 4, phase4: 3 },
  niche: 'Finance',
  user_id: 'user-1',
  author_username: 'testuser',
  created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2h ago
  like_count: 5,
  comment_count: 2,
}

function renderCard(props = {}) {
  return render(
    <BrowserRouter>
      <FeedCard {...defaultProps} {...props} />
    </BrowserRouter>
  )
}

describe('FeedCard', () => {
  it('renders author username', () => {
    renderCard()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('renders idea preview', () => {
    renderCard()
    expect(screen.getByText(/automating invoice/i)).toBeInTheDocument()
  })

  it('renders niche', () => {
    renderCard()
    expect(screen.getByText(/Finance/i)).toBeInTheDocument()
  })

  it('renders score badge', () => {
    const { container } = renderCard()
    // phase1*0.3 + phase2*0.25 + phase3*0.35 + phase4*0.1 = 3.6
    const scoreBadge = container.querySelector('.bg-postit')
    expect(scoreBadge).toBeInTheDocument()
    expect(scoreBadge.textContent).toContain('3.6')
    expect(scoreBadge.textContent).toContain('/5')
  })

  it('renders like count', () => {
    renderCard()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders comment count', () => {
    renderCard()
    expect(screen.getByText(/💬 2/)).toBeInTheDocument()
  })

  it('renders time ago', () => {
    renderCard()
    expect(screen.getByText(/2h ago/)).toBeInTheDocument()
  })

  it('shows Anonymous when no author_username', () => {
    renderCard({ author_username: null })
    expect(screen.getByText('Anonymous')).toBeInTheDocument()
  })

  it('navigates to result on click', () => {
    renderCard()
    fireEvent.click(screen.getByText(/automating invoice/i))
    expect(mockNavigate).toHaveBeenCalledWith('/history/abc-123')
  })
})
