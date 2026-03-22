import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { History } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { AuthModal } from '../components/auth/AuthModal'
import { HistoryCard } from '../components/history/HistoryCard'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useHistory } from '../hooks/useHistory'
import { selectFilteredHistory } from '../store/slices/historySlice'
import { useAuth } from '../hooks/useAuth'

function SkeletonHistoryRow({ delay = 0 }) {
  return (
    <div className="flex items-start gap-4">
      {/* Ranking placeholder */}
      <div className="w-10 pt-4 flex-shrink-0 flex justify-center">
        <div className="w-7 h-7 bg-muted rounded animate-pulse" style={{ animationDelay: `${delay}s` }} />
      </div>

      {/* Card placeholder */}
      <div
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        className="flex-1 bg-white border-2 border-muted shadow-hardSm p-6 space-y-4"
      >
        {/* Title skeleton */}
        <div className="h-6 bg-muted rounded animate-pulse w-2/3" style={{ animationDelay: `${delay}s` }} />

        {/* Snippet skeleton — 2 lines */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ animationDelay: `${delay}s` }} />
          <div className="h-4 bg-muted rounded animate-pulse w-4/5" style={{ animationDelay: `${delay}s` }} />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 bg-muted rounded animate-pulse w-1/4" style={{ animationDelay: `${delay}s` }} />
          <div className="h-4 bg-muted rounded animate-pulse w-1/5" style={{ animationDelay: `${delay}s` }} />
        </div>
      </div>
    </div>
  )
}

export function HistoryPage() {
  const user = useSelector(s => s.auth.user)
  const { openModal } = useAuth()
  const { items, status, hasMore, sort, fetchHistory, loadMore, deleteItem, renameItem, toggleSort } = useHistory()
  const filteredItems = useSelector(selectFilteredHistory)
  const sentinelRef = useRef(null)

  // Fetch history on mount and when sort changes
  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user, sort])

  // Infinite scroll: observe sentinel element
  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && status !== 'loading') {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, status])

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-2xl text-center">
            <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-6">
              Your Validation History
            </h1>
            <p className="font-body text-lg md:text-xl text-pencil mb-12 leading-relaxed">
              Sign in to see your saved ideas and past validations.
            </p>
            <Button variant="primary" onClick={() => openModal('login')}>
              Sign In
            </Button>
          </div>
        </div>
        <AuthModal />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8">

        {/* Title — its own line */}
        <div className="w-full max-w-4xl mb-6">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil">
            Your Validation History
          </h1>
        </div>

        {/* Sort toggle — separate line below title */}
        <div className="w-full max-w-4xl mb-8 flex items-center justify-end">
          <button
            onClick={toggleSort}
            className="font-body text-lg text-blue hover:text-accent transition-colors underline decoration-dotted"
          >
            Sort by: {sort === 'date' ? 'Date ↓' : 'Score ↓'}
          </button>
        </div>

        {/* Results — full-width rows with ranking numbers */}
        {items.length === 0 && status !== 'loading' ? (
          <div className="w-full max-w-4xl py-16 px-4">
            <Card decoration="none" rotate={0}>
              <div className="flex flex-col items-center text-center py-8 gap-6">
                <History size={48} className="text-pencil opacity-50" strokeWidth={2.5} />
                <h2 className="font-heading text-3xl md:text-4xl text-pencil">
                  No validations yet
                </h2>
                <p className="font-body text-lg text-pencil opacity-70 max-w-sm leading-relaxed">
                  Validate your first SaaS idea to start building your history.
                </p>
                <Link to="/">
                  <Button variant="primary">
                    Validate Your First Idea
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          <div className="w-full max-w-4xl flex flex-col gap-4 mb-12">
            {filteredItems.map((item, index) => (
              <div key={item.id} className="flex items-start gap-4">
                {/* Ranking number */}
                <div className="flex items-center justify-center w-10 pt-4 flex-shrink-0">
                  <span className="font-heading text-2xl text-pencil">
                    #{index + 1}
                  </span>
                </div>
                {/* HistoryCard — full width */}
                <div className="flex-1 min-w-0">
                  <HistoryCard
                    item={item}
                    onDelete={deleteItem}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading state — skeleton rows */}
        {status === 'loading' && (
          <div className="w-full max-w-4xl flex flex-col gap-4 mb-12">
            {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
              <SkeletonHistoryRow key={`skeleton-${i}`} delay={delay} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="w-full h-px" />
        )}

        {/* Footer spacing */}
        <div className="mt-20 md:mt-24" />

      </div>

      {/* Auth Modal */}
      <AuthModal />
    </AppShell>
  )
}
