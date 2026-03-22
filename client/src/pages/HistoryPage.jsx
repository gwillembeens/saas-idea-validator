import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { AppShell } from '../components/layout/AppShell'
import { AuthModal } from '../components/auth/AuthModal'
import { HistoryCard } from '../components/history/HistoryCard'
import { useHistory } from '../hooks/useHistory'
import { selectFilteredHistory } from '../store/slices/historySlice'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

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
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">

        {/* Title and sort toggle */}
        <div className="w-full max-w-4xl mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h1 className="font-heading text-5xl md:text-6xl text-pencil">
              Your Validation History
            </h1>
            <button
              onClick={toggleSort}
              className="font-body text-lg text-blue hover:text-accent transition-colors"
            >
              Sort by: {sort === 'date' ? 'Date ↓' : 'Score ↓'}
            </button>
          </div>
        </div>

        {/* Results grid */}
        {items.length === 0 && status === 'idle' ? (
          <div className="w-full max-w-4xl text-center py-20">
            <p className="font-body text-lg text-pencil opacity-60">
              No saved validations yet. Validate your first idea →
            </p>
          </div>
        ) : (
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {filteredItems.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onDelete={deleteItem}
                onRename={renameItem}
              />
            ))}
          </div>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div className="w-full max-w-4xl text-center py-8">
            <p className="font-body text-lg text-pencil opacity-60">Loading...</p>
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
