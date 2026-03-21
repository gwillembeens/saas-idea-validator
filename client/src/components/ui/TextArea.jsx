export function TextArea({
  value = '',
  onChange,
  placeholder = '',
  disabled = false,
  className = '',
  id,
  ...props
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        w-full font-body text-lg text-pencil
        bg-white border-2 border-pencil
        placeholder:text-muted placeholder:opacity-60
        focus:border-blue focus:ring-2 focus:ring-blue/20
        focus:outline-none
        disabled:bg-muted disabled:opacity-50 disabled:cursor-not-allowed
        resize-none
        p-4
        ${className}
      `}
      style={{
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
      }}
      {...props}
    />
  )
}
