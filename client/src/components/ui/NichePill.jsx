import { NICHE_CONFIG } from '../../constants/nicheConfig'

// size="lg" matches the verdict pill (used at top of result pages)
// size="sm" is compact for HistoryCard footer
export function NichePill({ niche, size = 'lg', className = '' }) {
  if (!niche) return null
  const config = NICHE_CONFIG[niche] || NICHE_CONFIG['Other']
  const Icon = config.icon

  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-body text-xs text-pencil ${className}`}
        style={{
          backgroundColor: '#e5e0d8',
          border: '1px solid #2d2d2d',
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        }}
      >
        <Icon size={12} strokeWidth={2.5} />
        {niche}
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-6 py-3 font-heading text-pencil text-xl shadow-hard ${className}`}
      style={{
        backgroundColor: '#e5e0d8',
        border: '2px solid #2d2d2d',
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        transform: 'rotate(1deg)',
      }}
    >
      <Icon size={18} strokeWidth={2.5} />
      {niche}
    </div>
  )
}
