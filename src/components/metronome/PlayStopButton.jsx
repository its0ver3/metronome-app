export default function PlayStopButton({ isPlaying, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-16 h-16 rounded-full bg-primary text-light flex items-center justify-center border-2 border-dark/20 active:bg-muted transition-colors"
    >
      {isPlaying ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  )
}
