import { useState, useRef } from 'react'

export default function SetlistDetail({
  setlist,
  songs,
  onSave,
  onDelete,
  onCancel,
  onPlay,
}) {
  const isEditing = !!setlist?.id

  const [name, setName] = useState(setlist?.name || '')
  const [songIds, setSongIds] = useState(setlist?.songIds || [])
  const [showSongPicker, setShowSongPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Drag state
  const dragIndex = useRef(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const songMap = {}
  for (const s of songs) songMap[s.id] = s

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      ...(setlist?.id ? { id: setlist.id } : {}),
      name: name.trim(),
      songIds,
    })
  }

  const addSong = (songId) => {
    setSongIds([...songIds, songId])
    setShowSongPicker(false)
  }

  const removeSong = (index) => {
    setSongIds(songIds.filter((_, i) => i !== index))
  }

  // Touch drag reorder
  const handleDragStart = (index) => {
    dragIndex.current = index
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (index) => {
    if (dragIndex.current === null || dragIndex.current === index) {
      setDragOverIndex(null)
      return
    }
    const newIds = [...songIds]
    const [moved] = newIds.splice(dragIndex.current, 1)
    newIds.splice(index, 0, moved)
    setSongIds(newIds)
    dragIndex.current = null
    setDragOverIndex(null)
  }

  // Touch-based reorder (move up/down buttons as fallback)
  const moveUp = (index) => {
    if (index === 0) return
    const newIds = [...songIds]
    ;[newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]]
    setSongIds(newIds)
  }

  const moveDown = (index) => {
    if (index === songIds.length - 1) return
    const newIds = [...songIds]
    ;[newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]]
    setSongIds(newIds)
  }

  const validSongIds = songIds.filter((id) => songMap[id])

  return (
    <div className="absolute inset-0 z-50 bg-light flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary">
        <button onClick={onCancel} className="text-dark/60 font-semibold text-sm">
          Cancel
        </button>
        <h2 className="font-heading text-2xl text-dark">
          {isEditing ? 'Edit Setlist' : 'New Setlist'}
        </h2>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className={`font-semibold text-sm ${name.trim() ? 'text-primary' : 'text-dark/30'}`}
        >
          Save
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Setlist Name */}
        <div>
          <label className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-1">
            Setlist Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Friday Night Gig"
            className="w-full px-4 py-3 rounded-lg bg-secondary text-dark placeholder-dark/30 font-semibold text-lg"
            autoFocus
          />
        </div>

        {/* Song List */}
        <div>
          <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
            Songs ({songIds.length})
          </span>

          {songIds.length === 0 && (
            <p className="text-dark/40 text-sm text-center py-4">
              No songs added yet.
            </p>
          )}

          <div className="space-y-1">
            {songIds.map((songId, index) => {
              const song = songMap[songId]
              const isDeleted = !song
              return (
                <div
                  key={`${songId}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => setDragOverIndex(null)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/50 transition-colors ${
                    dragOverIndex === index ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      className={`text-dark/40 text-xs leading-none ${index === 0 ? 'opacity-20' : 'active:text-dark'}`}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      className={`text-dark/40 text-xs leading-none ${index === songIds.length - 1 ? 'opacity-20' : 'active:text-dark'}`}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Song index */}
                  <span className="text-dark/30 text-xs font-bold w-5 text-center">{index + 1}</span>

                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    {isDeleted ? (
                      <span className="text-dark/30 italic text-sm">(Deleted)</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-dark font-semibold text-sm truncate">{song.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-xs font-bold flex-shrink-0">
                          {song.bpm}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeSong(index)}
                    className="text-dark/30 active:text-dark text-lg leading-none px-1"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setShowSongPicker(true)}
            className="w-full mt-2 py-2.5 rounded-lg bg-secondary text-dark font-semibold text-sm active:bg-secondary/70 transition-colors"
          >
            + Add Song
          </button>
        </div>

        {/* Delete setlist */}
        {isEditing && (
          <div className="pt-4 border-t border-secondary">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 rounded-lg text-dark/50 font-semibold text-sm"
              >
                Delete Setlist
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-dark/60 text-sm text-center">Delete this setlist?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 rounded-lg bg-secondary text-dark font-semibold text-sm"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => onDelete(setlist.id)}
                    className="flex-1 py-3 rounded-lg bg-primary text-light font-semibold text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Play button at bottom */}
      {isEditing && validSongIds.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onPlay(setlist.id)}
            className="w-full py-4 rounded-lg bg-primary text-light font-heading text-xl tracking-wide active:bg-primary/80 transition-colors"
          >
            ▶ Play Setlist
          </button>
        </div>
      )}

      {/* Song Picker Modal */}
      {showSongPicker && (
        <div className="absolute inset-0 z-[60] bg-black/50 flex items-end">
          <div className="w-full bg-light rounded-t-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-secondary">
              <h3 className="font-heading text-xl text-dark">Add Song</h3>
              <button
                onClick={() => setShowSongPicker(false)}
                className="text-dark/60 font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {songs.length === 0 && (
                <p className="text-dark/40 text-sm text-center py-4">
                  No songs available. Create some first!
                </p>
              )}
              {songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => addSong(song.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 active:bg-secondary transition-colors"
                >
                  <span className="text-dark font-semibold text-sm truncate mr-3">{song.name}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-bold flex-shrink-0">
                    {song.bpm} BPM
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
