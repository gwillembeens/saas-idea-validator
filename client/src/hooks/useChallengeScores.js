import { useState, useEffect } from 'react'

export function useChallengeScores() {
  const [topScores, setTopScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchTopScores() {
      try {
        const res = await fetch('/api/leaderboard/top-per-niche')
        if (!res.ok) throw new Error('Failed to fetch top scores')
        const data = await res.json()
        if (!cancelled) {
          setTopScores(data.topScores)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    fetchTopScores()
    return () => { cancelled = true }
  }, [])

  return { topScores, loading, error }
}
