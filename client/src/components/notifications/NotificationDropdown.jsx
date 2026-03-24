import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function NotificationDropdown({ notifications, onMarkAllRead, onClose }) {
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

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
    if (notification.event_type === 'comment') {
      navigate(`/history/${notification.result_id}`, { state: { openComments: true } })
    } else {
      navigate(`/history/${notification.result_id}`)
    }
    onClose()
  }

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-3 z-50 w-80">
      {/* Upward caret arrow pointing to bell */}
      <div
        className="absolute -top-2 right-4"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '10px solid #2d2d2d',
        }}
      />
      <div
        className="absolute -top-1 right-4"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '10px solid #fff9c4',
          zIndex: 1,
        }}
      />

      {/* Panel */}
      <div
        className="bg-postit shadow-hardLg overflow-hidden"
        style={{
          border: '2px solid #2d2d2d',
          borderRadius: '8px',
        }}
      >
        {notifications.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="font-body text-pencil text-sm leading-relaxed">
              Share a validation to start getting likes and comments
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(45,45,45,0.15)' }}>
              <h3 className="font-heading text-base text-pencil">Notifications</h3>
              <button
                onClick={onMarkAllRead}
                className="font-body text-xs text-blue hover:text-accent transition-colors underline"
              >
                Mark all read
              </button>
            </div>

            {/* Notification rows */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif, idx) => (
                <button
                  key={`${notif.event_type}-${notif.result_id}-${idx}`}
                  onClick={() => handleNotificationClick(notif)}
                  className="w-full text-left px-4 py-3 hover:bg-yellow-200 transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(45,45,45,0.12)',
                    backgroundColor: notif.is_unread ? 'rgba(255,255,255,0.7)' : 'transparent',
                  }}
                >
                  {notif.is_unread && (
                    <span
                      className="inline-block w-2 h-2 bg-accent rounded-full mr-2 mb-0.5 align-middle flex-shrink-0"
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                  <span className="font-body text-sm text-pencil">
                    <span className="font-bold">
                      {notif.most_recent_actor_username || 'Someone'}
                    </span>
                    {' '}
                    {notif.event_type === 'like' ? 'liked' : 'commented on'}
                    {' '}
                    <span className="italic">"{notif.validation_title}"</span>
                  </span>
                  <div className="font-body text-xs text-pencil opacity-50 mt-0.5 ml-4">
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

            {/* Footer */}
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(45,45,45,0.15)' }}>
              <button
                onClick={() => { navigate('/notifications'); onClose() }}
                className="font-body text-xs text-blue hover:text-accent transition-colors underline w-full text-center"
              >
                View all notifications →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
