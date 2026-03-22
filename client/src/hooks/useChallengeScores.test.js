import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useChallengeScores } from './useChallengeScores'

const MOCK_TOP_SCORES = [
  { niche: 'Fintech', score: 4.8, count: 5 },
  { niche: 'Other', score: null, count: 0 },
]

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useChallengeScores', () => {
  it('fetches /api/leaderboard/top-per-niche on mount', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ topScores: MOCK_TOP_SCORES }),
    })
    renderHook(() => useChallengeScores())
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/leaderboard/top-per-niche')
    })
  })

  it('sets loading=true initially, false after response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ topScores: MOCK_TOP_SCORES }),
    })
    const { result } = renderHook(() => useChallengeScores())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('parses topScores from response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ topScores: MOCK_TOP_SCORES }),
    })
    const { result } = renderHook(() => useChallengeScores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.topScores).toEqual(MOCK_TOP_SCORES)
  })

  it('sets error on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useChallengeScores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })
})
