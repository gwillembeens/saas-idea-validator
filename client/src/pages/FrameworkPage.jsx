import { useSelector } from 'react-redux'
import { AppShell } from '../components/layout/AppShell'
import { AuthModal } from '../components/auth/AuthModal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { FRAMEWORK_PHASES } from '../utils/frameworkSteps'

const CARD_DECORATIONS = ['tape', 'tack', 'tape', 'tack']
const CARD_ROTATIONS = [-1, 1, 0, -1]

export function FrameworkPage() {
  const user = useSelector(s => s.auth.user)
  const { openModal } = useAuth()

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-2xl text-center">
            <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-6">
              The 30-Step Framework
            </h1>
            <p className="font-body text-lg md:text-xl text-pencil mb-12 leading-relaxed">
              Sign in to explore the full validation framework used to evaluate your ideas.
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

        {/* Hero */}
        <div className="w-full max-w-2xl text-center mb-16">
          <h1 className="font-heading text-5xl md:text-6xl text-pencil mb-6 leading-tight">
            The 30-Step Framework
          </h1>
          <p className="font-body text-lg md:text-xl text-pencil leading-relaxed">
            Every idea is scored against this framework for building defensible, agent-native SaaS businesses.
            These are the 30 moves that separate founders who ship from founders who stall.
          </p>
        </div>

        {/* Phase Cards */}
        <div className="w-full max-w-2xl flex flex-col gap-12">
          {FRAMEWORK_PHASES.map((phase, index) => (
            <Card
              key={phase.id}
              decoration={CARD_DECORATIONS[index]}
              rotate={CARD_ROTATIONS[index]}
            >
              <div className="md:px-2 md:py-2">
                {/* Phase heading */}
                <h2 className="font-heading text-3xl md:text-4xl text-pencil mb-8">
                  Phase {phase.id} — {phase.name}
                </h2>

                {/* Steps list */}
                <div className="flex flex-col gap-6">
                  {phase.steps.map(step => (
                    <div key={step.number} className="flex gap-4">
                      {/* Step number */}
                      <span className="font-heading text-2xl text-pencil flex-shrink-0 w-10 text-right leading-tight">
                        {step.number}
                      </span>

                      {/* Step content */}
                      <div>
                        <p className="font-body text-lg text-pencil font-semibold leading-snug mb-1">
                          {step.name}
                        </p>
                        <p className="font-body text-base text-pencil opacity-75 leading-relaxed">
                          {step.why}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-20 md:mt-24" />
      </div>

      <AuthModal />
    </AppShell>
  )
}
