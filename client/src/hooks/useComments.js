import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../utils/fetchWithAuth'

export function useComments(resultId, { onAuthRequired } = {}) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!resultId) return
    let cancelled = false
    setLoading(true)

    fetch(`/api/results/${resultId}/comments`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        setComments(Array.isArray(data) ? data : [])
      })
      .catch(e => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [resultId])

  async function addComment(body) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetchWithAuth(`/api/results/${resultId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.status === 401) {
        if (onAuthRequired) onAuthRequired()
        return false
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post comment')
      setComments(prev => [...prev, { ...data, replies: [] }])
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function addReply(parentId, body) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetchWithAuth(`/api/comments/${parentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.status === 401) {
        if (onAuthRequired) onAuthRequired()
        return false
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post reply')
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), data] }
          : c
      ))
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteComment(id) {
    setError(null)
    try {
      const res = await fetchWithAuth(`/api/comments/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete comment')
      // Remove root comment or reply
      setComments(prev =>
        prev
          .filter(c => c.id !== id)
          .map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== id) }))
      )
    } catch (e) {
      setError(e.message)
    }
  }

  return { comments, loading, error, submitting, addComment, addReply, deleteComment }
}
