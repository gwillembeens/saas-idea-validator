import PropTypes from 'prop-types'
import { ActivityHeatmap } from './ActivityHeatmap'
import { ScoreTrendChart } from './ScoreTrendChart'
import { NicheBreakdown } from './NicheBreakdown'

function StatItem({ label, value }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-heading text-lg md:text-xl text-pencil leading-none">{value}</span>
      <span className="font-body text-xs text-pencil opacity-50">{label}</span>
    </div>
  )
}

function SubSection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="font-heading text-lg text-pencil mb-3">{title}</h3>
      {children}
    </div>
  )
}

export function AnalyticsSection({ analytics }) {
  if (!analytics) return null

  const { heatmap, scoreTrend, nicheBreakdown, streaks } = analytics

  const hasActivity =
    heatmap?.some(d => d.count > 0) ||
    (scoreTrend && scoreTrend.length >= 2) ||
    (nicheBreakdown && nicheBreakdown.length > 0)

  if (!hasActivity) return null

  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl md:text-3xl text-pencil mb-6">Activity</h2>

      {/* Streak Stats */}
      {streaks && (streaks.current > 0 || streaks.longest > 0) && (
        <div
          className="flex items-center gap-5 px-6 py-3 bg-paper border-2 border-pencil shadow-hard mb-6 w-fit"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        >
          <StatItem label="day streak" value={`🔥 ${streaks.current}`} />
          <span className="text-pencil opacity-20 font-body text-lg">·</span>
          <StatItem label="longest streak" value={streaks.longest} />
        </div>
      )}

      {/* Heatmap */}
      {heatmap && heatmap.length > 0 && (
        <SubSection title="Validation Activity">
          <ActivityHeatmap heatmap={heatmap} />
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
    streaks: PropTypes.shape({
      current: PropTypes.number,
      longest: PropTypes.number,
    }),
  }),
}
