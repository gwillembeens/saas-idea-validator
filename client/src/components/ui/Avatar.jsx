// 6 paper-adjacent palette colors for avatar backgrounds
const AVATAR_COLORS = [
  '#e8d5b7', // warm parchment
  '#b7d5e8', // blue-grey
  '#d5e8b7', // sage green
  '#e8b7d5', // dusty rose
  '#e8e0b7', // pale gold
  '#d5b7e8', // lavender
]

function hashUsername(username) {
  if (!username) return 0
  let sum = 0
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i)
  }
  return sum % AVATAR_COLORS.length
}

function getInitial(displayName) {
  if (!displayName || !displayName.trim()) return '?'
  return displayName.trim()[0].toUpperCase()
}

/**
 * Avatar component — initials badge with deterministic hash color
 * @param {string} displayName — used for initial letter
 * @param {string} username — used for color hash
 * @param {'lg' | 'sm'} size — lg=64px (profile header), sm=28px (NavBar)
 * @param {string} className — additional Tailwind classes
 */
export function Avatar({ displayName, username, size = 'lg', className = '' }) {
  const colorIdx = hashUsername(username || displayName)
  const bgColor = AVATAR_COLORS[colorIdx]
  const initial = getInitial(displayName)

  const dimension = size === 'sm' ? 28 : 64
  const fontSize = size === 'sm' ? '12px' : '24px'
  const fontWeight = size === 'sm' ? '700' : '700'

  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 font-heading text-pencil border-2 border-pencil ${className}`}
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: bgColor,
        borderRadius: '50%',
        fontSize,
        fontWeight,
        transform: 'rotate(-1deg)',
        boxShadow: size === 'lg' ? '2px 2px 0px 0px #2d2d2d' : '1px 1px 0px 0px #2d2d2d',
        lineHeight: 1,
      }}
      aria-label={`Avatar for ${displayName || username || 'user'}`}
    >
      {initial}
    </div>
  )
}
