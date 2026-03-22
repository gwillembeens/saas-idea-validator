import { useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import { Card } from '../ui/Card'
import { parseSections } from '../../utils/parseSections'
import { IdeaSummaryCard } from './IdeaSummaryCard'
import { VerdictCard } from './VerdictCard'
import { CommentaryCard } from './CommentaryCard'
import { Scorecard } from './Scorecard'

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="font-heading text-4xl text-pencil mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading text-3xl text-pencil mb-3 mt-6">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading text-2xl text-pencil mb-2 mt-4">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="font-body text-lg text-pencil mb-3 leading-relaxed">{children}</p>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse font-body text-pencil">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="font-body text-pencil border-2 border-pencil px-3 py-2 text-left bg-muted">{children}</th>
  ),
  td: ({ children }) => (
    <td className="font-body text-pencil border-2 border-pencil px-3 py-2">{children}</td>
  ),
  strong: ({ children }) => (
    <strong className="font-body text-pencil font-bold">{children}</strong>
  ),
  li: ({ children }) => (
    <li className="font-body text-lg text-pencil mb-1">{children}</li>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  hr: () => null,
}

export function ResultsPanel() {
  const { status, result, error } = useSelector(s => s.validator)

  if (status === 'idle') return null

  if (status === 'loading' || status === 'streaming') return null

  if (status === 'error') {
    return (
      <Card decoration="none" rotate={0} className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col items-center gap-3 text-center py-4">
          <span className="text-accent text-4xl" aria-hidden="true">✕</span>
          <h3 className="font-heading text-2xl text-pencil">Validation Failed</h3>
          <p className="font-body text-lg text-pencil">
            {error || 'Something went wrong. Check your connection and try again.'}
          </p>
        </div>
      </Card>
    )
  }

  if (status === 'done') {
    const sections = parseSections(result)

    if (!sections) {
      // Fallback: parse failed — render raw markdown in single card (existing behavior)
      return (
        <div className="w-full max-w-2xl mx-auto">
          <Card decoration="none" rotate={0} className="w-full">
            <ReactMarkdown components={markdownComponents}>{result}</ReactMarkdown>
          </Card>
        </div>
      )
    }

    return (
      <div className="w-full flex flex-col items-center gap-8 animate-fadeIn">
        <IdeaSummaryCard markdown={sections.ideaSummary} />
        <Scorecard />
        <VerdictCard markdown={sections.verdict} />
        <CommentaryCard markdown={sections.commentary} />
      </div>
    )
  }

  return null
}
