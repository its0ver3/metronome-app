import { getPlaybackSummary } from '../metronome/PlaybackStatus'

export default function GlobalTransport({ onToggle, onOpenMetronome, ...status }) {
  const summary = getPlaybackSummary(status)

  return (
    <aside
      className="mx-3 mb-2 flex min-h-14 items-center gap-3 rounded-xl border border-dark/10 bg-secondary px-3 py-2 shadow-lg shadow-black/20"
      aria-label="Playback controls"
    >
      <button
        type="button"
        onClick={onOpenMetronome}
        className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none"
        aria-label={`Open Metronome. ${summary.detail}`}
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/45">
          {summary.mode}
        </span>
        <span className="block truncate text-sm font-semibold text-dark">{summary.detail}</span>
        {summary.chips.length > 0 && (
          <span className="mt-0.5 block truncate text-[10px] text-dark/55">
            {summary.chips.join(' · ')}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-light transition-colors active:bg-primary/80"
        aria-label={status.isPlaying ? `Stop ${summary.mode}` : `Start ${summary.mode}`}
      >
        {status.isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </aside>
  )
}
