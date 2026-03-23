import PropTypes from 'prop-types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function ScoreTrendChart({ scoreTrend }) {
  if (!scoreTrend || scoreTrend.length < 2) return null

  const data = scoreTrend.map((v) => ({
    name: v.created_at
      ? new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '',
    score: v.score,
    title: v.title,
  }))

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontFamily: 'Patrick Hand, cursive', fontSize: 10, fill: '#2d2d2d' }}
            axisLine={{ stroke: '#2d2d2d' }}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontFamily: 'Patrick Hand, cursive', fontSize: 11, fill: '#2d2d2d' }}
            axisLine={{ stroke: '#2d2d2d' }}
            tickLine={false}
            width={20}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'Patrick Hand, cursive',
              fontSize: 12,
              border: '2px solid #2d2d2d',
              borderRadius: '4px',
              backgroundColor: '#fdfbf7',
              color: '#2d2d2d',
            }}
            formatter={(value, name, props) => [
              `${value}/5`,
              props.payload.title || 'Untitled',
            ]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2d5da1"
            strokeWidth={2}
            dot={{ fill: '#2d5da1', stroke: '#2d2d2d', strokeWidth: 1, r: 4 }}
            activeDot={{ r: 6, fill: '#2d5da1', stroke: '#2d2d2d' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

ScoreTrendChart.propTypes = {
  scoreTrend: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      score: PropTypes.number.isRequired,
      created_at: PropTypes.string,
    })
  ),
}
