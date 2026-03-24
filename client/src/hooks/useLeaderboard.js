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
  const currentSort = searchParams.get('sort') || 'score'

  const fetchPage = useCallback(async (niche, pageNum, sort) => {
    setLoading(true)
    setError(null)
    try {
      const nicheParam = niche === 'All' ? '' : niche
      const url = `/api/leaderboard?page=${pageNum}${nicheParam ? `&niche=${encodeURIComponent(nicheParam)}` : ''}${sort && sort !== 'score' ? `&sort=${encodeURIComponent(sort)}` : ''}`
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

  // Re-fetch from page 0 whenever niche or sort changes
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const result = await fetchPage(currentNiche, 0, currentSort)
      if (!cancelled && result) {
        setItems(result.entries)
        setHasMore(result.hasMore)
        setPage(0)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentNiche, currentSort, fetchPage])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || error) return
    const nextPage = page + 1
    const result = await fetchPage(currentNiche, nextPage, currentSort)
    if (result) {
      setItems(prev => [...prev, ...result.entries])
      setPage(nextPage)
      setHasMore(result.hasMore)
    }
  }, [loading, hasMore, page, currentNiche, currentSort, fetchPage])

  function setNiche(niche) {
    const params = {}
    if (niche !== 'All' && niche) params.niche = niche
    if (currentSort !== 'score') params.sort = currentSort
    setSearchParams(params, { replace: true })
  }

  function setSort(sort) {
    const params = {}
    if (currentNiche !== 'All') params.niche = currentNiche
    if (sort !== 'score') params.sort = sort
    setSearchParams(params, { replace: true })
  }

  return { items, page, hasMore, loading, error, sentinelRef, setNiche, setSort, loadMore, currentNiche, currentSort }
}
