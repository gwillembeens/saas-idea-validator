import { useState } from 'react'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'

export function CommentForm({ onSubmit, submitting, placeholder = 'Write a comment…', maxLength = 500 }) {
  const [body, setBody] = useState('')

  const charCount = body.length
  const overLimit = charCount > maxLength
  const isEmpty = body.trim().length === 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (isEmpty || overLimit || submitting) return
    const success = await onSubmit(body.trim())
    if (success !== false) setBody('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <TextArea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        disabled={submitting}
        rows={3}
        className="text-base"
      />
      <div className="flex items-center justify-between">
        <Button
          type="submit"
          variant="secondary"
          disabled={isEmpty || overLimit || submitting}
          className="h-9 text-sm px-4"
        >
          {submitting ? 'Posting…' : 'Post'}
        </Button>
        <span
          className={`font-body text-xs ${overLimit ? 'text-accent' : 'text-pencil opacity-50'}`}
        >
          {charCount}/{maxLength}
        </span>
      </div>
    </form>
  )
}
