import { useDispatch, useSelector } from 'react-redux'
import {
  setUser, setAuthLoading, setAuthError, clearAuth,
  setShowAuthModal, setAuthModalMode, setPendingValidation, setUserProfile,
} from '../store/slices/authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const { user, accessToken, status, error, showAuthModal, authModalMode, pendingValidation } =
    useSelector(s => s.auth)

  async function login(email, password) {
    dispatch(setAuthLoading())
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      dispatch(setUser({ user: data.user, accessToken: data.accessToken }))
      dispatch(setShowAuthModal(false))
      return true
    } catch (e) {
      dispatch(setAuthError(e.message))
      return false
    }
  }

  async function register(email, password) {
    dispatch(setAuthLoading())
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      dispatch(setAuthModalMode('login'))
      dispatch(setAuthError(null))
      return { success: true, message: data.message }
    } catch (e) {
      dispatch(setAuthError(e.message))
      return { success: false }
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    dispatch(clearAuth())
  }

  async function forgotPassword(email) {
    dispatch(setAuthLoading())
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      return { success: true, message: data.message }
    } catch (e) {
      dispatch(setAuthError(e.message))
      return { success: false }
    }
  }

  async function resetPassword(token, newPassword) {
    dispatch(setAuthLoading())
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Password reset failed')
      sessionStorage.removeItem('resetToken')
      dispatch(setAuthError(null))
      return { success: true, message: data.message || 'Password reset successful' }
    } catch (e) {
      dispatch(setAuthError(e.message))
      return { success: false, message: e.message }
    }
  }

  async function refreshSession() {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (!res.ok) return false
      const data = await res.json()
      dispatch(setUser({ user: data.user, accessToken: data.accessToken }))

      // Fetch display name + username for NavBar avatar and settings
      try {
        const meRes = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
          credentials: 'include',
        })
        if (meRes.ok) {
          const me = await meRes.json()
          dispatch(setUserProfile({ displayName: me.display_name, username: me.username }))
        }
      } catch {}

      return true
    } catch {
      return false
    }
  }

  return {
    user, accessToken, status, error, showAuthModal, authModalMode, pendingValidation,
    login, register, logout, forgotPassword, resetPassword, refreshSession,
    openModal: (mode = 'login') => {
      dispatch(setAuthModalMode(mode))
      dispatch(setShowAuthModal(true))
    },
    closeModal: () => dispatch(setShowAuthModal(false)),
    setPendingValidation: (val) => dispatch(setPendingValidation(val)),
  }
}
