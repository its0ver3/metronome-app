import {
  SUBDIVISION_OPTIONS,
  COUNT_IN_OPTIONS,
} from '../../groove/grooveConstants'

const BEATS_PER_BAR = 4 // MVP is locked to 4/4

const selectClass =
  'w-full bg-muted/40 text-dark rounded-md px-3 py-2 text-sm font-semibold border border-muted focus:outline-none focus:ring-2 focus:ring-primary'

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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="groove-countin"
            className="text-xs text-dark/60 font-semibold uppercase tracking-wide mb-1 block"
          >
            Count-in
          </label>
          <select
            id="groove-countin"
            value={countInBars}
            onChange={(e) => onCountInChange(parseInt(e.target.value, 10))}
            className={selectClass}
          >
            {COUNT_IN_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-light text-dark">
                {n === 0 ? 'Off' : `${n} bar${n === 1 ? '' : 's'}`}
              </option>
            ))}
          </select>
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
            className={selectClass}
          >
            {SUBDIVISION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-light text-dark">
                {opt.value} — {opt.label}
              </option>
            ))}
          </select>
        </div>
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
