import { configureStore } from '@reduxjs/toolkit'
import validatorReducer from './slices/validatorSlice.js'
import authReducer from './slices/authSlice.js'

export const store = configureStore({
  reducer: {
    validator: validatorReducer,
    auth: authReducer,
  },
})
