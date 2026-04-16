import {
  TIME_DIVISIONS,
  COUNT_IN_OPTIONS,
} from '../../groove/grooveConstants'

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
        <label className="text-xs text-dark/60 font-semibold uppercase tracking-wide mb-1 block">
          Division
        </label>
        <Segmented
          ariaLabel="Time division"
          value={timeDivision}
          onChange={onTimeDivisionChange}
          options={TIME_DIVISIONS.map((d) => ({
            value: d,
            label: String(d),
          }))}
        />
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
