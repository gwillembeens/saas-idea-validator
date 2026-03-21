import { createSlice } from '@reduxjs/toolkit'

const historySlice = createSlice({
  name: 'history',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | error
    hasMore: true,
    sort: 'date', // date | score
    cursor: null,
    error: null,
  },
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload
    },
    appendItems: (state, action) => {
      state.items.push(...action.payload)
    },
    setStatus: (state, action) => {
      state.status = action.payload
    },
    setSort: (state, action) => {
      state.sort = action.payload
      state.items = []
      state.cursor = null
    },
    setCursor: (state, action) => {
      state.cursor = action.payload
    },
    setHasMore: (state, action) => {
      state.hasMore = action.payload
    },
    removeItem: (state, action) => {
      const id = action.payload
      state.items = state.items.filter(item => item.id !== id)
    },
    updateItemTitle: (state, action) => {
      const { id, title } = action.payload
      const item = state.items.find(i => i.id === id)
      if (item) {
        item.title = title
      }
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const {
  setItems, appendItems, setStatus, setSort, setCursor, setHasMore, removeItem, updateItemTitle, setError,
} = historySlice.actions
export default historySlice.reducer
