import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { store } from '../store'

export function useLike(resultId, { initialLiked, initialCount, onAuthRequired } = {}) {
  const hasInitial = initialLiked !== undefined && initialCount !== undefined

  const [liked, setLiked] = useState(initialLiked ?? false)
  const [count, setCount] = useState(initialCount ?? 0)
  const [loading, setLoading] = useState(!hasInitial)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (hasInitial) return
    let cancelled = false

    fetch(`/api/results/${resultId}/like-status`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        setLiked(data.liked ?? false)
        setCount(data.count ?? 0)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [resultId, hasInitial])

  async function toggleLike() {
    const { user } = store.getState().auth
    if (!user) {
      if (onAuthRequired) onAuthRequired()
      return
    }

    // Optimistic update
    const prevLiked = liked
    const prevCount = count
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)
    setError(null)

    try {
      const res = await fetchWithAuth(`/api/results/${resultId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to toggle like')
      setLiked(data.liked)
      setCount(data.count)
    } catch (e) {
      setLiked(prevLiked)
      setCount(prevCount)
      setError(e.message)
    }
  }

  return { liked, count, loading, error, toggleLike }
}
