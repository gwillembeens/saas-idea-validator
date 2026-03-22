import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { HomePage } from './pages/HomePage'
import { HistoryPage } from './pages/HistoryPage'
import { ResultPage } from './pages/ResultPage'
import { FrameworkPage } from './pages/FrameworkPage'
import { useAuth } from './hooks/useAuth'
import { setUser, setAuthModalMode, setShowAuthModal } from './store/slices/authSlice'

export default function App() {
  const dispatch = useDispatch()
  const { refreshSession, openModal } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // OAuth callback — backend redirected with accessToken in URL
    const accessToken = params.get('accessToken')
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        dispatch(setUser({ user: { id: payload.id, email: payload.email }, accessToken }))
      } catch {}
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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/history/:id" element={<ResultPage />} />
      <Route path="/framework" element={<FrameworkPage />} />
    </Routes>
  )
}
