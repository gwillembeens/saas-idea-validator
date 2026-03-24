import { Heart } from 'lucide-react'
import { useLike } from '../../hooks/useLike'

export function LikeButton({ resultId, initialLiked, initialCount, mode = 'compact', onAuthRequired }) {
  const { liked, count, loading, toggleLike } = useLike(resultId, {
    initialLiked,
    initialCount,
    onAuthRequired,
  })

  const isCompact = mode === 'compact'

  return (
    <button
      onClick={e => { e.stopPropagation(); toggleLike() }}
      disabled={loading}
      className={`flex items-center gap-1.5 font-body transition-all duration-100 ${
        isCompact ? 'h-8 text-sm' : 'h-11 text-base'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
        liked ? 'shadow-hardSm' : ''
      }`}
      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px', padding: isCompact ? '0 8px' : '0 12px' }}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <Heart
        size={isCompact ? 14 : 18}
        strokeWidth={2.5}
        fill={liked ? '#ff4d4d' : 'none'}
        stroke={liked ? '#ff4d4d' : '#2d2d2d'}
        className={liked ? '' : 'opacity-50'}
      />
      <span className={liked ? 'text-accent' : 'text-pencil opacity-50'}>
        {count}
      </span>
      {!isCompact && (
        <span className={liked ? 'text-accent' : 'text-pencil opacity-50'}>
          {liked ? 'Liked' : 'Like'}
        </span>
      )}
    </button>
  )
}
