import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppShell } from '../components/layout/AppShell'
import { SignInButton } from '../components/auth/SignInButton'
import { AuthModal } from '../components/auth/AuthModal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScoreBar } from '../components/ui/ScoreBar'
import { IdeaSummaryCard } from '../components/validator/IdeaSummaryCard'
import { CommentaryCard } from '../components/validator/CommentaryCard'
import { VerdictCard } from '../components/validator/VerdictCard'
import { parseSections } from '../utils/parseSections'
import { parseScores } from '../utils/parseResult'
import { generateShareUrls } from '../utils/shareUrls'
import { setIdea } from '../store/slices/validatorSlice'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { Trash2, RefreshCw } from 'lucide-react'

const PHASE_LABELS = [
  { key: 'phase1', label: '1. Market & Niche', weight: '30%' },
  { key: 'phase2', label: '2. Content & Distribution', weight: '25%' },
  { key: 'phase3', label: '3. Product & Agent Architecture', weight: '35%' },
  { key: 'phase4', label: '4. Pricing & Moat', weight: '10%' },
]

function getVerdict(weighted) {
  if (weighted >= 4.5) return { emoji: '🟢', label: 'Strong Signal', bg: '#d1fae5', border: '#6ee7b7' }
  if (weighted >= 3.5) return { emoji: '🟡', label: 'Promising', bg: '#fef9c3', border: '#fde047' }
  if (weighted >= 2.5) return { emoji: '🟠', label: 'Needs Work', bg: '#ffedd5', border: '#fdba74' }
  return { emoji: '🔴', label: 'Too Vague', bg: '#fee2e2', border: '#fca5a5' }
}

export function ResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/history/${id}`)
        if (!res.ok) throw new Error('Result not found')
        const data = await res.json()
        setResult(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
  }, [id])

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
      setError(err.message)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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

  // Use pre-parsed scores from DB JSONB if available, otherwise parse from markdown
  const scores = result?.scores || parseScores(result?.markdown_result)
  const sections = parseSections(result?.markdown_result)
  const shareUrls = generateShareUrls(result?.title, window.location.href)

  const weighted = scores?.weighted || 0
  const verdict = weighted > 0 ? getVerdict(weighted) : null

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">

        {/* Title */}
        <div className="w-full max-w-4xl text-center mb-12">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-2">
            {result?.title}
          </h1>
          <p className="font-body text-sm text-pencil opacity-50">
            {new Date(result?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Verdict badge */}
        {verdict && (
          <div className="mb-8 flex justify-center">
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
          </div>
        )}

        {/* Content cards */}
        <div className="w-full max-w-4xl mb-12 flex flex-col gap-8">

          {/* Idea Summary */}
          {sections?.ideaSummary && (
            <IdeaSummaryCard markdown={sections.ideaSummary} />
          )}

          {/* Scorecard */}
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

          {/* Verdict section */}
          {sections?.verdict && (
            <VerdictCard markdown={sections.verdict} />
          )}

          {/* Commentary */}
          {sections?.commentary && (
            <CommentaryCard markdown={sections.commentary} />
          )}
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-4xl mb-12">
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">

            {/* Re-validate */}
            <Button variant="primary" onClick={handleRevalidate}>
              <RefreshCw size={18} className="mr-2 inline" />
              Re-validate This Idea
            </Button>

            {/* Share buttons */}
            <button
              onClick={() => window.open(shareUrls.twitter, '_blank')}
              className="px-4 py-3 font-body text-lg bg-blue text-white hover:opacity-80 transition"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              Share on X
            </button>
            <button
              onClick={() => window.open(shareUrls.linkedin, '_blank')}
              className="px-4 py-3 font-body text-lg bg-blue text-white hover:opacity-80 transition"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              Share on LinkedIn
            </button>
            <button
              onClick={() => window.open(shareUrls.whatsapp, '_blank')}
              className="px-4 py-3 font-body text-lg bg-blue text-white hover:opacity-80 transition"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              Share on WhatsApp
            </button>

            {/* Delete (owner only) */}
            {result?.isOwner && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-3 font-body text-lg text-accent hover:opacity-70 transition flex items-center gap-2"
              >
                <Trash2 size={18} strokeWidth={2.5} />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
            <Card decoration="tack" className="w-full max-w-sm p-8">
              <h2 className="font-heading text-2xl text-pencil mb-4">Delete Result?</h2>
              <p className="font-body text-lg text-pencil mb-6">
                This cannot be undone.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Non-owner CTA */}
        {!result?.isOwner && (
          <div className="w-full max-w-4xl text-center mb-12">
            <p className="font-body text-lg text-pencil opacity-60">
              Interested in validating your own idea?{' '}
              <a href="/" className="text-blue underline hover:text-accent transition-colors">
                Validate your startup →
              </a>
            </p>
          </div>
        )}

        {/* Footer spacing */}
        <div className="mt-20 md:mt-24" />

      </div>

      <AuthModal />
    </AppShell>
  )
}
