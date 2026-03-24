import { useEffect } from 'react'
import { Card } from '../ui/Card'
import { CommentsSection } from './CommentsSection'

export function CommentModal({ resultId, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pencil/40"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl mx-4">
        <Card decoration="tack" rotate={-1} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-pencil">Comments</h2>
            <button
              onClick={onClose}
              className="font-body text-lg text-pencil opacity-50 hover:opacity-100 transition-opacity leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <CommentsSection resultId={resultId} />
          </div>
        </Card>
      </div>
    </div>
  )
}
