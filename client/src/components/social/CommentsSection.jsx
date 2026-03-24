import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useComments } from '../../hooks/useComments'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'

export function CommentsSection({ resultId }) {
  const user = useSelector(s => s.auth.user)
  const { comments, loading, error, submitting, addComment, addReply, deleteComment } = useComments(resultId)
  const [replyingTo, setReplyingTo] = useState(null)

  const replyingToComment = replyingTo !== null
    ? comments.find(c => c.id === replyingTo)
    : null

  async function handleAddComment(body) {
    return addComment(body)
  }

  async function handleAddReply(body) {
    const success = await addReply(replyingTo, body)
    if (success !== false) setReplyingTo(null)
    return success
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-heading text-xl text-pencil">
        Comments {comments.length > 0 && <span className="font-body text-base opacity-50">({comments.length})</span>}
      </h3>

      {user ? (
        <CommentForm
          onSubmit={handleAddComment}
          submitting={submitting}
          placeholder="Share your thoughts…"
        />
      ) : (
        <p className="font-body text-sm text-pencil opacity-60">
          Sign in to comment
        </p>
      )}

      {error && (
        <p className="font-body text-sm text-accent">{error}</p>
      )}

      {loading ? (
        <p className="font-body text-sm text-pencil opacity-50">Loading comments…</p>
      ) : (
        <>
          <CommentList
            comments={comments}
            onReply={user ? (id) => setReplyingTo(id) : undefined}
            onDelete={deleteComment}
          />

          {replyingTo !== null && (
            <div className="mt-2 flex flex-col gap-2 ml-4 md:ml-6 border-l-2 border-muted pl-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-pencil opacity-60">
                  Replying to @{replyingToComment?.author_username || 'comment'}
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="font-body text-xs text-pencil opacity-50 hover:opacity-100 transition-opacity"
                >
                  Cancel
                </button>
              </div>
              <CommentForm
                onSubmit={handleAddReply}
                submitting={submitting}
                placeholder="Write a reply…"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
