import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { NICHE_CONFIG } from '../../constants/nicheConfig'

export default function ChallengeCard({ niche, topScore, onTryNiche }) {
  const config = NICHE_CONFIG[niche] || NICHE_CONFIG['Other']
  const Icon = config.icon
  const hasScore = topScore !== null && topScore !== undefined

  return (
    <Card decoration="none" rotate={-1} className="w-40 flex-shrink-0 flex flex-col items-center text-center p-4 gap-2">
      {/* Niche icon + name */}
      <div className="flex flex-col items-center gap-1">
        <Icon size={24} strokeWidth={2.5} className="text-pencil" />
        <span className="font-heading text-sm text-pencil leading-tight">{niche}</span>
      </div>

      {/* Score */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        <span
          className="font-heading text-3xl text-pencil"
          style={{ lineHeight: 1 }}
        >
          {hasScore ? `${topScore.toFixed(1)}/5` : '—'}
        </span>
        <span className="font-body text-xs text-muted">
          {hasScore ? 'Can you beat it?' : 'Be the first!'}
        </span>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        onClick={onTryNiche}
        className="w-full text-sm"
      >
        Try This Niche
      </Button>
    </Card>
  )
}
