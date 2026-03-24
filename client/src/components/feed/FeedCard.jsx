import { useNavigate, Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { NichePill } from '../ui/NichePill'
import { LikeButton } from '../social/LikeButton'
import { useAuth } from '../../hooks/useAuth'

function timeAgo(createdAt) {
  const hours = Math.floor((Date.now() - new Date(createdAt)) / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function weightedScore(scores) {
  if (!scores) return null
  const { phase1, phase2, phase3, phase4 } = scores
  if (phase1 == null) return null
  return (phase1 * 0.30 + phase2 * 0.25 + phase3 * 0.35 + phase4 * 0.10).toFixed(1)
}

export function FeedCard({ id, idea_text, scores, niche, user_id, author_username, created_at, like_count, comment_count, liked_by_user }) {
  const navigate = useNavigate()
  const { openModal } = useAuth()

  const score = weightedScore(scores)

  const handleCardClick = () => {
    navigate(`/history/${id}`)
  }

  const handleAuthRequired = () => {
    openModal('login')
  }

  return (
    <Card
      decoration="none"
      className="cursor-pointer hover:rotate-1 transition-transform duration-100"
      onClick={handleCardClick}
    >
      {/* Author */}
      <div className="mb-2">
        {author_username ? (
          <Link
            to={`/profile/${author_username}`}
            onClick={e => e.stopPropagation()}
            className="font-body text-sm text-blue hover:text-accent transition-colors"
          >
            @{author_username}
          </Link>
        ) : (
          <span className="font-body text-sm text-pencil opacity-50">Anonymous</span>
        )}
      </div>

      {/* Idea preview */}
      <p className="font-body text-base text-pencil line-clamp-2 mb-3">
        {idea_text}
      </p>

      {/* Footer row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Score badge */}
        {score && (
          <span
            className="font-body text-xs font-bold text-pencil px-2 py-0.5 bg-postit"
            style={{ border: '1px solid #2d2d2d', borderRadius: '4px' }}
          >
            {score}/5
          </span>
        )}

        {/* Niche pill */}
        {niche && <NichePill niche={niche} size="sm" />}

        {/* Like + Comment + Time — right-aligned */}
        <div className="ml-auto flex items-center gap-2">
          <LikeButton
            resultId={id}
            initialLiked={liked_by_user || false}
            initialCount={like_count || 0}
            mode="compact"
            onAuthRequired={handleAuthRequired}
          />
          <span className="font-body text-xs text-pencil opacity-60">
            💬 {comment_count || 0}
          </span>
          <span className="font-body text-xs text-pencil opacity-50">
            · {timeAgo(created_at)}
          </span>
        </div>
      </div>
    </Card>
  )
}
