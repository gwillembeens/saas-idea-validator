import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AppShell } from './components/layout/AppShell'
import { IdeaInput } from './components/validator/IdeaInput'
import { ResultsPanel } from './components/validator/ResultsPanel'
import { Arrow } from './components/decorative/Arrow'
import { AuthModal } from './components/auth/AuthModal'
import { SignInButton } from './components/auth/SignInButton'
import { useAuth } from './hooks/useAuth'
import { setUser, setAuthModalMode, setShowAuthModal } from './store/slices/authSlice'

export default function App() {
  const dispatch = useDispatch()
  const status = useSelector(s => s.validator.status)
  const result = useSelector(s => s.validator.result)
  const { refreshSession, openModal } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // OAuth callback — backend redirected with accessToken in URL
    const accessToken = params.get('accessToken')
    if (accessToken) {
      // Decode JWT payload (no verify needed — server already verified)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        dispatch(setUser({ user: { id: payload.id, email: payload.email }, accessToken }))
      } catch {}
      // Clean URL
      window.history.replaceState({}, '', '/')
      return
    }

    // Email verified redirect
    if (params.get('verified') === 'true') {
      openModal('login')
      window.history.replaceState({}, '', '/')
      return
    }

    // Password reset redirect — show reset form in modal
    const resetToken = params.get('reset')
    if (resetToken) {
      // Store token in sessionStorage, open modal in reset mode
      sessionStorage.setItem('resetToken', resetToken)
      dispatch(setAuthModalMode('reset'))
      dispatch(setShowAuthModal(true))
      window.history.replaceState({}, '', '/')
      return
    }

    // Auth error
    if (params.get('auth_error')) {
      openModal('login')
      window.history.replaceState({}, '', '/')
      return
    }

    // Normal session restore from httpOnly cookie
    refreshSession()
  }, [])

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">

        {/* Header with SignInButton */}
        <header className="absolute top-4 right-4 md:top-6 md:right-6">
          <SignInButton />
        </header>

        {/* Hero Section */}
        <div className="w-full max-w-2xl text-center mb-20 md:mb-24">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-6 leading-tight">
            Validate Your SaaS Idea
          </h1>
          <p className="font-body text-lg md:text-xl text-pencil leading-relaxed">
            Paste your startup idea and get an honest, investor-grade analysis against our
            30-step framework for building agent-native SaaS businesses.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-2xl mb-20 md:mb-24">
          <IdeaInput />
        </div>

        {/* Arrow decoration — hidden on mobile */}
        {status !== 'idle' && (
          <div className="hidden md:flex justify-center mb-12">
            <Arrow direction="down" />
          </div>
        )}

        {/* Results Section — only render when validation has started */}
        {status !== 'idle' && (
          <div className="w-full">
            <ResultsPanel />
          </div>
        )}

        {/* Footer spacing */}
        <div className="mt-20 md:mt-24" />

      </div>

      {/* Auth Modal */}
      <AuthModal />
    </AppShell>
  )
}
