import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setIdea } from '../../store/slices/validatorSlice'
import { useChallengeScores } from '../../hooks/useChallengeScores'
import ChallengeCard from './ChallengeCard'

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-48 bg-muted animate-pulse"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        />
      ))}
    </div>
  )
}

export default function ChallengeSection() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { topScores, loading, error } = useChallengeScores()

  function handleTryNiche(niche) {
    dispatch(setIdea(`I'm building a ${niche} SaaS that...`))
    navigate('/')
  }

  return (
    <section className="mb-6">
      <h2
        className="font-heading text-2xl text-pencil mb-3"
        style={{ transform: 'rotate(-1deg)', display: 'inline-block' }}
      >
        Beat the Leaderboard
      </h2>

      {loading && <LoadingSkeleton />}

      {error && (
        <p className="font-body text-sm text-accent">
          Could not load challenge scores. Try refreshing.
        </p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3">
          {topScores.map(({ niche, score }) => (
            <ChallengeCard
              key={niche}
              niche={niche}
              topScore={score}
              onTryNiche={() => handleTryNiche(niche)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
