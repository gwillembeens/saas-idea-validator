import PropTypes from 'prop-types'

function getCellColor(count) {
  if (count === 0) return '#fdfbf7'    // paper — no activity
  if (count === 1) return '#e5e0d8'    // muted — light
  if (count <= 3) return '#c8bfb0'     // between muted and pencil
  return '#2d2d2d'                     // pencil — high activity
}

export function ActivityHeatmap({ heatmap }) {
  if (!heatmap || heatmap.length === 0) return null

  // Build 52 columns × 7 rows (pad front with empty cells to start on correct weekday)
  const firstDay = new Date(heatmap[0].date)
  const startPad = firstDay.getDay() // 0=Sun, pad cells before first real day
  const cells = [
    ...Array(startPad).fill(null),
    ...heatmap,
  ]

  // Group into weeks (columns of 7)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div>
      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={cell ? `${cell.date}: ${cell.count} validation${cell.count !== 1 ? 's' : ''}` : ''}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: cell ? getCellColor(cell.count) : 'transparent',
                    border: cell ? '1px solid #2d2d2d' : 'none',
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-2">
        <span className="font-body text-xs text-pencil opacity-50">Less</span>
        {['#fdfbf7', '#e5e0d8', '#c8bfb0', '#2d2d2d'].map((color) => (
          <div
            key={color}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: color,
              border: '1px solid #2d2d2d',
              borderRadius: '2px',
            }}
          />
        ))}
        <span className="font-body text-xs text-pencil opacity-50">More</span>
      </div>
    </div>
  )
}

ActivityHeatmap.propTypes = {
  heatmap: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}
