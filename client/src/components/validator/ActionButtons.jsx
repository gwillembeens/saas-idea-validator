import { useMemo } from 'react'
import { Trash2, RefreshCw, Globe, Lock } from 'lucide-react'
import { Button } from '../ui/Button'

export function ActionButtons({ result, isDeleting, onRevalidate, onDelete, isPublic, onToggleVisibility, isTogglingVisibility }) {
  const shareUrls = useMemo(() => {
    const shareText = `I validated my SaaS idea: "${result?.title}"`
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`,
    }
  }, [result?.title])

  return (
    <div className="flex flex-nowrap gap-4 justify-center items-center mb-12 overflow-x-auto px-4">
      <Button variant="primary" onClick={onRevalidate} className="bg-white">
        <RefreshCw size={18} className="mr-2 inline" strokeWidth={2.5} />
        Re-validate This Idea
      </Button>

      <button
        onClick={() => window.open(shareUrls.twitter, '_blank')}
        className="flex-shrink-0 px-4 py-3 font-body text-lg bg-blue text-white hover:opacity-80 transition whitespace-nowrap"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        Share on X
      </button>
      <button
        onClick={() => window.open(shareUrls.linkedin, '_blank')}
        className="flex-shrink-0 px-4 py-3 font-body text-lg bg-blue text-white hover:opacity-80 transition whitespace-nowrap"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        Share on LinkedIn
      </button>
      <button
        onClick={() => window.open(shareUrls.whatsapp, '_blank')}
        className="flex-shrink-0 px-4 py-3 font-body text-lg bg-blue text-white hover:opacity-80 transition whitespace-nowrap"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        Share on WhatsApp
      </button>

      {result?.isOwner && (
        <>
          <button
            onClick={onToggleVisibility}
            disabled={isTogglingVisibility}
            className="flex items-center gap-2 font-body text-pencil opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
          >
            {isPublic
              ? <Lock size={16} strokeWidth={2.5} />
              : <Globe size={16} strokeWidth={2.5} />
            }
            <span>{isPublic ? 'Make Private' : 'Make Public'}</span>
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-shrink-0 px-4 py-3 font-body text-lg text-accent hover:opacity-70 transition flex items-center gap-2 whitespace-nowrap"
          >
            <Trash2 size={18} strokeWidth={2.5} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </>
      )}
    </div>
  )
}
