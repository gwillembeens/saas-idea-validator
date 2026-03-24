import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFeed } from '../useFeed'

const mockPage0 = {
  entries: [
    { id: '1', idea_text: 'Idea 1', scores: { phase1: 4, phase2: 3, phase3: 4, phase4: 3 }, niche: 'Fintech', user_id: 'u1', author_username: null },
    { id: '2', idea_text: 'Idea 2', scores: { phase1: 3, phase2: 4, phase3: 3, phase4: 2 }, niche: 'EdTech', user_id: 'u2', author_username: 'bob' },
  ],
  total: 25,
  page: 0,
  hasMore: true,
}

const mockPage1 = {
  entries: [
    { id: '3', idea_text: 'Idea 3', scores: { phase1: 3, phase2: 2, phase3: 3, phase4: 2 }, niche: 'Other', user_id: 'u3', author_username: null },
  ],
  total: 25,
  page: 1,
  hasMore: false,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('IntersectionObserver', vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  })))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFeed', () => {
  it('fetches feed on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockPage0 })

    const { result } = renderHook(() => useFeed())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledWith('/api/feed?page=0', expect.objectContaining({ credentials: 'include' }))
  })

  it('sets hasMore from response', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ entries: [], total: 0, page: 0, hasMore: false }) })

    const { result } = renderHook(() => useFeed())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasMore).toBe(false)
  })

  it('sets error on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useFeed())

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
