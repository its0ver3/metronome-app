import { getPlaybackSummary } from '../metronome/PlaybackStatus'

export default function GlobalTransport({ onToggle, onOpenMetronome, ...status }) {
  const summary = getPlaybackSummary(status)

  return (
    <aside
      className="pulse-global-transport"
      aria-label="Playback controls"
    >
      <button
        type="button"
        onClick={onOpenMetronome}
        className="pulse-global-summary"
        aria-label={`Open Metronome. ${summary.detail}`}
      >
        <span>
          {summary.mode}
        </span>
        <strong>{summary.detail}</strong>
        {summary.chips.length > 0 && (
          <small>
            {summary.chips.join(' · ')}
          </small>
        )}
      </button>

      <button
        type="button"
        onClick={onToggle}
        className="pulse-global-play"
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
