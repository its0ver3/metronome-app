import SubdivisionDropdown from './SubdivisionDropdown.jsx'

export default function SubdivisionPicker({
  subdivision,
  onChange,
  disabled = false,
  accessibleLabel,
  className = '',
  denominator = 4,
}) {
  return (
    <div className={`pulse-subdivision-picker flex flex-col items-center gap-1 ${className}`}>
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">Subdivision</span>
      <SubdivisionDropdown value={subdivision} onChange={onChange} disabled={disabled} denominator={denominator} allowGroupOnly={denominator === 8} label={accessibleLabel || 'Subdivision'} />
      {disabled && <span className="sr-only">Controlled by Subdivision Trainer</span>}
    </div>
  )
}
