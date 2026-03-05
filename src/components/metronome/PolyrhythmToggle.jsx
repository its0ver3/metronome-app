export default function PolyrhythmToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center gap-1 px-4 w-full">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide mr-2">
        Mode
      </span>
      <div className="flex rounded-lg overflow-hidden border border-dark/10">
        <button
          onClick={() => onToggle(false)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            !enabled
              ? 'bg-primary text-white'
              : 'bg-secondary text-dark/60 hover:bg-dark/10'
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            enabled
              ? 'bg-primary text-white'
              : 'bg-secondary text-dark/60 hover:bg-dark/10'
          }`}
        >
          Polyrhythm
        </button>
      </div>
    </div>
  )
}
