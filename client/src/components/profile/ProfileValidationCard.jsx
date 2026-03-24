import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { NichePill } from '../ui/NichePill'
import { LikeButton } from '../social/LikeButton'
import { CommentCount } from '../social/CommentCount'
import { formatDate } from '../../utils/formatDate'

function getVerdictColor(weighted) {
  if (weighted >= 4.5) return 'bg-green-100 border-green-400 text-green-800'
  if (weighted >= 3.5) return 'bg-yellow-100 border-yellow-400 text-yellow-800'
  if (weighted >= 2.5) return 'bg-orange-100 border-orange-400 text-orange-800'
  return 'bg-red-100 border-red-400 text-red-800'
}

function getVerdictLabel(weighted) {
  if (weighted >= 4.5) return 'Strong Signal'
  if (weighted >= 3.5) return 'Promising'
  if (weighted >= 2.5) return 'Needs Work'
  return 'Too Vague'
}

export function ProfileValidationCard({ validation, onCommentClick }) {
  const navigate = useNavigate()
  const weighted = validation.scores?.weighted ?? 0
  const verdictColor = getVerdictColor(weighted)
  const verdictLabel = getVerdictLabel(weighted)

  return (
    <Card
      decoration="none"
      rotate={0}
      onClick={() => navigate(`/history/${validation.id}`)}
      className="cursor-pointer hover:shadow-hardLg transition-shadow"
    >
      {/* Title + date */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-heading text-sm text-pencil leading-snug line-clamp-1">
          {validation.title || 'Untitled'}
        </p>
        {validation.created_at && (
          <span className="flex-shrink-0 font-body text-xs text-pencil opacity-40">
            {formatDate(validation.created_at)}
          </span>
        )}
      </div>

      {/* Idea preview */}
      <p className="font-body text-base text-pencil mb-4 line-clamp-2 leading-snug">
        {validation.idea_text}
      </p>

      {/* Footer: score + niche + social */}
      <div className="flex items-center gap-3 pt-3 border-t border-muted">
        <div
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 border font-body text-xs ${verdictColor}`}
          style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
        >
          <span className="font-heading text-sm leading-none">{weighted.toFixed(1)}/5</span>
          <span className="opacity-80">{verdictLabel}</span>
        </div>
        <NichePill niche={validation.niche || 'Other'} size="sm" />
        <div className="flex items-center gap-2 ml-auto">
          <LikeButton resultId={validation.id} initialCount={validation.like_count ?? 0} mode="compact" />
          <CommentCount count={validation.comment_count ?? 0} onClick={onCommentClick} mode="compact" />
        </div>
      </div>
    </Card>
  )
}
