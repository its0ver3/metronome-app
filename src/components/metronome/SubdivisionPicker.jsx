import { SUBDIVISION_OPTIONS } from '../../audio/constants'
import { useId } from 'react'

export default function SubdivisionPicker({
  subdivision,
  onChange,
  disabled = false,
  accessibleLabel,
  className = '',
}) {
  const selectId = useId()

  return (
    <div className={`pulse-subdivision-picker flex flex-col items-center gap-1 ${disabled ? 'opacity-40' : ''} ${className}`}>
      <label
        htmlFor={selectId}
        className="text-xs text-dark/50 font-semibold uppercase tracking-wide"
      >
        Subdivision
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={subdivision}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          disabled={disabled}
          aria-label={accessibleLabel}
          aria-describedby={disabled ? `${selectId}-status` : undefined}
          className="h-11 px-3 pr-7 rounded-lg bg-secondary text-dark font-semibold text-sm appearance-none cursor-pointer disabled:cursor-not-allowed w-16"
        >
          {SUBDIVISION_OPTIONS.map((opt) => (
            <option key={opt.type} value={opt.type}>
              {opt.desc}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/40 text-xs">
          ▼
        </span>
      </div>
      {disabled && (
        <span id={`${selectId}-status`} className="sr-only">
          Controlled by Subdivision Trainer
        </span>
      )}
    </div>
  )
}
