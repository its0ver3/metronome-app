import { SUBDIVISION_OPTIONS } from '../../audio/constants'

export default function SubdivisionPicker({ subdivision, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">
        Subdivision
      </span>
      <select
        value={subdivision}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="h-10 px-3 rounded-lg bg-secondary text-dark font-semibold text-sm appearance-none cursor-pointer"
      >
        {SUBDIVISION_OPTIONS.map((opt) => (
          <option key={opt.type} value={opt.type}>
            {opt.desc}
          </option>
        ))}
      </select>
    </div>
  )
}
