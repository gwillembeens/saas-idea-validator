import { useState, useEffect, useCallback, useRef } from 'react'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count ?? 0)
    } catch (err) {
      console.error('fetchUnreadCount error:', err)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data)
    } catch (err) {
      console.error('fetchNotifications error:', err)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setUnreadCount(0) // Optimistic zero
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.error('markAllRead error:', err)
    }
  }, [])

  useEffect(() => {
    // Fetch count immediately on mount
    fetchUnreadCount()

    // Start polling
    function start() {
      intervalRef.current = setInterval(fetchUnreadCount, 30000)
    }

    function stop() {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        start()
        fetchUnreadCount()
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchUnreadCount])

  return { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAllRead }
}
