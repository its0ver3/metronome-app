export default function BeatsPicker({ beatsPerBar, onChange }) {
  return (
    <div className="w-full px-4">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
        Beats
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`min-w-[2.25rem] h-9 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
              beatsPerBar === n
                ? 'bg-primary text-light'
                : 'bg-secondary text-dark active:bg-secondary/70'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
