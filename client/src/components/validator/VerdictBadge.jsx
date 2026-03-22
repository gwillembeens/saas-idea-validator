import { useSelector } from 'react-redux'
import { parseScores } from '../../utils/parseResult'

function getVerdict(weighted) {
  if (weighted >= 4.5) return { emoji: '🟢', label: 'Strong Signal', bg: '#d1fae5', border: '#6ee7b7' }
  if (weighted >= 3.5) return { emoji: '🟡', label: 'Promising', bg: '#fef9c3', border: '#fde047' }
  if (weighted >= 2.5) return { emoji: '🟠', label: 'Needs Work', bg: '#ffedd5', border: '#fdba74' }
  return { emoji: '🔴', label: 'Too Vague', bg: '#fee2e2', border: '#fca5a5' }
}

export function VerdictBadge() {
  const result = useSelector(s => s.validator.result)

  if (!result) return null

  const scores = parseScores(result)
  if (!scores) return null

  const { emoji, label, bg, border } = getVerdict(scores.weighted)

  return (
    <div
      className="inline-flex items-center gap-2 px-6 py-3 font-heading text-pencil text-xl shadow-hard"
      style={{
        backgroundColor: bg,
        border: `2px solid ${border}`,
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        transform: 'rotate(-1deg)',
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span className="font-body text-base opacity-60">({scores.weighted.toFixed(1)}/5)</span>
    </div>
  )
}
