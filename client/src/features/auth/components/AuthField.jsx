export default function AuthField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  disabled = false,
}) {
  return (
    <div>
      <label className="input-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input-field"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
      />
    </div>
  );
}
