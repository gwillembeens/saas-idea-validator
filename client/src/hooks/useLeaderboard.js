import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useLeaderboard() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const sentinelRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const currentNiche = searchParams.get('niche') || 'All'

  const fetchPage = useCallback(async (niche, pageNum) => {
    setLoading(true)
    setError(null)
    try {
      const nicheParam = niche === 'All' ? '' : niche
      const url = `/api/leaderboard?page=${pageNum}${nicheParam ? `&niche=${encodeURIComponent(nicheParam)}` : ''}`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      return await res.json()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Re-fetch from page 0 whenever niche changes
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const result = await fetchPage(currentNiche, 0)
      if (!cancelled && result) {
        setItems(result.entries)
        setHasMore(result.hasMore)
        setPage(0)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentNiche, fetchPage])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    const nextPage = page + 1
    const result = await fetchPage(currentNiche, nextPage)
    if (result) {
      setItems(prev => [...prev, ...result.entries])
      setPage(nextPage)
      setHasMore(result.hasMore)
    }
  }, [loading, hasMore, page, currentNiche, fetchPage])

  function setNiche(niche) {
    if (niche === 'All' || !niche) {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ niche }, { replace: true })
    }
  }

  return { items, page, hasMore, loading, error, sentinelRef, setNiche, loadMore, currentNiche }
}
