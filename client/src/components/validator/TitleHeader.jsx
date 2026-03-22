import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { formatResultDate } from '../../utils/formatResultDate'

export function TitleHeader({
  result,
  isEditingTitle,
  editingTitle,
  isSavingTitle,
  onEditStart,
  onEditCancel,
  onEditSave,
}) {
  const [localTitle, setLocalTitle] = useState(editingTitle)

  useEffect(() => {
    setLocalTitle(editingTitle)
  }, [editingTitle])

  return (
    <div className="w-full max-w-2xl text-center mb-8">
      {isEditingTitle ? (
        <div className="flex items-center justify-center gap-3 mb-2">
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            autoFocus
            className="font-heading text-3xl md:text-4xl text-pencil bg-paper border-2 border-blue px-4 py-2 text-center outline-none w-full max-w-xl"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(localTitle)
              if (e.key === 'Escape') onEditCancel()
            }}
          />
          <Button
            variant="primary"
            onClick={() => onEditSave(localTitle)}
            disabled={isSavingTitle}
          >
            {isSavingTitle ? 'Saving…' : 'Save'}
          </Button>
        </div>
      ) : (
        <h1
          className={`font-heading text-5xl md:text-6xl text-pencil mb-2 ${result?.isOwner ? 'cursor-text hover:opacity-70 transition-opacity' : ''}`}
          onClick={result?.isOwner ? onEditStart : undefined}
          title={result?.isOwner ? 'Click to rename' : undefined}
        >
          {result?.title}
        </h1>
      )}
      <p className="font-body text-sm text-pencil opacity-50">
        {formatResultDate(result?.created_at)}
      </p>
    </div>
  )
}
