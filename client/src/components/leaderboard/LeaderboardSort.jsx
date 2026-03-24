export function LeaderboardSort({ sort, onSort }) {
  const options = [
    { value: 'score', label: 'Top Score' },
    { value: 'likes', label: 'Most Liked' },
  ]

  return (
    <div className="flex gap-2">
      {options.map(opt => {
        const isActive = sort === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onSort(opt.value)}
            className={`flex-shrink-0 px-4 py-2 font-body text-sm border-2 transition-colors ${
              isActive
                ? 'bg-pencil text-paper border-pencil'
                : 'bg-paper text-pencil border-muted hover:border-pencil'
            }`}
            style={{ borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px' }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
