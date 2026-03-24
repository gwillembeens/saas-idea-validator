import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'

export function NotificationDropdown({ notifications, onMarkAllRead, onClose }) {
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleNotificationClick = (notification) => {
    const resultId = notification.result_id
    // Comment notifications should auto-open CommentModal
    if (notification.event_type === 'comment') {
      navigate(`/history/${resultId}`, { state: { openComments: true } })
    } else {
      navigate(`/history/${resultId}`)
    }
    onClose()
  }

  if (notifications.length === 0) {
    return (
      <div ref={dropdownRef} className="absolute right-0 top-full mt-2 z-50 w-80">
        <Card decoration="tack" className="p-4">
          <p className="font-body text-center text-pencil text-sm">
            Share a validation to start getting likes and comments
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 z-50 w-96">
      <Card decoration="tack" className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-muted">
          <h3 className="font-heading text-lg text-pencil">Notifications</h3>
          <button
            onClick={onMarkAllRead}
            className="font-body text-xs text-blue hover:text-accent transition-colors underline"
          >
            Mark all as read
          </button>
        </div>

        {/* Notification list */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notif, idx) => (
            <button
              key={`${notif.event_type}-${notif.result_id}-${idx}`}
              onClick={() => handleNotificationClick(notif)}
              className={`w-full text-left px-4 py-3 border-b border-muted hover:bg-postit/30 transition-colors ${
                notif.is_unread ? 'bg-postit/10' : ''
              }`}
            >
              <div className="font-body text-sm text-pencil">
                <span className="font-bold">
                  {notif.most_recent_actor_username || 'Someone'}
                </span>
                {' '}
                {notif.event_type === 'like' ? 'liked' : 'commented on'}
                {' '}
                <span className="italic">"{notif.validation_title}"</span>
              </div>
              <div className="font-body text-xs text-pencil opacity-60 mt-1">
                {notif.actor_count > 1 && `${notif.actor_count} people · `}
                {new Date(notif.most_recent_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </button>
          ))}
        </div>

        {/* Footer link */}
        <div className="px-4 py-3 border-t border-muted">
          <a
            href="/notifications"
            onClick={(e) => {
              e.preventDefault()
              navigate('/notifications')
              onClose()
            }}
            className="font-body text-sm text-blue hover:text-accent transition-colors underline"
          >
            View all notifications →
          </a>
        </div>
      </Card>
    </div>
  )
}
