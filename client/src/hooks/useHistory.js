import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setItems, appendItems, setStatus, setSort, setHasMore, removeItem, updateItemTitle, updateItemVisibility, setError,
} from '../store/slices/historySlice.js'
import { fetchWithAuth } from '../utils/fetchWithAuth.js'

export function useHistory() {
  const dispatch = useDispatch()
  const { items, status, hasMore, sort } = useSelector(s => s.history)

  async function fetchHistory() {
    dispatch(setStatus('loading'))
    try {
      const res = await fetchWithAuth(`/api/history?sort=${sort}`)
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      dispatch(setItems(data.items))
      dispatch(setHasMore(data.hasMore))
      dispatch(setStatus('idle'))
    } catch (err) {
      dispatch(setError(err.message))
      dispatch(setStatus('error'))
    }
  }

  async function loadMore() {
    if (!hasMore || status === 'loading') return
    dispatch(setStatus('loading'))
    try {
      const res = await fetchWithAuth(`/api/history?sort=${sort}`)
      if (!res.ok) throw new Error('Failed to load more')
      const data = await res.json()
      dispatch(appendItems(data.items))
      dispatch(setHasMore(data.hasMore))
      dispatch(setStatus('idle'))
    } catch (err) {
      dispatch(setError(err.message))
      dispatch(setStatus('error'))
    }
  }

  async function deleteItem(id) {
    try {
      const res = await fetchWithAuth(`/api/history/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      dispatch(removeItem(id))
    } catch (err) {
      dispatch(setError(err.message))
    }
  }

  async function renameItem(id, title) {
    try {
      const res = await fetchWithAuth(`/api/history/${id}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed to rename')
      const data = await res.json()
      dispatch(updateItemTitle({ id, title: data.title }))
    } catch (err) {
      dispatch(setError(err.message))
    }
  }

  function toggleSort() {
    const newSort = sort === 'date' ? 'score' : 'date'
    dispatch(setSort(newSort))
  }

  const toggleItemVisibility = useCallback(async (id, currentIsPublic) => {
    const newIsPublic = !currentIsPublic
    dispatch(updateItemVisibility({ id, is_public: newIsPublic }))
    try {
      const res = await fetchWithAuth(`/api/history/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: newIsPublic }),
      })
      if (!res.ok) {
        dispatch(updateItemVisibility({ id, is_public: currentIsPublic }))
      }
    } catch {
      dispatch(updateItemVisibility({ id, is_public: currentIsPublic }))
    }
  }, [dispatch])

  return { items, status, hasMore, sort, fetchHistory, loadMore, deleteItem, renameItem, toggleSort, toggleItemVisibility }
}
