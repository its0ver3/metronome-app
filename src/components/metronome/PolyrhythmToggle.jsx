export default function PolyrhythmToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 w-full mt-2">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">
        Polyrhythm
      </span>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-secondary'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
            enabled ? 'translate-x-5 bg-secondary' : 'bg-dark'
          }`}
        />
      </button>
    </div>
  )
}
