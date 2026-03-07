import { SUBDIVISION_OPTIONS } from '../../audio/constants'

const subdivisionLabel = {}
for (const opt of SUBDIVISION_OPTIONS) {
  subdivisionLabel[opt.type] = opt.label
}

export default function SongList({ songs, onEdit, onLoadSong, onNewSong, onSaveCurrent }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 px-4 pb-4">
        {songs.length === 0 && (
          <p className="text-dark/40 text-sm text-center py-8">
            No songs yet. Create one to get started!
          </p>
        )}
        {songs.map((song) => (
          <div
            key={song.id}
            className="flex items-center gap-2 px-3 py-3 rounded-lg bg-secondary/50"
          >
            {/* Play button */}
            <button
              onClick={() => onLoadSong(song)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-light active:bg-primary/80 transition-colors"
              aria-label={`Play ${song.name}`}
            >
              <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
                <path d="M0 0 L14 8 L0 16 Z" />
              </svg>
            </button>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <span className="text-dark font-semibold text-left truncate block">{song.name}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-bold">
                  {song.bpm}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-bold">
                  {song.beatsPerBar} beats
                </span>
                {song.subdivision && song.subdivision !== 1 && (
                  <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-bold">
                    {subdivisionLabel[song.subdivision] || `${song.subdivision}s`}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => onEdit(song)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full active:bg-secondary transition-colors text-dark/50 active:text-dark"
              aria-label={`Edit ${song.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.5 1.1a1.5 1.5 0 0 1 2.1 0l1.3 1.3a1.5 1.5 0 0 1 0 2.1L5.7 13.7l-3.5.9a.5.5 0 0 1-.6-.6l.9-3.5L11.5 1.1ZM4 12l-.6 2.2L5.6 13.6 4 12Z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="px-4 pb-4 space-y-2">
        <button
          onClick={onSaveCurrent}
          className="w-full py-3 rounded-lg bg-secondary text-dark font-semibold text-sm active:bg-secondary/70 transition-colors"
        >
          Save Current as Song
        </button>
        <button
          onClick={onNewSong}
          className="w-full py-3 rounded-lg bg-primary text-light font-semibold text-sm active:bg-primary/80 transition-colors"
        >
          + New Song
        </button>
      </div>
    </div>
  )
}
