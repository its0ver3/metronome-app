export default function TrainingMiniPlayer({ bpm, isPlaying, onToggle }) {
  return (
    <div className="mx-4 mb-3 flex items-center justify-between bg-secondary rounded-lg px-4 py-2">
      <span className="text-sm font-semibold text-dark/80">
        {bpm} BPM
      </span>
      <button
        onClick={onToggle}
        className="w-9 h-9 rounded-full bg-primary text-light flex items-center justify-center active:bg-muted transition-colors"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}
