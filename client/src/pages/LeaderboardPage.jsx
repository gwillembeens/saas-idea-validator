import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { LeaderboardCard } from '../components/leaderboard/LeaderboardCard'
import ChallengeSection from '../components/leaderboard/ChallengeSection'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { NICHE_CONFIG } from '../constants/nicheConfig'

export function LeaderboardPage() {
  const user = useSelector(s => s.auth.user)
  const { items, hasMore, loading, error, sentinelRef, setNiche, loadMore, currentNiche } = useLeaderboard()
  const [searchParams] = useSearchParams()

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore, sentinelRef])

  const niches = ['All', ...Object.keys(NICHE_CONFIG)]

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-16 md:px-8">

        {/* Page title */}
        <div className="w-full max-w-3xl mb-8">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil -rotate-1">
            Leaderboard
          </h1>
          <p className="font-body text-lg text-pencil opacity-60 mt-2">
            Top public validations ranked by score
          </p>
        </div>

        {/* Unauthenticated CTA — shown only when logged out */}
        {!user && (
          <div className="w-full max-w-3xl mb-10">
            <Card decoration="tape" rotate={1}>
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="font-heading text-2xl md:text-3xl text-pencil mb-2">
                    Think yours can beat these?
                  </h2>
                  <p className="font-body text-base text-pencil opacity-70">
                    Validate your idea and see where <strong>YOU</strong> rank.
                  </p>
                </div>
                <Link to="/" className="flex-shrink-0">
                  <Button variant="primary">Validate Your Idea</Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Beat the Leaderboard challenge section */}
        <div className="w-full max-w-3xl mb-8">
          <ChallengeSection />
        </div>

        {/* Niche filter pill row */}
        <div className="w-full max-w-3xl mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {niches.map(niche => {
              const isActive = currentNiche === niche
              return (
                <button
                  key={niche}
                  onClick={() => setNiche(niche)}
                  className={`flex-shrink-0 px-4 py-2 font-body text-sm border-2 transition-colors ${
                    isActive
                      ? 'bg-pencil text-paper border-pencil'
                      : 'bg-paper text-pencil border-muted hover:border-pencil'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {niche}
                </button>
              )
            })}
          </div>
        </div>

        {/* Entry list */}
        {items.length === 0 && !loading ? (
          <div className="w-full max-w-3xl">
            <Card decoration="none" rotate={0}>
              <div className="py-16 flex flex-col items-center text-center gap-3">
                <p className="font-heading text-3xl text-pencil">No validations yet</p>
                <p className="font-body text-base text-pencil opacity-60">
                  {currentNiche === 'All'
                    ? 'Be the first to validate an idea publicly!'
                    : `No public validations in ${currentNiche} yet.`}
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3">
                {/* Rank number */}
                <div className="w-9 flex-shrink-0 pt-5 text-right">
                  <span className="font-heading text-xl text-pencil opacity-50">
                    #{index + 1}
                  </span>
                </div>
                {/* Card */}
                <div className="flex-1 min-w-0">
                  <LeaderboardCard
                    entry={item}
                    rank={index + 1}
                    isOwn={!!user && user.id === item.user_id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="w-full max-w-3xl flex flex-col gap-3 mt-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 flex-shrink-0 pt-5">
                  <div className="h-5 w-7 bg-muted rounded animate-pulse" />
                </div>
                <div
                  className="flex-1 bg-paper border-2 border-muted p-5 space-y-3"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                  <div className="flex justify-between pt-2">
                    <div className="h-5 bg-muted rounded animate-pulse w-16" />
                    <div className="h-8 bg-muted rounded animate-pulse w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="w-full max-w-3xl mt-4">
            <p className="font-body text-base text-red-700 text-center">
              Failed to load: {error}
            </p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1 w-full mt-4" />

        {/* Bottom spacing */}
        <div className="h-20" />

      </div>
    </AppShell>
  )
}
