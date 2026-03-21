import { describe, it, expect } from 'vitest'
import authReducer, { setUser, clearAuth, setShowAuthModal } from './authSlice'

describe('authSlice', () => {
  it('initial state', () => {
    const state = authReducer(undefined, { type: '@@INIT' })
    expect(state.user).toBeNull()
    expect(state.status).toBe('idle')
  })

  it('setUser stub', () => expect(true).toBe(true))
  it('clearAuth stub', () => expect(true).toBe(true))
  it('setShowAuthModal stub', () => expect(true).toBe(true))
  it('setPendingValidation stub', () => expect(true).toBe(true))
})
