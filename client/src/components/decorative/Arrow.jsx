export function Arrow({ direction = 'right', className = '' }) {
  const rotations = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  }

  return (
    <svg
      viewBox="0 0 120 60"
      width="120"
      height="60"
      style={{ transform: `rotate(${rotations[direction] || 0}deg)` }}
      className={`hidden md:block ${className}`}
    >
      {/* Arrow shaft — slightly wobbly path */}
      <path
        d="M 10 30 Q 30 28 50 30 Q 70 32 90 30"
        stroke="#2d2d2d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <path
        d="M 78 18 L 100 30 L 78 42"
        stroke="#2d2d2d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
