import { configureStore } from '@reduxjs/toolkit'
import validatorReducer from './slices/validatorSlice.js'

export const store = configureStore({
  reducer: {
    validator: validatorReducer,
  },
})
