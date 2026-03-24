import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Link } from 'react-router-dom'
import { FeedCard } from '../components/feed/FeedCard'
import { useFeed } from '../hooks/useFeed'
import { useAuth } from '../hooks/useAuth'

export function FeedPage() {
  const { items, hasMore, loading, error, sentinelRef } = useFeed()
  const { user, openModal } = useAuth()

  // Page label: "Personalised for you" if logged in, else "Trending"
  const isPersonalised = !!user
  const feedLabel = isPersonalised ? '✨ Personalised for you' : '✨ Trending'

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-heading text-4xl md:text-5xl text-pencil mb-2">Feed</h1>
          <p className="font-body text-base text-pencil opacity-60">{feedLabel}</p>
        </div>

        {/* Logged-out CTA banner */}
        {!user && (
          <Card decoration="none" className="mb-6 p-5 text-center">
            <p className="font-body text-base text-pencil mb-3">
              Sign in to personalise your feed based on the niches you validate in
            </p>
            <Button variant="secondary" onClick={() => openModal('login')}>
              Sign In
            </Button>
          </Card>
        )}

        {/* Feed cards */}
        <div className="flex flex-col gap-4">
          {items.length === 0 && !loading && !error && (
            <Card decoration="none" className="text-center py-10">
              <p className="font-body text-lg text-pencil mb-4">
                No validations yet — be the first to share one
              </p>
              <Link to="/">
                <Button variant="primary">Validate an idea</Button>
              </Link>
            </Card>
          )}

          {items.map(item => (
            <FeedCard key={item.id} {...item} />
          ))}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-muted animate-pulse rounded"
                  style={{ height: 120, borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <Card decoration="none" className="text-center py-8">
              <p className="font-body text-base text-accent">
                Failed to load feed. Please try again.
              </p>
            </Card>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
        </div>
      </div>
    </AppShell>
  )
}
