import {
  SUBDIVISION_OPTIONS,
  COUNT_IN_OPTIONS,
} from '../../groove/grooveConstants'

const BEATS_PER_BAR = 4 // MVP is locked to 4/4

function Segmented({ options, value, onChange, disabled, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex gap-1 bg-muted/40 rounded-md p-1">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-2 py-1.5 text-sm font-semibold rounded transition-colors ${
              active ? 'bg-primary text-light' : 'text-dark/70 hover:text-dark'
            } ${disabled ? 'opacity-40' : ''}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function GrooveControls({
  countInBars,
  timeDivision,
  showToms,
  onCountInChange,
  onTimeDivisionChange,
  onShowTomsChange,
  onClearAll,
}) {
  const subdivisionPerBeat = timeDivision / BEATS_PER_BAR
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs text-dark/60 font-semibold uppercase tracking-wide mb-1 block">
          Count-in
        </label>
        <Segmented
          ariaLabel="Count-in bars"
          value={countInBars}
          onChange={onCountInChange}
          options={COUNT_IN_OPTIONS.map((n) => ({
            value: n,
            label: n === 0 ? 'Off' : `${n} bar${n === 1 ? '' : 's'}`,
          }))}
        />
      </div>

      <div>
        <label
          htmlFor="groove-subdivision"
          className="text-xs text-dark/60 font-semibold uppercase tracking-wide mb-1 block"
        >
          Division
        </label>
        <select
          id="groove-subdivision"
          value={subdivisionPerBeat}
          onChange={(e) => onTimeDivisionChange(parseInt(e.target.value, 10) * BEATS_PER_BAR)}
          className="w-full bg-muted/40 text-dark rounded-md px-3 py-2 text-sm font-semibold border border-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SUBDIVISION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-light text-dark">
              {opt.value} — {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-dark/80">
          <input
            type="checkbox"
            checked={showToms}
            onChange={(e) => onShowTomsChange(e.target.checked)}
            className="accent-primary"
          />
          Show toms
        </label>
        <button
          onClick={onClearAll}
          className="text-xs text-dark/60 hover:text-dark px-2 py-1 rounded border border-muted"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
