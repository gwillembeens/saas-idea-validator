import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppShell } from '../components/layout/AppShell'
import { AuthModal } from '../components/auth/AuthModal'
import { Card } from '../components/ui/Card'
import { ScoreBar } from '../components/ui/ScoreBar'
import { IdeaSummaryCard } from '../components/validator/IdeaSummaryCard'
import { CommentaryCard } from '../components/validator/CommentaryCard'
import { VerdictCard } from '../components/validator/VerdictCard'
import { TitleHeader } from '../components/validator/TitleHeader'
import { ActionButtons } from '../components/validator/ActionButtons'
import { DeleteConfirmModal } from '../components/validator/DeleteConfirmModal'
import { NichePill } from '../components/ui/NichePill'
import { parseSections } from '../utils/parseSections'
import { parseScores } from '../utils/parseResult'
import { getVerdict } from '../constants/verdictColors'
import { setIdea } from '../store/slices/validatorSlice'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { useHistoryResult } from '../hooks/useHistoryResult'

const PHASE_LABELS = [
  { key: 'phase1', label: '1. Market & Niche', weight: '30%' },
  { key: 'phase2', label: '2. Content & Distribution', weight: '25%' },
  { key: 'phase3', label: '3. Product & Agent Architecture', weight: '35%' },
  { key: 'phase4', label: '4. Pricing & Moat', weight: '10%' },
]

