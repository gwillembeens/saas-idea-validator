import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { SearchBar } from './SearchBar'
import { Avatar } from '../ui/Avatar'
import { reset } from '../../store/slices/validatorSlice'

export function NavBar() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user, logout, openModal } = useAuth()
  const isHistoryPage = location.pathname === '/history'

  return (
    <header className="w-full">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* LEFT: Logo */}
        <Link
          to="/"
          onClick={() => dispatch(reset())}
          className="font-heading text-xl md:text-2xl text-pencil hover:text-accent transition-colors flex-shrink-0"
        >
          SaaS Validator
        </Link>

        {/* MIDDLE: Search bar — only shown on HistoryPage */}
        <div className="flex-1 max-w-md mx-4">
          <SearchBar isVisible={isHistoryPage} />
        </div>

        {/* RIGHT: Nav links + Auth */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/leaderboard"
            className="font-body text-lg text-blue hover:text-accent transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            to="/framework"
            className="font-body text-lg text-blue hover:text-accent transition-colors"
          >
            Framework
          </Link>
          {user ? (
            <>
              <Link
                to="/history"
                className="font-body text-lg text-blue hover:text-accent transition-colors"
              >
                History
              </Link>
              <Link
                to="/settings"
                className="font-body text-lg text-blue hover:text-accent transition-colors"
              >
                Settings
              </Link>
              <Button variant="secondary" onClick={logout}>
                Sign Out
              </Button>
              {user.username && (
                <Link to={`/profile/${user.username}`} aria-label="Your profile">
                  <Avatar
                    displayName={user.displayName}
                    username={user.username}
                    size="sm"
                  />
                </Link>
              )}
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
