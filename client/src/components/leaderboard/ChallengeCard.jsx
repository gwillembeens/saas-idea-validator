import { Card } from '../ui/Card'
import { NICHE_CONFIG } from '../../constants/nicheConfig'

export default function ChallengeCard({ niche, topScore, onTryNiche }) {
  const config = NICHE_CONFIG[niche] || NICHE_CONFIG['Other']
  const Icon = config.icon
  const hasScore = topScore !== null && topScore !== undefined

  return (
    <Card decoration="none" rotate={-1} className="flex flex-col items-center text-center p-4 gap-2">
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
      <button
        onClick={onTryNiche}
        className="w-full font-body text-sm h-9 px-3 bg-paper text-pencil shadow-hard hover:bg-accent hover:text-white active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-100"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        Try This Niche
      </button>
    </Card>
  )
}
