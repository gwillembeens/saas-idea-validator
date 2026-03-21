import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function SignInButton() {
  const { user, logout, openModal } = useAuth()

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          to="/history"
          className="font-body text-lg text-blue hover:text-accent transition-colors"
        >
          History
        </Link>
        <span className="font-body text-sm text-pencil hidden md:block">
          {user.email.split('@')[0]}
        </span>
        <Button variant="secondary" onClick={logout}>
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button variant="secondary" onClick={() => openModal('login')}>
      Sign In
    </Button>
  )
}
