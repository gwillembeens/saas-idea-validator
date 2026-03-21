import { useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import { parseScores } from '../../utils/parseResult'
import { ScoreBar } from '../ui/ScoreBar'
import { Card } from '../ui/Card'

const PHASE_LABELS = [
  { key: 'phase1', label: '1. Market & Niche', weight: '30%' },
  { key: 'phase2', label: '2. Content & Distribution', weight: '25%' },
  { key: 'phase3', label: '3. Product & Agent Architecture', weight: '35%' },
  { key: 'phase4', label: '4. Pricing & Moat', weight: '10%' },
]

export function Scorecard() {
  const result = useSelector(s => s.validator.result)

  if (!result) return null

  const scores = parseScores(result)

  if (!scores) {
    return (
      <Card decoration="none" rotate={0}>
        <ReactMarkdown>{result}</ReactMarkdown>
      </Card>
    )
  }

  return (
    <Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
      <h2 className="font-heading text-2xl text-pencil mb-4">🔬 Scorecard</h2>
      <div className="flex flex-col gap-3">
        {PHASE_LABELS.map(({ key, label, weight }) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-body text-pencil text-sm">{label}</span>
              <span className="font-body text-muted text-xs">{weight}</span>
            </div>
            <ScoreBar score={scores[key]} />
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-muted flex justify-between items-center">
        <span className="font-heading text-pencil text-lg">Weighted Total</span>
        <span className="font-heading text-pencil text-2xl">{scores.weighted}/5</span>
      </div>
    </Card>
  )
}
