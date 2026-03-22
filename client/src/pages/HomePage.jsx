import { useSelector } from 'react-redux'
import { AppShell } from '../components/layout/AppShell'
import { IdeaInput } from '../components/validator/IdeaInput'
import { ResultsPanel } from '../components/validator/ResultsPanel'
import { Arrow } from '../components/decorative/Arrow'
import { AuthModal } from '../components/auth/AuthModal'

export function HomePage() {
  const status = useSelector(s => s.validator.status)

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 md:px-8 relative">

        {/* Hero Section */}
        <div className="w-full max-w-2xl text-center mb-20 md:mb-24">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-6 leading-tight">
            Validate Your SaaS Idea
          </h1>
          <p className="font-body text-lg md:text-xl text-pencil leading-relaxed">
            Paste your startup idea and get an honest, investor-grade analysis against our
            30-step framework for building agent-native SaaS businesses.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-2xl mb-20 md:mb-24">
          <IdeaInput />
        </div>

        {/* Arrow decoration — hidden on mobile */}
        {status !== 'idle' && (
          <div className="hidden md:flex justify-center mb-12">
            <Arrow direction="down" />
          </div>
        )}

        {/* Results Section */}
        {status !== 'idle' && (
          <div className="w-full">
            <ResultsPanel />
          </div>
        )}

        {/* Footer spacing */}
        <div className="mt-20 md:mt-24" />

      </div>

      {/* Auth Modal */}
      <AuthModal />
    </AppShell>
  )
}
