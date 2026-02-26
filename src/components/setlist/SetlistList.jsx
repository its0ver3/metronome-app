export default function SetlistList({ setlists, onEdit, onNewSetlist }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 px-4 pb-4">
        {setlists.length === 0 && (
          <p className="text-dark/40 text-sm text-center py-8">
            No setlists yet. Create one to organize your songs!
          </p>
        )}
        {setlists.map((setlist) => (
          <button
            key={setlist.id}
            onClick={() => onEdit(setlist)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 active:bg-secondary transition-colors"
          >
            <span className="text-dark font-semibold text-left truncate mr-3">{setlist.name}</span>
            <span className="text-dark/50 text-sm flex-shrink-0">
              {setlist.songIds?.length || 0} song{(setlist.songIds?.length || 0) !== 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onNewSetlist}
          className="w-full py-3 rounded-lg bg-primary text-light font-semibold text-sm active:bg-primary/80 transition-colors"
        >
          + New Setlist
        </button>
      </div>
    </div>
  )
}
