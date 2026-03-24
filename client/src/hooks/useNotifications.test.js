import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotifications } from './useNotifications'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  // Setup localStorage mock
  const store = {}
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => { store[key] = value },
      clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    },
    writable: true,
  })
  localStorage.setItem('token', 'test-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('useNotifications', () => {
  it('fetches unread count on mount', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 3 }),
    })

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(3)
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/unread-count', expect.any(Object))
  })

  it('fetches notifications list', async () => {
    const mockNotifications = [
      { event_type: 'like', result_id: 'uuid1', validation_title: 'Idea A', actor_count: 2 },
    ]
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 0 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotifications,
      })

    const { result } = renderHook(() => useNotifications())

    // Wait for initial mount fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Clear previous calls for clarity
    global.fetch.mockClear()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotifications,
    })

    await act(async () => {
      await result.current.fetchNotifications()
    })

    expect(result.current.notifications).toEqual(mockNotifications)
  })

  it('marks all as read and optimistically zeros count', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 5 }) })
      .mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => expect(result.current.unreadCount).toBe(5))

    await act(async () => {
      await result.current.markAllRead()
    })

    expect(result.current.unreadCount).toBe(0)
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/mark-read', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('returns zero unread count when no token in localStorage', async () => {
    localStorage.clear()

    const { result } = renderHook(() => useNotifications())

    expect(result.current.unreadCount).toBe(0)
    expect(result.current.notifications).toEqual([])
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('handles fetch error gracefully on unread count fetch', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useNotifications())

    // Should not throw, and unreadCount should remain 0
    await act(async () => {
      await new Promise(r => setTimeout(r, 50))
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it('handles fetch error gracefully on mark read', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 3 }) })
      .mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => expect(result.current.unreadCount).toBe(3))

    // markAllRead should optimistically set to 0 even if API fails
    await act(async () => {
      await result.current.markAllRead()
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it('sets unreadCount to 0 when response is missing count', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0)
    })
  })
})
