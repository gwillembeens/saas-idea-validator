import { createSlice } from '@reduxjs/toolkit'

const validatorSlice = createSlice({
  name: 'validator',
  initialState: {
    idea: '',
    status: 'idle',   // idle | loading | streaming | done | error
    result: '',
    error: null,
    progress: 0,
  },
  reducers: {
    setIdea: (state, action) => { state.idea = action.payload },
    startValidation: (state) => { state.status = 'loading'; state.result = ''; state.error = null; state.progress = 0 },
    startStreaming: (state) => { state.status = 'streaming' },
    appendResult: (state, action) => { state.result += action.payload },
    finishValidation: (state) => { state.status = 'done'; state.progress = 100 },
    setError: (state, action) => { state.status = 'error'; state.error = action.payload },
    reset: (state) => { state.status = 'idle'; state.result = ''; state.error = null; state.progress = 0 },
    setProgress: (state, action) => { state.progress = action.payload },
  },
})

export const { setIdea, startValidation, startStreaming, appendResult, finishValidation, setError, reset, setProgress } = validatorSlice.actions
export default validatorSlice.reducer
