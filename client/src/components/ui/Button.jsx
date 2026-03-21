export function Button({ variant = 'primary', onClick, disabled = false, type = 'button', children, className = '' }) {
  const base = 'font-body text-pencil text-lg md:text-2xl h-12 px-6 transition-all duration-100 border-2 border-pencil shadow-hard'

  const variants = {
    primary: 'bg-white hover:bg-accent hover:text-white',
    secondary: 'bg-muted hover:bg-blue hover:text-white',
  }

  const activeClasses = !disabled ? 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' : ''
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      className={`${base} ${variants[variant] || variants.primary} ${activeClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  )
}
