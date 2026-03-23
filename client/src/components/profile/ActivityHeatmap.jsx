import { useState } from 'react'
import PropTypes from 'prop-types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getCellColor(count) {
  if (count === 0) return '#fdfbf7'    // paper — no activity
  if (count === 1) return '#e5e0d8'    // muted — light
  if (count <= 3) return '#c8bfb0'     // mid
  return '#2d2d2d'                     // pencil — high activity
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatTooltip(date, count) {
  const d = new Date(date + 'T00:00:00')
  const day = ordinal(d.getDate())
  const month = MONTH_NAMES[d.getMonth()]
  if (count === 0) return `No validations on ${month} ${day}`
  return `${count} ${count === 1 ? 'validation' : 'validations'} on ${month} ${day}`
}

export function ActivityHeatmap({ heatmap, availableYears, selectedYear, onYearChange }) {
  const [tooltip, setTooltip] = useState(null) // { text, x, y }

  if (!heatmap || heatmap.length === 0) return null

  const totalCount = heatmap.reduce((sum, d) => sum + d.count, 0)

  // Pad front so first day lands on correct weekday column
  const firstDay = new Date(heatmap[0].date + 'T00:00:00')
  const startPad = firstDay.getDay() // 0=Sun
  const cells = [
    ...Array(startPad).fill(null),
    ...heatmap,
  ]

  // Group into weeks (columns of 7)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  // Build month labels
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstReal = week.find(c => c !== null)
    if (firstReal) {
      const m = new Date(firstReal.date + 'T00:00:00').getMonth()
      if (m !== lastMonth) {
        monthLabels.push({ label: MONTHS[m], colIndex: wi })
        lastMonth = m
      }
    }
  })

  const CELL = 12
  const GAP = 3
  const colWidth = CELL + GAP

  function handleMouseEnter(e, cell) {
    if (!cell) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      text: formatTooltip(cell.date, cell.count),
      x: rect.left + CELL / 2,
      y: rect.top - 8,
    })
  }

  function handleMouseLeave() {
    setTooltip(null)
  }

  return (
    <div>
      {/* Year toggle */}
      {availableYears && availableYears.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => onYearChange && onYearChange(null)}
            className="font-body text-xs text-pencil transition-all"
            style={{
              padding: '2px 10px',
              border: '1.5px solid #2d2d2d',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              backgroundColor: selectedYear === null ? '#2d2d2d' : '#fdfbf7',
              color: selectedYear === null ? '#fdfbf7' : '#2d2d2d',
              boxShadow: selectedYear === null ? 'none' : '2px 2px 0px 0px #2d2d2d',
              cursor: 'pointer',
            }}
          >
            Last year
          </button>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => onYearChange && onYearChange(year)}
              className="font-body text-xs text-pencil transition-all"
              style={{
                padding: '2px 10px',
                border: '1.5px solid #2d2d2d',
                borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                backgroundColor: selectedYear === year ? '#2d2d2d' : '#fdfbf7',
                color: selectedYear === year ? '#fdfbf7' : '#2d2d2d',
                boxShadow: selectedYear === year ? 'none' : '2px 2px 0px 0px #2d2d2d',
                cursor: 'pointer',
              }}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Total count */}
      <p className="font-body text-sm text-pencil opacity-60 mb-2">
        {totalCount} {totalCount === 1 ? 'activity' : 'activities'}{selectedYear ? ` in ${selectedYear}` : ' in the last year'}
      </p>

      {/* Fixed tooltip — outside scroll/overflow context so it never clips */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            fontFamily: 'Patrick Hand, cursive',
            fontSize: '12px',
            backgroundColor: '#2d2d2d',
            color: '#fdfbf7',
            padding: '4px 10px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.3)',
          }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 'max-content', position: 'relative' }}>

          {/* Month labels row */}
          <div style={{ display: 'flex', marginBottom: '4px', position: 'relative', height: '16px' }}>
            {monthLabels.map(({ label, colIndex }) => (
              <span
                key={label + colIndex}
                className="font-body text-pencil"
                style={{
                  position: 'absolute',
                  left: `${colIndex * colWidth}px`,
                  fontSize: '11px',
                  opacity: 0.5,
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: `${GAP}px` }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    onMouseEnter={cell ? (e) => handleMouseEnter(e, cell) : undefined}
                    onMouseLeave={cell ? handleMouseLeave : undefined}
                    style={{
                      width: `${CELL}px`,
                      height: `${CELL}px`,
                      backgroundColor: cell ? getCellColor(cell.count) : 'transparent',
                      border: cell ? '1px solid #2d2d2d' : 'none',
                      borderRadius: '2px',
                      flexShrink: 0,
                      cursor: cell ? 'default' : undefined,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
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
  availableYears: PropTypes.arrayOf(PropTypes.number),
  selectedYear: PropTypes.number,
  onYearChange: PropTypes.func,
}
