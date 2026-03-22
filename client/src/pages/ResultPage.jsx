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
                <span className="font-body text-base opacity-60">({weighted}/5)</span>
              </div>
            )}
            <NichePill niche={niche} />
          </div>
        )}

        <div className="w-full max-w-2xl mb-12 flex flex-col gap-8">
          {sections?.ideaSummary && <IdeaSummaryCard markdown={sections.ideaSummary} />}

          {scores && (
            <Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl text-pencil mb-4">🔬 Scorecard</h2>
              <div className="flex flex-col gap-3">
                {PHASE_LABELS.map(({ key, label, weight }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-body text-pencil text-sm">{label}</span>
                      <span className="font-body text-muted text-xs">{weight}</span>
                    </div>
                    <ScoreBar score={scores[key]} />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-muted flex justify-between items-center">
                <span className="font-heading text-pencil text-lg">Weighted Total</span>
                <span className="font-heading text-pencil text-2xl">{scores.weighted}/5</span>
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
