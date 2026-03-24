import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'

export function CommentItem({ comment, onReply, onDelete, isReply = false }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {comment.author_username ? (
          <Link
            to={`/profile/${comment.author_username}`}
            onClick={e => e.stopPropagation()}
            className="font-heading text-sm text-pencil hover:text-accent transition-colors"
          >
            {comment.author_username}
          </Link>
        ) : (
          <span className="font-heading text-sm text-pencil opacity-50">Anonymous</span>
        )}
        <span className="font-body text-xs text-pencil opacity-50">
          {formatDate(comment.created_at)}
        </span>
      </div>
      <p className="font-body text-sm text-pencil leading-snug">{comment.body}</p>
      <div className="flex items-center gap-3 mt-1">
        {onReply && !isReply && (
          <button
            onClick={() => onReply(comment.id)}
            className="font-body text-xs text-pencil opacity-50 hover:opacity-100 transition-opacity"
          >
            Reply
          </button>
        )}
        {comment.is_own && onDelete && (
          <button
            onClick={() => onDelete(comment.id)}
            className="font-body text-xs text-accent opacity-70 hover:opacity-100 transition-opacity"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
