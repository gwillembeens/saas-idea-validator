import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '../../store'
import { FeedPage } from '../FeedPage'
import { vi } from 'vitest'

// Mock useFeed hook
vi.mock('../../hooks/useFeed', () => ({
  useFeed: () => ({
    items: [],
    hasMore: false,
    loading: false,
    error: null,
    sentinelRef: { current: null },
    loadMore: vi.fn(),
  }),
}))

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    </Provider>
  )
}

describe('FeedPage', () => {
  it('renders Feed heading', () => {
    mockUseAuth.mockReturnValue({ user: null, openModal: vi.fn() })
    renderPage()
    expect(screen.getByRole('heading', { name: 'Feed', level: 1 })).toBeInTheDocument()
  })

  it('shows Trending label when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null, openModal: vi.fn() })
    renderPage()
    expect(screen.getByText(/Trending/)).toBeInTheDocument()
  })

  it('shows Personalised label when logged in', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', username: 'bob' }, openModal: vi.fn() })
    renderPage()
    expect(screen.getByText(/Personalised for you/)).toBeInTheDocument()
  })

  it('shows CTA banner when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null, openModal: vi.fn() })
    renderPage()
    expect(screen.getByText(/Sign in to personalise/)).toBeInTheDocument()
  })

  it('does NOT show CTA banner when logged in', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', username: 'bob' }, openModal: vi.fn() })
    renderPage()
    expect(screen.queryByText(/Sign in to personalise/)).not.toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    mockUseAuth.mockReturnValue({ user: null, openModal: vi.fn() })
    renderPage()
    expect(screen.getByText(/No validations yet/)).toBeInTheDocument()
  })
})
