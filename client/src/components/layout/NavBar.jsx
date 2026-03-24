import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { Button } from '../ui/Button'
import { SearchBar } from './SearchBar'
import { Avatar } from '../ui/Avatar'
import { NotificationDropdown } from '../notifications/NotificationDropdown'
import { reset } from '../../store/slices/validatorSlice'

export function NavBar() {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const dispatch = useDispatch()
  const location = useLocation()
  const { user, logout, openModal } = useAuth()
  const isHistoryPage = location.pathname === '/history'
  const { unreadCount, notifications, fetchNotifications, fetchUnreadCount, markAllRead } = useNotifications()

  useEffect(() => {
    fetchUnreadCount()
  }, [location.pathname, fetchUnreadCount])

  const handleBellClick = async () => {
    await markAllRead()
    await fetchNotifications()
    setShowNotificationDropdown(prev => !prev)
  }

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

              {/* Bell icon with notification dropdown */}
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="relative inline-flex items-center justify-center p-2 text-blue hover:text-accent transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={24} strokeWidth={2.5} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold w-5 h-5 flex items-center justify-center text-center"
                      style={{ borderRadius: '50%' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotificationDropdown && (
                  <NotificationDropdown
                    notifications={notifications}
                    onMarkAllRead={markAllRead}
                    onClose={() => setShowNotificationDropdown(false)}
                  />
                )}
              </div>

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
            <>
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
              <Button variant="secondary" onClick={() => openModal('login')}>
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>

    </header>
  )
}
