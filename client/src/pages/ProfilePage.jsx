import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Avatar } from '../components/ui/Avatar'
import { NichePill } from '../components/ui/NichePill'
import { RevisionChains } from '../components/profile/RevisionChains'
import { AnalyticsSection } from '../components/profile/AnalyticsSection'

function StatItem({ label, value }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-heading text-lg md:text-xl text-pencil leading-none">{value}</span>
      <span className="font-body text-xs text-pencil opacity-50">{label}</span>
    </div>
  )
}

export function ProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      setNotFound(false)
      setError(null)
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json()
        setProfile(data)
      } catch (err) {
        setError('Could not load this profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-6 py-12">

        {loading && (
          <p className="font-body text-pencil opacity-60">Loading profile…</p>
        )}

        {notFound && (
          <div className="text-center py-20">
            <p className="font-heading text-3xl text-pencil mb-4">Profile not found</p>
            <p className="font-body text-pencil opacity-60 mb-8">
              No user with username <span className="font-heading">@{username}</span> exists.
            </p>
            <Link to="/leaderboard" className="font-body text-blue hover:text-accent transition-colors">
              Browse the leaderboard →
            </Link>
          </div>
        )}

        {error && (
          <p className="font-body text-accent">{error}</p>
        )}

        {profile && !loading && (
          <>
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center mb-10 gap-4">
              <Avatar
                displayName={profile.display_name}
                username={profile.username}
                size="lg"
              />
              <div>
                <h1 className="font-heading text-3xl md:text-4xl text-pencil leading-tight">
                  {profile.display_name || `@${profile.username}`}
                </h1>
                {profile.display_name && (
                  <p className="font-body text-base text-pencil opacity-60 mt-1">
                    @{profile.username}
                  </p>
                )}
              </div>

              {/* Stat row */}
              {profile.stats.total_public > 0 && (
                <div
                  className="flex items-center gap-5 px-6 py-3 bg-paper border-2 border-pencil shadow-hard mt-2"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <StatItem label="validations" value={profile.stats.total_public} />
                  <span className="text-pencil opacity-20 font-body text-lg">·</span>
                  <StatItem label="avg score" value={`${parseFloat(profile.stats.avg_score).toFixed(1)}/5`} />
                  <span className="text-pencil opacity-20 font-body text-lg">·</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <NichePill niche={profile.stats.top_niche} size="sm" />
                    <span className="font-body text-xs text-pencil opacity-50">top niche</span>
                  </div>
                  <span className="text-pencil opacity-20 font-body text-lg">·</span>
                  <StatItem label="personal best" value={`${parseFloat(profile.stats.personal_best).toFixed(1)}/5`} />
                </div>
              )}
            </div>

            {/* Revision Chains */}
            <RevisionChains chains={profile.chains} />

            {/* Analytics Section */}
            <AnalyticsSection analytics={profile.analytics} />
          </>
        )}

      </main>
    </AppShell>
  )
}
