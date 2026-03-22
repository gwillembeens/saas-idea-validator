import { createSlice, createSelector } from '@reduxjs/toolkit'

const historySlice = createSlice({
  name: 'history',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | error
    hasMore: true,
    sort: 'date', // date | score
    cursor: null,
    error: null,
    searchTerm: '',
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
    updateItemVisibility: (state, action) => {
      const { id, is_public } = action.payload
      const item = state.items.find(i => i.id === id)
      if (item) {
        item.is_public = is_public
      }
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
    },
  },
})

export const {
  setItems, appendItems, setStatus, setSort, setCursor, setHasMore, removeItem, updateItemTitle, updateItemVisibility, setError, setSearchTerm,
} = historySlice.actions

export const selectFilteredHistory = createSelector(
  (s) => s.history.items,
  (s) => s.history.searchTerm,
  (items, searchTerm) => {
    if (!searchTerm) return items
    const lower = searchTerm.toLowerCase()
    return items.filter(item =>
      (item.title || '').toLowerCase().includes(lower) ||
      (item.idea_text || item.idea || '').toLowerCase().includes(lower)
    )
  }
)

export default historySlice.reducer
