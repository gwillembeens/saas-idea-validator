import { useSelector } from 'react-redux'
import { AppShell } from '../components/layout/AppShell'
import { SignInButton } from '../components/auth/SignInButton'
import { AuthModal } from '../components/auth/AuthModal'
import { useAuth } from '../hooks/useAuth'

export function HistoryPage() {
  const user = useSelector(s => s.auth.user)
  const { openModal } = useAuth()

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20 relative">
          <header className="absolute top-4 right-4 md:top-6 md:right-6">
            <SignInButton />
          </header>

          <div className="w-full max-w-2xl text-center">
            <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-6">
              Your Validation History
            </h1>
            <p className="font-body text-lg md:text-xl text-pencil mb-12 leading-relaxed">
              Sign in to see your saved ideas and past validations.
            </p>
            <button
              onClick={() => openModal('login')}
              className="px-6 py-3 font-body text-lg bg-blue text-white rounded"
            >
              Sign In
            </button>
          </div>
        </div>
        <AuthModal />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">

        {/* Header with SignInButton */}
        <header className="absolute top-4 right-4 md:top-6 md:right-6">
          <SignInButton />
        </header>

        {/* Title */}
        <div className="w-full max-w-4xl text-center mb-12">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-4">
            Your Validation History
          </h1>
        </div>

        {/* Content will be rendered here by useHistory hook in 10-03 */}

        {/* Footer spacing */}
        <div className="mt-20 md:mt-24" />

      </div>

      {/* Auth Modal */}
      <AuthModal />
    </AppShell>
  )
}
