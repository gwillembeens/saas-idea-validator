import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/TextInput'
import { useAuth } from '../../hooks/useAuth'
import { useValidate } from '../../hooks/useValidate'
import { setAuthError } from '../../store/slices/authSlice'

export function AuthModal() {
  const dispatch = useDispatch()
  const { showAuthModal, authModalMode, error, status, login, register, forgotPassword, resetPassword, closeModal, openModal, pendingValidation, setPendingValidation } = useAuth()
  const { validate } = useValidate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!showAuthModal) return null

  const isLoading = status === 'loading'

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMsg('')
    if (authModalMode === 'login') {
      const success = await login(email, password)
      if (success && pendingValidation) {
        setPendingValidation(false)
        validate()
      }
    } else if (authModalMode === 'register') {
      const result = await register(email, password)
      if (result.success) setSuccessMsg(result.message)
    } else if (authModalMode === 'forgot') {
      const result = await forgotPassword(email)
      if (result.success) setSuccessMsg(result.message)
    } else if (authModalMode === 'reset') {
      if (!password || !confirmPassword) {
        setSuccessMsg('')
        return
      }
      if (password !== confirmPassword) {
        dispatch(setAuthError('Passwords do not match'))
        return
      }
      const token = sessionStorage.getItem('resetToken')
      const result = await resetPassword(token, password)
      if (result.success) {
        setSuccessMsg('Password reset! Redirecting to login...')
        setPassword('')
        setConfirmPassword('')
        setTimeout(() => openModal('login'), 2000)
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pencil/40"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className="w-full max-w-md mx-4">
        <Card decoration="tack" rotate={-1} className="w-full">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 font-body text-pencil text-xl hover:text-accent"
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="font-heading text-3xl text-pencil mb-6 text-center">
            {authModalMode === 'login' && 'Sign In'}
            {authModalMode === 'register' && 'Create Account'}
            {authModalMode === 'forgot' && 'Reset Password'}
            {authModalMode === 'reset' && 'Set New Password'}
          </h2>

          {error && (
            <p className="font-body text-accent text-sm mb-4 text-center">{error}</p>
          )}
          {successMsg && (
            <p className="font-body text-blue text-sm mb-4 text-center">{successMsg}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {authModalMode !== 'reset' && (
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            )}
            {authModalMode !== 'forgot' && authModalMode !== 'reset' && (
              <TextInput
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                disabled={isLoading}
              />
            )}
            {authModalMode === 'reset' && (
              <>
                <TextInput
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={isLoading}
                />
                <TextInput
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
              </>
            )}
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? '...' : authModalMode === 'login' ? 'Sign In' : authModalMode === 'register' ? 'Create Account' : authModalMode === 'forgot' ? 'Send Reset Link' : 'Reset Password'}
            </Button>
          </form>

          {authModalMode !== 'forgot' && authModalMode !== 'reset' && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-muted" />
                <span className="font-body text-sm text-pencil/60">or</span>
                <div className="flex-1 h-px bg-muted" />
              </div>
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-2 font-body text-lg text-pencil border-2 border-pencil px-4 py-2 hover:bg-muted transition-colors shadow-hard"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                Continue with Google
              </a>
              <a
                href="/api/auth/github"
                className="flex items-center justify-center gap-2 font-body text-lg text-pencil border-2 border-pencil px-4 py-2 hover:bg-muted transition-colors shadow-hard"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                Continue with GitHub
              </a>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 text-center">
            {authModalMode === 'login' && (
              <>
                <button onClick={() => openModal('register')} className="font-body text-sm text-blue underline">
                  No account? Register
                </button>
                <button onClick={() => openModal('forgot')} className="font-body text-sm text-pencil underline">
                  Forgot password?
                </button>
              </>
            )}
            {authModalMode === 'register' && (
              <button onClick={() => openModal('login')} className="font-body text-sm text-blue underline">
                Already have an account? Sign in
              </button>
            )}
            {(authModalMode === 'forgot' || authModalMode === 'reset') && (
              <button onClick={() => openModal('login')} className="font-body text-sm text-blue underline">
                Back to sign in
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
