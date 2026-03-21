import { createSlice } from '@reduxjs/toolkit'

const validatorSlice = createSlice({
  name: 'validator',
  initialState: {
    idea: '',
    status: 'idle',   // idle | loading | streaming | done | error
    result: '',
    error: null,
  },
  reducers: {
    setIdea: (state, action) => { state.idea = action.payload },
    startValidation: (state) => { state.status = 'loading'; state.result = ''; state.error = null },
    startStreaming: (state) => { state.status = 'streaming' },
    appendResult: (state, action) => { state.result += action.payload },
    finishValidation: (state) => { state.status = 'done' },
    setError: (state, action) => { state.status = 'error'; state.error = action.payload },
    reset: (state) => { state.status = 'idle'; state.result = ''; state.error = null },
  },
})

export const { setIdea, startValidation, startStreaming, appendResult, finishValidation, setError, reset } = validatorSlice.actions
export default validatorSlice.reducer
