import { SUBDIVISION_OPTIONS } from '../../audio/constants'

export default function SubdivisionPicker({ subdivision, onChange }) {
  return (
    <div className="w-full px-4">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
        Subdivision
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {SUBDIVISION_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onChange(opt.type)}
            className={`min-w-[2.75rem] h-9 px-2 rounded-lg text-center text-sm font-semibold transition-colors flex-shrink-0 ${
              subdivision === opt.type
                ? 'bg-primary text-light'
                : 'bg-secondary text-dark active:bg-secondary/70'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
