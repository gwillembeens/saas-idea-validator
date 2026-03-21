import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,              // null | { id, email }
    accessToken: null,       // short-lived JWT, in memory only
    status: 'idle',          // idle | loading | authenticated | error
    error: null,
    showAuthModal: false,
    authModalMode: 'login',  // login | register | forgot
    pendingValidation: false, // true when user clicked Validate before logging in
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.status = 'authenticated'
      state.error = null
    },
    setAuthLoading: (state) => {
      state.status = 'loading'
      state.error = null
    },
    setAuthError: (state, action) => {
      state.status = 'error'
      state.error = action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.accessToken = null
      state.status = 'idle'
      state.error = null
    },
    setShowAuthModal: (state, action) => {
      state.showAuthModal = action.payload
    },
    setAuthModalMode: (state, action) => {
      state.authModalMode = action.payload
      state.error = null
    },
    setPendingValidation: (state, action) => {
      state.pendingValidation = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setUser, setAuthLoading, setAuthError, clearAuth,
  setShowAuthModal, setAuthModalMode, setPendingValidation, clearError,
} = authSlice.actions

export default authSlice.reducer
