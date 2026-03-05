import { SUBDIVISION_OPTIONS } from '../../audio/constants'

const subdivisionLabel = {}
for (const opt of SUBDIVISION_OPTIONS) {
  subdivisionLabel[opt.type] = opt.label
}

export default function SongList({ songs, onEdit, onNewSong, onSaveCurrent }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 px-4 pb-4">
        {songs.length === 0 && (
          <p className="text-dark/40 text-sm text-center py-8">
            No songs yet. Create one to get started!
          </p>
        )}
        {songs.map((song) => (
          <button
            key={song.id}
            onClick={() => onEdit(song)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 active:bg-secondary transition-colors"
          >
            <span className="text-dark font-semibold text-left truncate mr-3">{song.name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
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
          </button>
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
