import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { SignInButton } from '../components/auth/SignInButton'
import { AuthModal } from '../components/auth/AuthModal'

export function ResultPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/history/${id}`)
        if (!res.ok) throw new Error('Result not found')
        const data = await res.json()
        setResult(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
  }, [id])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <p className="font-body text-lg text-pencil">Loading...</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <h1 className="font-heading text-5xl text-pencil mb-4">Not Found</h1>
          <p className="font-body text-lg text-pencil">{error}</p>
          <a href="/" className="mt-6 text-blue font-body underline">← Back Home</a>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">

        {/* Header with SignInButton */}
        <header className="absolute top-4 right-4 md:top-6 md:right-6">
          <SignInButton />
        </header>

        {/* Title */}
        <div className="w-full max-w-4xl text-center mb-12">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-2">
            {result?.title}
          </h1>
        </div>

        {/* Content will be rendered here by split-card components in 10-04 */}

        {/* Footer spacing */}
        <div className="mt-20 md:mt-24" />

      </div>

      {/* Auth Modal */}
      <AuthModal />
    </AppShell>
  )
}
