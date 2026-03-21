export function Squiggle({ direction = 'right', className = '' }) {
  const rotations = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  }

  return (
    <svg
      viewBox="0 0 160 40"
      width="160"
      height="40"
      style={{ transform: `rotate(${rotations[direction] || 0}deg)` }}
      className={`hidden md:block ${className}`}
    >
      {/* Squiggly line using quadratic Bézier curves */}
      <path
        d="M 10 20 Q 30 5 50 20 Q 70 35 90 20 Q 110 5 130 20 Q 145 30 150 20"
        stroke="#2d2d2d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
