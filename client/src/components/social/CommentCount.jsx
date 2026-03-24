import { MessageCircle } from 'lucide-react'

export function CommentCount({ count, onClick, mode = 'compact' }) {
  const isCompact = mode === 'compact'
  const className = `flex items-center gap-1.5 font-body text-pencil opacity-60 hover:opacity-100 transition-opacity ${
    isCompact ? 'h-8 text-sm' : 'h-11 text-base'
  } ${onClick ? 'cursor-pointer' : ''}`
  const style = onClick ? { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px', padding: isCompact ? '0 8px' : '0 12px' } : undefined
  const inner = (
    <>
      <MessageCircle size={isCompact ? 14 : 18} strokeWidth={2.5} />
      <span>{count}</span>
      {!isCompact && <span>Comments</span>}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={e => { e.stopPropagation(); onClick() }}
        className={className}
        style={style}
        aria-label="View comments"
      >
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}
