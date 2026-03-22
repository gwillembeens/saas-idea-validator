export function Card({ decoration = 'none', rotate = 0, children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        transform: `rotate(${rotate}deg)`,
      }}
      className={`bg-white shadow-hard p-6 relative ${className}`}
    >
      {decoration === 'tape' && (
        <div
          style={{ transform: 'rotate(1deg)' }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-400 opacity-40"
        />
      )}
      {decoration === 'tack' && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent shadow-hardRed"
        />
      )}
      {children}
    </div>
  )
}
