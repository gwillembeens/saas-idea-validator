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
    <p className="font-body text-lg text-pencil mb-3 leading-relaxed">
      {children}
    </p>
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
  hr: () => <hr className="border-pencil border-t-2 opacity-20 my-6" />,
}

export function VerdictCard({ markdown }) {
  if (!markdown?.trim()) return null
  return (
    <Card decoration="none" rotate={0} className="w-full max-w-2xl mx-auto">
      <ReactMarkdown components={markdownComponents}>{markdown}</ReactMarkdown>
    </Card>
  )
}
