import PropTypes from 'prop-types'
import { NichePill } from '../ui/NichePill'

export function NicheBreakdown({ nicheBreakdown }) {
  if (!nicheBreakdown || nicheBreakdown.length === 0) return null

  const maxCount = nicheBreakdown[0].count

  return (
    <div className="flex flex-col gap-3">
      {nicheBreakdown.map(({ niche, count }) => (
        <div key={niche} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <NichePill niche={niche} size="sm" />
            <span className="font-body text-xs text-pencil opacity-60">
              {count} {count === 1 ? 'validation' : 'validations'}
            </span>
          </div>
          <div
            className="h-2 bg-muted border border-pencil"
            style={{ borderRadius: '4px' }}
          >
            <div
              className="h-full bg-pencil"
              style={{
                width: `${(count / maxCount) * 100}%`,
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

NicheBreakdown.propTypes = {
  nicheBreakdown: PropTypes.arrayOf(
    PropTypes.shape({
      niche: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}
