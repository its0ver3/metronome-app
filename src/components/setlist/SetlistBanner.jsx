export default function SetlistBanner({
  setlistName,
  songs,
  currentIndex,
  onPrev,
  onNext,
  onExit,
}) {
  const currentSong = songs[currentIndex]
  const nextSong = songs[currentIndex + 1]
  const total = songs.length

  return (
    <div className="mx-2 mb-2 rounded-xl bg-secondary/80 border border-primary/20 px-4 py-3 space-y-1.5">
      {/* Top row: setlist name + exit */}
      <div className="flex items-center justify-between">
        <span className="text-primary font-heading text-lg tracking-wide truncate mr-2">
          {setlistName}
        </span>
        <button
          onClick={onExit}
          className="text-dark/50 text-xs font-semibold px-2 py-1 rounded bg-secondary active:bg-secondary/70"
        >
          Exit
        </button>
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`text-sm font-semibold px-3 py-1 rounded ${
            currentIndex === 0 ? 'text-dark/20' : 'text-primary active:text-primary/70'
          }`}
        >
          ◄ Prev
        </button>
        <span className="text-dark/60 text-sm font-bold">
          {currentIndex + 1} / {total}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex === total - 1}
          className={`text-sm font-semibold px-3 py-1 rounded ${
            currentIndex === total - 1 ? 'text-dark/20' : 'text-primary active:text-primary/70'
          }`}
        >
          Next ►
        </button>
      </div>

      {/* Current song */}
      {currentSong && (
        <div className="text-dark font-semibold text-sm">
          ► {currentSong.name} — {currentSong.bpm} BPM
        </div>
      )}

      {/* Next up */}
      {nextSong && (
        <div className="text-dark/40 text-xs">
          Next: {nextSong.name} — {nextSong.bpm} BPM
        </div>
      )}
    </div>
  )
}
