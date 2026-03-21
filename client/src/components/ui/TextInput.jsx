export function TextInput({ label, type = 'text', value, onChange, placeholder, disabled }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="font-body text-sm text-pencil">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="font-body text-lg text-pencil bg-paper border-2 border-pencil px-4 py-2 w-full focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-50 resize-none"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      />
    </div>
  )
}
