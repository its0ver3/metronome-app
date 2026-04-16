export default function ActiveEntryBanner({ entry, onStop }) {
  if (!entry) return null
  return (
    <div className="rounded-xl bg-secondary/80 border border-primary/20 px-4 py-3 flex items-center justify-between">
      <div className="min-w-0 mr-2">
        <div className="text-xs text-dark/50 font-semibold uppercase tracking-wide">
          Tracking
        </div>
        <div className="text-primary font-heading text-lg truncate">{entry.label}</div>
      </div>
      <button
        onClick={onStop}
        className="text-dark/60 text-xs font-semibold px-3 py-2 rounded bg-secondary active:bg-secondary/70"
      >
        Stop
      </button>
    </div>
  )
}
