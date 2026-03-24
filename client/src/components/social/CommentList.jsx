import { useState } from 'react'
import { CommentItem } from './CommentItem'

export function CommentList({ comments, onReply, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(null)

  function handleDeleteRequest(id) {
    setPendingDelete(id)
  }

  function handleDeleteConfirm() {
    if (onDelete && pendingDelete !== null) {
      onDelete(pendingDelete)
    }
    setPendingDelete(null)
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="font-body text-sm text-pencil opacity-50">
        No comments yet — be the first.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {comments.map(comment => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            onReply={onReply}
            onDelete={handleDeleteRequest}
          />

          {/* Inline delete confirmation */}
          {pendingDelete === comment.id && (
            <div className="mt-2 flex items-center gap-2">
              <span className="font-body text-xs text-pencil opacity-70">Delete this comment?</span>
              <button
                onClick={handleDeleteConfirm}
                className="font-body text-xs text-accent hover:opacity-100 opacity-70 transition-opacity"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setPendingDelete(null)}
                className="font-body text-xs text-pencil opacity-50 hover:opacity-100 transition-opacity"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-4 md:ml-6 border-l-2 border-muted pl-3 mt-3 flex flex-col gap-4">
              {comment.replies.map(reply => (
                <div key={reply.id}>
                  <CommentItem
                    comment={reply}
                    onDelete={handleDeleteRequest}
                    isReply
                  />
                  {pendingDelete === reply.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-body text-xs text-pencil opacity-70">Delete this reply?</span>
                      <button
                        onClick={handleDeleteConfirm}
                        className="font-body text-xs text-accent hover:opacity-100 opacity-70 transition-opacity"
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setPendingDelete(null)}
                        className="font-body text-xs text-pencil opacity-50 hover:opacity-100 transition-opacity"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
