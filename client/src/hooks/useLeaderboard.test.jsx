import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { useLeaderboard } from './useLeaderboard'

const mockPage0 = {
  entries: [
    { id: '1', idea_text: 'Idea 1', scores: { weighted: 4.5 }, niche: 'Fintech', user_id: 'u1', author_username: null },
    { id: '2', idea_text: 'Idea 2', scores: { weighted: 3.8 }, niche: 'EdTech',  user_id: 'u2', author_username: 'bob' },
  ],
  total: 25,
  page: 0,
  hasMore: true,
}

const mockPage1 = {
  entries: [
    { id: '3', idea_text: 'Idea 3', scores: { weighted: 3.0 }, niche: 'Other', user_id: 'u3', author_username: null },
  ],
  total: 25,
  page: 1,
  hasMore: false,
}

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLeaderboard', () => {
  it('fetches page 0 on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockPage0 })

    const { result } = renderHook(() => useLeaderboard(), { wrapper })

    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.hasMore).toBe(true)
    expect(result.current.page).toBe(0)
  })

  it('appends items on loadMore', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPage0 })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPage1 })

    const { result } = renderHook(() => useLeaderboard(), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(2))

    await act(async () => { await result.current.loadMore() })
    expect(result.current.items.length).toBe(3)
    expect(result.current.hasMore).toBe(false)
  })

  it('sets error on fetch failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useLeaderboard(), { wrapper })
    await waitFor(() => expect(result.current.error).toBeTruthy())
  })

  it('does not loadMore when hasMore is false', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockPage0, hasMore: false }) })

    const { result } = renderHook(() => useLeaderboard(), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(2))

    const callsBefore = global.fetch.mock.calls.length
    await act(async () => { await result.current.loadMore() })
    expect(global.fetch.mock.calls.length).toBe(callsBefore)
  })
})
