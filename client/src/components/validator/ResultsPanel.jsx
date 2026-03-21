import { useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import { Card } from '../ui/Card'

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
  hr: () => (
    <hr className="border-pencil border-t-2 opacity-20 my-6" />
  ),
}

export function ResultsPanel() {
  const { status, result } = useSelector(s => s.validator)

  if (status === 'idle') return null

  if (status === 'loading') {
    return (
      <Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/5" />
          <div className="h-6 bg-muted rounded w-2/3 mt-4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </Card>
    )
  }

  if (status === 'error') return null

  return (
    <Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
      <ReactMarkdown components={markdownComponents}>
        {result}
      </ReactMarkdown>
    </Card>
  )
}
