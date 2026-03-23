import PropTypes from 'prop-types'
import { ActivityHeatmap } from './ActivityHeatmap'
import { ScoreTrendChart } from './ScoreTrendChart'
import { NicheBreakdown } from './NicheBreakdown'

function SubSection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="font-heading text-lg text-pencil mb-3">{title}</h3>
      {children}
    </div>
  )
}

export function AnalyticsSection({ analytics, selectedYear, onYearChange }) {
  if (!analytics) return null

  const { heatmap, scoreTrend, nicheBreakdown, availableYears } = analytics

  const hasActivity =
    heatmap?.some(d => d.count > 0) ||
    (scoreTrend && scoreTrend.length >= 2) ||
    (nicheBreakdown && nicheBreakdown.length > 0)

  if (!hasActivity) return null

  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl md:text-3xl text-pencil mb-6">Activity</h2>

      {/* Heatmap */}
      {heatmap && heatmap.length > 0 && (
        <SubSection title="Validation Activity">
          <ActivityHeatmap
            heatmap={heatmap}
            availableYears={availableYears}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
          />
        </SubSection>
      )}

      {/* Score Trend */}
      {scoreTrend && scoreTrend.length >= 2 && (
        <SubSection title="Score Trend">
          <ScoreTrendChart scoreTrend={scoreTrend} />
        </SubSection>
      )}

      {/* Niche Breakdown */}
      {nicheBreakdown && nicheBreakdown.length > 0 && (
        <SubSection title="By Niche">
          <NicheBreakdown nicheBreakdown={nicheBreakdown} />
        </SubSection>
      )}
    </section>
  )
}

AnalyticsSection.propTypes = {
  analytics: PropTypes.shape({
    heatmap: PropTypes.array,
    scoreTrend: PropTypes.array,
    nicheBreakdown: PropTypes.array,
    availableYears: PropTypes.arrayOf(PropTypes.number),
    streaks: PropTypes.shape({
      current: PropTypes.number,
      longest: PropTypes.number,
    }),
  }),
  selectedYear: PropTypes.number,
  onYearChange: PropTypes.func,
}
