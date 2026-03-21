export function ScoreBar({ score }) {
  return (
    <div
      style={{ transform: 'rotate(-1deg)' }}
      className="flex gap-2"
    >
      {[1, 2, 3, 4, 5].map((num) => {
        const filled = num <= score
        return (
          <div
            key={num}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: filled ? '#2d2d2d' : '#e5e0d8',
              boxShadow: filled ? '4px 4px 0px 0px #2d2d2d' : 'none',
              transition: 'all 200ms ease-out',
            }}
          />
        )
      })}
    </div>
  )
}
