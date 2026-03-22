import { useState, useEffect, useCallback } from 'react'

export function useHistoryResult(id) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/history/${id}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Result not found')
        throw new Error('Failed to load result')
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { result, loading, error, refetch }
}
