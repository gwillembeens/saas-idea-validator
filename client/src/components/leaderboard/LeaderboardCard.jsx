import { useNavigate, Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { NichePill } from '../ui/NichePill'

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

export function LeaderboardCard({ entry, rank, isOwn }) {
  const navigate = useNavigate()
  const weighted = entry.scores?.weighted ?? 0
  const verdictColor = getVerdictColor(weighted)
  const verdictLabel = getVerdictLabel(weighted)

  function handleCardClick() {
    navigate(`/history/${entry.id}`)
  }

  const hasUsername = entry.author_username != null
  const authorDisplay = hasUsername ? entry.author_username : 'Anonymous'

  return (
    <Card decoration="none" rotate={0} onClick={handleCardClick} className="cursor-pointer hover:shadow-hardLg transition-shadow">
        {/* Author row + You badge */}
        <div className="flex items-center justify-between mb-3 gap-2">
          {hasUsername ? (
            <Link
              to={`/profile/${entry.author_username}`}
              onClick={e => e.stopPropagation()}
              className="font-body text-sm text-blue hover:text-accent transition-colors"
            >
              by {authorDisplay}
            </Link>
          ) : (
            <span className="font-body text-sm text-pencil opacity-50">
              by {authorDisplay}
            </span>
          )}
          {isOwn && (
            <span
              className="flex-shrink-0 px-2 py-0.5 bg-postit border border-pencil font-body text-xs text-pencil"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              You
            </span>
          )}
        </div>

        {/* Idea preview */}
        <p className="font-body text-base md:text-lg text-pencil mb-4 line-clamp-2 leading-snug">
          {entry.idea_text}
        </p>

        {/* Footer: score + niche */}
        <div className="flex items-center gap-3 pt-3 border-t border-muted">
          <div
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 border font-body text-xs ${verdictColor}`}
            style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
          >
            <span className="font-heading text-sm leading-none">{weighted.toFixed(1)}/5</span>
            <span className="opacity-80">{verdictLabel}</span>
          </div>
          <NichePill niche={entry.niche || 'Other'} size="sm" />
        </div>
    </Card>
  )
}
