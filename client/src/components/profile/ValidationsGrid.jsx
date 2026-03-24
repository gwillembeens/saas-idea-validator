import { useState } from 'react'
import { ProfileValidationCard } from './ProfileValidationCard'
import { CommentModal } from '../social/CommentModal'
import { Button } from '../ui/Button'

const PAGE_SIZE = 6

export function ValidationsGrid({ validations }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [openCommentResultId, setOpenCommentResultId] = useState(null)

  if (!validations || validations.length === 0) return null

  const visible = validations.slice(0, visibleCount)

  return (
    <>
      <section className="mt-8">
        <h2 className="font-heading text-2xl md:text-3xl text-pencil mb-6">Validations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map(v => (
            <ProfileValidationCard
              key={v.id}
              validation={v}
              onCommentClick={e => { e.stopPropagation(); setOpenCommentResultId(v.id) }}
            />
          ))}
        </div>
        {visibleCount < validations.length && (
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
              Load more
            </Button>
          </div>
        )}
      </section>

      {openCommentResultId !== null && (
        <CommentModal
          resultId={openCommentResultId}
          onClose={() => setOpenCommentResultId(null)}
        />
      )}
    </>
  )
}
