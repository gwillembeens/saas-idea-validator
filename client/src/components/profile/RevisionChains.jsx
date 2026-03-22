import { Link } from 'react-router-dom'

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null
  const isPositive = delta > 0
  const isNegative = delta < 0
  const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-pencil opacity-50'
  const label = isPositive ? `+${delta.toFixed(1)}` : delta === 0 ? '±0.0' : delta.toFixed(1)
  return (
    <span className={`font-body text-xs ${color} ml-1`}>{label}</span>
  )
}

function VersionPill({ version, isFirst }) {
  const weighted = version.scores?.weighted ?? 0
  return (
    <Link
      to={`/history/${version.id}`}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-paper border-2 border-pencil font-body text-xs text-pencil hover:bg-postit transition-colors shadow-hardSm no-underline"
      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
    >
      <span className="font-heading text-sm">{weighted.toFixed(1)}/5</span>
      {!isFirst && <DeltaBadge delta={version.delta} />}
    </Link>
  )
}

export function RevisionChains({ chains }) {
  if (!chains || chains.length === 0) return null

  return (
    <section className="mt-12">
      <h2
        className="font-heading text-2xl md:text-3xl text-pencil mb-6"
        style={{ transform: 'rotate(-1deg)' }}
      >
        Revision Chains
      </h2>
      <div className="flex flex-col gap-8">
        {chains.map((chain, i) => (
          <div
            key={i}
            className="bg-paper border-2 border-pencil p-5 shadow-hard"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <p className="font-body text-sm text-pencil opacity-60 mb-3">
              {chain.lineage_title}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {chain.versions.map((version, j) => (
                <div key={version.id} className="flex items-center gap-2">
                  {j > 0 && (
                    <span className="font-body text-base text-pencil opacity-40">→</span>
                  )}
                  <VersionPill version={version} isFirst={j === 0} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
