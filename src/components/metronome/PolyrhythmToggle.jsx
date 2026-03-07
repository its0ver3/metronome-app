export default function PolyrhythmToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center justify-center gap-1 px-4 w-full mt-2">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide mr-2">
        Mode
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onToggle(false)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            !enabled
              ? 'text-primary border-b-2 border-primary'
              : 'text-dark/40 border-b-2 border-transparent hover:text-dark/60'
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            enabled
              ? 'text-primary border-b-2 border-primary'
              : 'text-dark/40 border-b-2 border-transparent hover:text-dark/60'
          }`}
        >
          Polyrhythm
        </button>
      </div>
    </div>
  )
}
