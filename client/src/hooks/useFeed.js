import { useState, useCallback, useEffect, useRef } from 'react'

const PAGE_SIZE = 20

export function useFeed() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const sentinelRef = useRef(null)

  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?page=${pageNum}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    let cancelled = false
    fetchPage(0).then(data => {
      if (cancelled || !data) return
      setItems(data.entries)
      setPage(0)
      setHasMore(data.hasMore)
    })
    return () => { cancelled = true }
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || error) return
    const nextPage = page + 1
    const data = await fetchPage(nextPage)
    if (!data) return
    setItems(prev => [...prev, ...data.entries])
    setPage(nextPage)
    setHasMore(data.hasMore)
  }, [loading, hasMore, error, page, fetchPage])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return { items, page, hasMore, loading, error, sentinelRef, loadMore }
}
