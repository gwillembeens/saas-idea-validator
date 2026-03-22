import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAuth } from '../hooks/useAuth'
import { setUserProfile } from '../store/slices/authSlice'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { AppShell } from '../components/layout/AppShell'
import { NavBar } from '../components/layout/NavBar'
import { Lock } from 'lucide-react'

export function SettingsPage() {
  const dispatch = useDispatch()
  const { user } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [isUsernameLocked, setIsUsernameLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Fetch current settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetchWithAuth('/api/me')
        if (!res.ok) throw new Error('Failed to load settings')
        const data = await res.json()
        setDisplayName(data.display_name || '')
        setUsername(data.username || '')
        setIsUsernameLocked(data.username !== null)
      } catch (err) {
        setError('Could not load your settings. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    const body = { display_name: displayName }
    if (!isUsernameLocked && username.trim()) {
      body.username = username.trim()
    }

    try {
      const res = await fetchWithAuth('/api/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save settings')
        return
      }
      // Update Redux so NavBar avatar reflects the new display name
      dispatch(setUserProfile({
        displayName: data.display_name,
        username: data.username,
      }))
      setDisplayName(data.display_name || '')
      setUsername(data.username || '')
      if (data.username) setIsUsernameLocked(true)
      setSuccessMsg('Settings saved!')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <NavBar />
      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="font-heading text-3xl md:text-4xl text-pencil mb-8" style={{ transform: 'rotate(-1deg)' }}>
          Settings
        </h1>

        {loading ? (
          <p className="font-body text-pencil opacity-60">Loading…</p>
        ) : (
          <Card decoration="none" rotate={0}>
            <form onSubmit={handleSave} className="flex flex-col gap-6">

              {/* Display Name */}
              <div className="flex flex-col gap-2">
                <label className="font-body text-sm text-pencil opacity-70" htmlFor="display-name">
                  Display Name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={100}
                  placeholder="How your name appears on your profile"
                  className="font-body text-base text-pencil bg-paper border-2 border-pencil px-4 py-2 outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 w-full"
                  style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
                />
              </div>

              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="font-body text-sm text-pencil opacity-70" htmlFor="username">
                  Username
                </label>
                {isUsernameLocked ? (
                  <div className="flex flex-col gap-1">
                    <div className="relative flex items-center">
                      <input
                        id="username"
                        type="text"
                        value={username}
                        readOnly
                        className="font-body text-base text-pencil opacity-50 bg-muted border-2 border-muted px-4 py-2 pr-10 w-full cursor-not-allowed"
                        style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
                      />
                      <Lock
                        size={16}
                        strokeWidth={2.5}
                        className="absolute right-3 text-pencil opacity-40 pointer-events-none"
                      />
                    </div>
                    <p className="font-body text-xs text-pencil opacity-50">
                      Username cannot be changed once set.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_\-]+"
                      placeholder="your_username"
                      className="font-body text-base text-pencil bg-paper border-2 border-pencil px-4 py-2 outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 w-full"
                      style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
                    />
                    <p className="font-body text-xs text-pencil opacity-60">
                      ⚠ Choose carefully — this cannot be changed after saving.
                      Letters, numbers, underscores, and hyphens only (3–30 chars).
                    </p>
                  </div>
                )}
              </div>

              {/* Error / success messages */}
              {error && (
                <p className="font-body text-sm text-accent">{error}</p>
              )}
              {successMsg && (
                <p className="font-body text-sm text-green-700">{successMsg}</p>
              )}

              {/* Save button */}
              <div>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>

            </form>
          </Card>
        )}
      </main>
    </AppShell>
  )
}
