import { useId } from 'react'

export default function BeatsPicker({ beatsPerBar, onChange }) {
  const selectId = useId()

  return (
    <div className="flex flex-col items-center gap-1">
      <label
        htmlFor={selectId}
        className="text-xs text-dark/50 font-semibold uppercase tracking-wide"
      >
        Beats
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={beatsPerBar}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="h-11 px-3 pr-7 rounded-lg bg-secondary text-dark font-semibold text-sm appearance-none cursor-pointer w-16"
        >
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/40 text-xs">
          ▼
        </span>
      </div>
    </div>
  )
}
