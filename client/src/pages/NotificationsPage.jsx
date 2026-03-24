import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useNotifications } from '../hooks/useNotifications'

export function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, fetchNotifications, markAllRead } = useNotifications()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        await fetchNotifications()
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [fetchNotifications])

  const handleNotificationClick = (notification) => {
    const resultId = notification.result_id
    if (notification.event_type === 'comment') {
      navigate(`/history/${resultId}`, { state: { openComments: true } })
    } else {
      navigate(`/history/${resultId}`)
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-5xl text-pencil">Notifications</h1>
          {notifications.length > 0 && (
            <Button variant="secondary" onClick={markAllRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Empty state */}
        {!isLoading && notifications.length === 0 && (
          <Card decoration="tack" className="p-8 text-center">
            <p className="font-body text-lg text-pencil mb-2">
              No notifications yet
            </p>
            <p className="font-body text-sm text-pencil opacity-60">
              Share a validation to start getting likes and comments from the community
            </p>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} decoration="none" className="p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/3 mt-2"></div>
              </Card>
            ))}
          </div>
        )}

        {/* Notification list */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notif, idx) => (
              <Card
                key={`${notif.event_type}-${notif.result_id}-${idx}`}
                decoration={notif.is_unread ? 'tack' : 'none'}
                className={`p-4 cursor-pointer transition-transform hover:rotate-1 ${
                  notif.is_unread ? 'bg-postit/5' : ''
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-pencil">
                      <span className="font-bold">
                        {notif.most_recent_actor_username || 'Someone'}
                      </span>
                      {' '}
                      {notif.event_type === 'like' ? 'liked' : 'commented on'}
                      {' '}
                      <span className="italic">"{notif.validation_title}"</span>
                    </p>
                    <p className="font-body text-xs text-pencil opacity-60 mt-2">
                      {notif.actor_count > 1 && `${notif.actor_count} people · `}
                      {new Date(notif.most_recent_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: new Date(notif.most_recent_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {notif.is_unread && (
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className="inline-block w-3 h-3 bg-accent rounded-full"
                        style={{ borderRadius: '50%' }}
                      ></span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