export function ResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)

  const { result, loading, error, refetch } = useHistoryResult(id)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)
  const [isLinkingRevision, setIsLinkingRevision] = useState(false)
  const [isDismissingRevision, setIsDismissingRevision] = useState(false)

  const handleTitleSave = async (newTitle) => {
    if (!newTitle || newTitle.trim() === result.title) {
      setIsEditingTitle(false)
      return
    }
    setIsSavingTitle(true)
    try {
      const res = await fetchWithAuth(`/api/history/${id}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (res.ok) {
        await refetch()
      }
    } finally {
      setIsSavingTitle(false)
      setIsEditingTitle(false)
    }
  }

  const handleRevalidate = () => {
    if (result) {
      dispatch(setIdea(result.idea_text))
      navigate('/')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/history/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      navigate('/history')
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleToggleVisibility = async () => {
    if (!result) return
    setIsTogglingVisibility(true)
    try {
      const res = await fetchWithAuth(`/api/history/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !result.is_public }),
      })
      await refetch()
    } catch (err) {
      console.error(err)
      await refetch()
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  const handleLinkRevision = async () => {
    if (!result?.suggested_parent_id) return
    setIsLinkingRevision(true)
    try {
      await fetchWithAuth(`/api/history/${id}/parent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: result.suggested_parent_id }),
      })
      await refetch()
    } catch (err) {
      console.error('Link revision failed:', err)
    } finally {
      setIsLinkingRevision(false)
    }
  }

  const handleDismissRevision = async () => {
    setIsDismissingRevision(true)
    try {
      await fetchWithAuth(`/api/history/${id}/dismiss-revision`, {
        method: 'PATCH',
      })
      await refetch()
    } catch (err) {
      console.error('Dismiss revision failed:', err)
    } finally {
      setIsDismissingRevision(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <p className="font-body text-lg text-pencil">Loading...</p>
        </div>
      </AppShell>
    )
  }

  if (error && !result) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <h1 className="font-heading text-5xl text-pencil mb-4">Not Found</h1>
          <p className="font-body text-lg text-pencil">{error}</p>
          <a href="/" className="mt-6 text-blue font-body underline">← Back Home</a>
        </div>
      </AppShell>
    )
  }

  const scores = result?.scores || parseScores(result?.markdown_result)
  const sections = parseSections(result?.markdown_result)
  const weighted = scores?.weighted || 0
  const verdict = weighted > 0 ? getVerdict(weighted) : null
  const niche = result?.niche

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">

        <TitleHeader
          result={result}
          isEditingTitle={isEditingTitle}
          editingTitle={editingTitle}
          isSavingTitle={isSavingTitle}
          onEditStart={() => { setEditingTitle(result.title); setIsEditingTitle(true) }}
          onEditCancel={() => setIsEditingTitle(false)}
          onEditSave={handleTitleSave}
        />

        {(verdict || niche) && (
          <div className="mb-8 flex flex-wrap justify-center items-center gap-3">
            {verdict && (
              <div
                className="inline-flex items-center gap-2 px-6 py-3 font-heading text-pencil text-xl shadow-hard"
                style={{
                  backgroundColor: verdict.bg,
                  border: `2px solid ${verdict.border}`,
                  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                  transform: 'rotate(-1deg)',
                }}
              >
                <span>{verdict.emoji}</span>
                <span>{verdict.label}</span>
                <span className="font-body text-base opacity-60">({weighted.toFixed(1)}/5)</span>
              </div>
            )}
            {result?.parent_scores && scores && scores.weighted > result.parent_scores.weighted && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 font-heading text-pencil text-lg shadow-hard"
                style={{
                  backgroundColor: '#d1fae5',
                  border: '2px solid #6ee7b7',
                  borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
                  transform: 'rotate(1deg)',
                }}
              >
                ↑ Improved
              </div>
            )}
            <NichePill niche={niche} />
          </div>
        )}

        {result?.suggested_parent_id && !result?.parent_id && result?.isOwner && (
          <div
            className="w-full max-w-2xl mb-4 px-4 py-3 flex flex-wrap justify-between items-center gap-3"
            style={{
              backgroundColor: '#fef9c3',
              border: '2px solid #fde047',
              borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
            }}
          >
            <p className="font-body text-pencil text-base">
              Looks like a revision of{' '}
              <span className="font-heading">"{result.suggested_parent_title}"</span>. Link it?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDismissRevision}
                disabled={isDismissingRevision}
                className="font-body text-pencil text-sm px-3 py-1 border-2 border-pencil shadow-hardSm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
                style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
              >
                Not a revision
              </button>
              <button
                onClick={handleLinkRevision}
                disabled={isLinkingRevision}
                className="font-body text-paper bg-pencil text-sm px-3 py-1 border-2 border-pencil shadow-hardSm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                Link as revision
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl mb-12 flex flex-col gap-8">
          {sections?.ideaSummary && <IdeaSummaryCard markdown={sections.ideaSummary} />}

          {scores && (
            <Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl text-pencil mb-4">🔬 Scorecard</h2>
              <div className="flex flex-col gap-3">
                {PHASE_LABELS.map(({ key, label, weight }) => {
                  const parentScore = result?.parent_scores?.[key]
                  const delta = parentScore != null ? +(scores[key] - parentScore).toFixed(1) : null
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-body text-pencil text-sm">{label}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-body text-muted text-xs">{weight}</span>
                          {delta != null && delta > 0 && <span className="font-body text-sm" style={{ color: '#16a34a' }}>+{delta}</span>}
                          {delta != null && delta < 0 && <span className="font-body text-sm" style={{ color: '#dc2626' }}>{delta}</span>}
                          {delta != null && delta === 0 && <span className="font-body text-sm text-muted">±0.0</span>}
                        </div>
                      </div>
                      <ScoreBar score={scores[key]} />
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-muted flex justify-between items-center">
                <span className="font-heading text-pencil text-lg">Weighted Total</span>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-pencil text-2xl">{scores.weighted.toFixed(1)}/5</span>
                  {result?.parent_scores?.weighted != null && (() => {
                    const d = +(scores.weighted - result.parent_scores.weighted).toFixed(1)
                    if (d > 0) return <span className="font-body text-base" style={{ color: '#16a34a' }}>+{d}</span>
                    if (d < 0) return <span className="font-body text-base" style={{ color: '#dc2626' }}>{d}</span>
                    return <span className="font-body text-base text-muted">±0.0</span>
                  })()}
                </div>
              </div>
            </Card>
          )}

          {sections?.verdict && <VerdictCard markdown={sections.verdict} />}
          {sections?.commentary && <CommentaryCard markdown={sections.commentary} />}
        </div>
        <ActionButtons
          result={result}
          isDeleting={isDeleting}
          onRevalidate={handleRevalidate}
          onDelete={() => setShowDeleteConfirm(true)}
          isPublic={result?.is_public}
          onToggleVisibility={handleToggleVisibility}
          isTogglingVisibility={isTogglingVisibility}
        />

        {!result?.isOwner && !user && (
          <div className="w-full max-w-2xl text-center mb-12">
            <p className="font-body text-lg text-pencil opacity-60">
              Interested in validating your own idea?{' '}
              <a href="/" className="text-blue underline hover:text-accent transition-colors">
                Validate your startup →
              </a>
            </p>
          </div>
        )}

        <div className="mt-20 md:mt-24" />
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <AuthModal />
    </AppShell>
  )
}
