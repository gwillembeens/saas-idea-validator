export function TextArea({ value, onChange, placeholder, disabled = false, className = '' }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        borderColor: '#2d2d2d',
        borderWidth: '2px',
        borderStyle: 'solid',
      }}
      className={`
        font-body text-lg text-pencil
        w-full p-4 bg-white
        resize-none min-h-[150px]
        transition-colors duration-100
        focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue focus:ring-opacity-20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  )
}
