export default function PlayStopButton({ isPlaying, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-20 h-20 rounded-full bg-primary text-light flex items-center justify-center shadow-lg active:bg-muted transition-colors"
    >
      {isPlaying ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  )
}
