export function Button({
  variant = 'primary',
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const baseClasses = 'font-body text-lg md:text-xl h-12 md:h-14 px-6 md:px-8 transition-all duration-100 inline-flex items-center justify-center font-medium'

  const variantClasses = {
    primary: `
      bg-paper text-pencil shadow-hard
      hover:bg-accent hover:text-white
      active:translate-x-1 active:translate-y-1 active:shadow-none
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-paper disabled:hover:text-pencil
    `.trim(),
    secondary: `
      bg-muted text-pencil shadow-hard
      hover:bg-blue hover:text-white
      active:translate-x-1 active:translate-y-1 active:shadow-none
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted disabled:hover:text-pencil
    `.trim(),
  }

  return (
    <button
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      style={{
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        WebkitTapHighlightColor: 'transparent',
      }}
      {...props}
    >
      {children}
    </button>
  )
}
