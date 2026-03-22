import { useDispatch, useSelector } from 'react-redux'
import { clearRevisionCandidate } from '../../store/slices/validatorSlice'
import { fetchWithAuth } from '../../utils/fetchWithAuth'

export function RevisionModal({ resultId }) {
  const dispatch = useDispatch()
  const candidate = useSelector(s => s.validator.revisionCandidate)

  if (!candidate) return null

  async function handleConfirm() {
    try {
      await fetchWithAuth(`/api/history/${resultId}/parent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: candidate.id }),
      })
    } catch (err) {
      console.error('Link revision failed:', err)
    } finally {
      dispatch(clearRevisionCandidate())
    }
  }

  async function handleDismiss() {
    try {
      await fetchWithAuth(`/api/history/${resultId}/dismiss-revision`, {
        method: 'PATCH',
      })
    } catch (err) {
      console.error('Dismiss revision failed:', err)
    } finally {
      dispatch(clearRevisionCandidate())
    }
  }

  const parentScore = candidate.scores?.weighted?.toFixed(1)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(45, 45, 45, 0.5)' }}
    >
      <div
        className="bg-paper w-full max-w-md p-6 shadow-hardLg"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px', border: '2px solid #2d2d2d' }}
      >
        <h2 className="font-heading text-2xl text-pencil mb-3">Looks like a revision?</h2>
        <p className="font-body text-pencil text-lg mb-6">
          This idea looks similar to{' '}
          <span className="font-heading">"{candidate.title}"</span>
          {parentScore && (
            <span className="text-muted"> ({parentScore}/5)</span>
          )}
          . Link it as a revision?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleDismiss}
            className="font-body text-pencil px-4 py-2 border-2 border-pencil shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
          >
            New idea
          </button>
          <button
            onClick={handleConfirm}
            className="font-body text-paper bg-pencil px-4 py-2 border-2 border-pencil shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            Link as revision
          </button>
        </div>
      </div>
    </div>
  )
}
