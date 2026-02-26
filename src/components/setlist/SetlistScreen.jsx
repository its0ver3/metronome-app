import { useState } from 'react'
import SongList from './SongList'
import SongEditor from './SongEditor'
import SetlistList from './SetlistList'
import SetlistDetail from './SetlistDetail'
import useSongs from '../../hooks/useSongs'
import useSetlists from '../../hooks/useSetlists'

export default function SetlistScreen({ currentSettings, onPlaySetlist }) {
  const { songs, save: saveSong, remove: removeSong } = useSongs()
  const { setlists, save: saveSetlist, remove: removeSetlist } = useSetlists()

  const [view, setView] = useState('songs') // 'songs' | 'setlists'
  const [editingSong, setEditingSong] = useState(null) // null | {} (new) | song object
  const [editingSetlist, setEditingSetlist] = useState(null)

  // Song handlers
  const handleNewSong = () => {
    setEditingSong({})
  }

  const handleSaveCurrent = () => {
    // Create a new song from the current metronome settings
    setEditingSong({
      name: '',
      bpm: currentSettings.bpm,
      beatsPerBar: currentSettings.beatsPerBar,
      beatUnit: currentSettings.beatUnit,
      subdivision: currentSettings.subdivision,
      soundIndex: currentSettings.soundIndex,
      accents: [...currentSettings.accents],
    })
  }

  const handleSaveSong = async (song) => {
    await saveSong(song)
    setEditingSong(null)
  }

  const handleDeleteSong = async (id) => {
    await removeSong(id)
    setEditingSong(null)
  }

  // Setlist handlers
  const handleNewSetlist = () => {
    setEditingSetlist({})
  }

  const handleSaveSetlist = async (setlist) => {
    await saveSetlist(setlist)
    setEditingSetlist(null)
  }

  const handleDeleteSetlist = async (id) => {
    await removeSetlist(id)
    setEditingSetlist(null)
  }

  const handlePlaySetlist = (setlistId) => {
    setEditingSetlist(null)
    onPlaySetlist(setlistId)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="font-heading text-3xl text-dark mb-3">Setlists</h2>

        {/* Toggle */}
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => setView('songs')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              view === 'songs'
                ? 'bg-primary text-light'
                : 'text-dark/60 active:text-dark'
            }`}
          >
            Songs
          </button>
          <button
            onClick={() => setView('setlists')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              view === 'setlists'
                ? 'bg-primary text-light'
                : 'text-dark/60 active:text-dark'
            }`}
          >
            Setlists
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'songs' ? (
        <SongList
          songs={songs}
          onEdit={(song) => setEditingSong(song)}
          onNewSong={handleNewSong}
          onSaveCurrent={handleSaveCurrent}
        />
      ) : (
        <SetlistList
          setlists={setlists}
          onEdit={(setlist) => setEditingSetlist(setlist)}
          onNewSetlist={handleNewSetlist}
        />
      )}

      {/* Song Editor Overlay */}
      {editingSong !== null && (
        <SongEditor
          song={editingSong}
          onSave={handleSaveSong}
          onDelete={handleDeleteSong}
          onCancel={() => setEditingSong(null)}
        />
      )}

      {/* Setlist Detail Overlay */}
      {editingSetlist !== null && (
        <SetlistDetail
          setlist={editingSetlist}
          songs={songs}
          onSave={handleSaveSetlist}
          onDelete={handleDeleteSetlist}
          onCancel={() => setEditingSetlist(null)}
          onPlay={handlePlaySetlist}
        />
      )}
    </div>
  )
}
