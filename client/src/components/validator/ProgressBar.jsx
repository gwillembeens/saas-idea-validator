export function ProgressBar({ isVisible, progress = 0, label = 'Validating your idea…' }) {
  if (!isVisible) return null

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      {/* Label */}
      {label && (
        <p className="font-body text-lg text-pencil mb-3 text-center">{label}</p>
      )}

      {/* Progress bar outer track */}
      <div
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        className="w-full h-5 bg-paper border-2 border-pencil shadow-hard p-1 overflow-hidden"
      >
        {/* Progress bar fill */}
        <div
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            backgroundColor: '#10b981',
            transition: 'width 0.5s ease-out',
          }}
          className="h-full"
        />
      </div>
    </div>
  )
}
