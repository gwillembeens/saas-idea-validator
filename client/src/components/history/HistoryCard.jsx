import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { NichePill } from '../ui/NichePill'

function getVerdictColor(weighted) {
  if (weighted >= 4.5) return 'bg-green-100 border-green-400'
  if (weighted >= 3.5) return 'bg-yellow-100 border-yellow-400'
  if (weighted >= 2.5) return 'bg-orange-100 border-orange-400'
  return 'bg-red-100 border-red-400'
}

function getVerdictLabel(weighted) {
  if (weighted >= 4.5) return '🟢 Strong Signal'
  if (weighted >= 3.5) return '🟡 Promising'
  if (weighted >= 2.5) return '🟠 Needs Work'
  return '🔴 Too Vague'
}

export function HistoryCard({ item, onDelete }) {
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const weighted = item.scores?.weighted || 0
  const ideaSnippet = item.idea_text.substring(0, 100).replace(/\n/g, ' ') + (item.idea_text.length > 100 ? '...' : '')
  const createdDate = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const handleCardClick = () => navigate(`/history/${item.id}`)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(item.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <Card
        decoration="tape"
        rotate={0}
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleCardClick}
      >
        {/* Title */}
        <div className="mb-3">
          <h3 className="font-heading text-xl text-pencil">
            {item.title}
          </h3>
        </div>

        {/* Idea snippet */}
        <p className="font-body text-sm text-pencil opacity-70 mb-4 leading-relaxed">
          {ideaSnippet}
        </p>

        {/* Footer: verdict, niche, date, delete */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div
              className={`px-3 py-1 font-body text-xs rounded border ${getVerdictColor(weighted)}`}
            >
              {getVerdictLabel(weighted)} ({weighted}/5)
            </div>

            {/* Niche pill — hidden on mobile, visible md+ (D-17) */}
            {item.niche && (
              <NichePill niche={item.niche} size="sm" className="hidden md:inline-flex" />
            )}

            <span className="font-body text-xs text-pencil opacity-50">
              {createdDate}
            </span>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className="p-1 hover:opacity-70 transition"
            aria-label="Delete result"
          >
            <Trash2 size={18} className="text-accent" strokeWidth={2.5} />
          </button>
        </div>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-pencil/40 flex items-center justify-center z-50">
          <Card decoration="none" rotate={0} className="max-w-sm w-11/12 mx-4">
            <div className="flex flex-col gap-6 p-2">
              <div>
                <h2 className="font-heading text-2xl text-pencil mb-2">Delete result?</h2>
                <p className="font-body text-lg text-pencil opacity-70">
                  This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
