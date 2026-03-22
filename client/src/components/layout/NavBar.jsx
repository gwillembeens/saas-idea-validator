import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { SearchBar } from './SearchBar'

export function NavBar() {
  const location = useLocation()
  const { user, logout, openModal } = useAuth()
  const isHistoryPage = location.pathname === '/history'

  return (
    <header className="w-full">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* LEFT: Logo */}
        <Link
          to="/"
          className="font-heading text-xl md:text-2xl text-pencil hover:text-accent transition-colors flex-shrink-0"
        >
          SaaS Validator
        </Link>

        {/* MIDDLE: Search bar — only shown on HistoryPage */}
        <div className="flex-1 max-w-md mx-4">
          <SearchBar isVisible={isHistoryPage} />
        </div>

        {/* RIGHT: Auth actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <Link
                to="/history"
                className="font-body text-lg text-blue hover:text-accent transition-colors"
              >
                History
              </Link>
              <Button variant="secondary" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => openModal('login')}>
              Sign In
            </Button>
          )}
        </div>
      </div>

    </header>
  )
}
