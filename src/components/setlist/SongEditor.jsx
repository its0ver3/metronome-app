import { useState } from 'react'
import {
  SOUND_NAMES,
  SUBDIVISION_OPTIONS,
  ACCENT_STYLES,
  MIN_BPM,
  MAX_BPM,
  cycleAccentLevel,
  buildDefaultSubdivisionAccents,
} from '../../audio/constants'

export default function SongEditor({ song, onSave, onDelete, onCancel }) {
  const isEditing = !!song?.id

  const [name, setName] = useState(song?.name || '')
  const [bpm, setBpm] = useState(song?.bpm || 120)
  const [beatsPerBar, setBeatsPerBar] = useState(song?.beatsPerBar || 4)
  const [subdivision, setSubdivision] = useState(song?.subdivision || 1)
  const [soundIndex, setSoundIndex] = useState(song?.soundIndex ?? 0)
  const [subdivisionAccents, setSubdivisionAccents] = useState(
    song?.subdivisionAccents || buildDefaultSubdivisionAccents(song?.beatsPerBar || 4, song?.subdivision || 1)
  )
  const [showDelete, setShowDelete] = useState(false)

  const handleBeatsChange = (beats) => {
    setBeatsPerBar(beats)
    setSubdivisionAccents(buildDefaultSubdivisionAccents(beats, subdivision))
  }

  const handleSubdivisionChange = (sub) => {
    setSubdivision(sub)
    setSubdivisionAccents(buildDefaultSubdivisionAccents(beatsPerBar, sub))
  }

  const cycleSubAccent = (index) => {
    const newAccents = [...subdivisionAccents]
    newAccents[index] = cycleAccentLevel(subdivisionAccents[index])
    setSubdivisionAccents(newAccents)
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      ...(song?.id ? { id: song.id } : {}),
      name: name.trim(),
      bpm,
      beatsPerBar,
      subdivision,
      soundIndex,
      subdivisionAccents,
    })
  }

  // Build beat groups for dot display
  const totalDots = beatsPerBar * subdivision
  const useStacked = totalDots > 16

  return (
    <div className="absolute inset-0 z-50 bg-light flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary">
        <button onClick={onCancel} className="text-dark/60 font-semibold text-sm">
          Cancel
        </button>
        <h2 className="font-heading text-2xl text-dark">
          {isEditing ? 'Edit Song' : 'New Song'}
        </h2>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className={`font-semibold text-sm ${name.trim() ? 'text-primary' : 'text-dark/30'}`}
        >
          Save
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Song Name */}
        <div>
          <label className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-1">
            Song Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Billie Jean"
            className="w-full px-4 py-3 rounded-lg bg-secondary text-dark placeholder-dark/30 font-semibold text-lg"
            autoFocus
          />
        </div>

        {/* BPM */}
        <div>
          <label className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-1">
            BPM
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBpm(Math.max(MIN_BPM, bpm - 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              −
            </button>
            <input
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={(e) => setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, parseInt(e.target.value) || MIN_BPM)))}
              className="w-20 h-12 text-center rounded-lg bg-secondary text-dark font-heading text-3xl"
            />
            <button
              onClick={() => setBpm(Math.min(MAX_BPM, bpm + 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              +
            </button>
          </div>
        </div>

        {/* Beats */}
        <div>
          <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
            Beats
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => handleBeatsChange(n)}
                className={`min-w-[2.25rem] h-9 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                  beatsPerBar === n
                    ? 'bg-primary text-light'
                    : 'bg-secondary text-dark active:bg-secondary/70'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Subdivision */}
        <div>
          <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
            Subdivision
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {SUBDIVISION_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleSubdivisionChange(opt.type)}
                className={`min-w-[2.75rem] h-9 px-2 rounded-lg text-center text-sm font-semibold transition-colors flex-shrink-0 ${
                  subdivision === opt.type
                    ? 'bg-primary text-light'
                    : 'bg-secondary text-dark active:bg-secondary/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div>
          <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
            Sound
          </span>
          <div className="grid grid-cols-2 gap-2">
            {SOUND_NAMES.map((snd, i) => (
              <button
                key={i}
                onClick={() => setSoundIndex(i)}
                className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${
                  soundIndex === i
                    ? 'bg-primary/10 border border-primary text-primary'
                    : 'bg-secondary/50 text-dark active:bg-secondary'
                }`}
              >
                {snd}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Pattern */}
        <div>
          <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
            Accent Pattern
          </span>
          {useStacked ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: beatsPerBar }, (_, beat) => (
                <div key={beat} className="flex items-center gap-1">
                  <span className="text-xs text-dark/30 w-5 text-right mr-1 flex-shrink-0">
                    {beat + 1}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {Array.from({ length: subdivision }, (_, sub) => {
                      const flatIndex = beat * subdivision + sub
                      const accent = subdivisionAccents[flatIndex] || 'ON'
                      const isDownbeat = sub === 0
                      return (
                        <button
                          key={flatIndex}
                          onClick={() => cycleSubAccent(flatIndex)}
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          title={`Click ${flatIndex + 1}: ${accent}`}
                        >
                          <span
                            className={`rounded-full block ${ACCENT_STYLES[accent]} ${
                              isDownbeat ? 'ring-1 ring-dark/20' : ''
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center flex-wrap">
              {Array.from({ length: beatsPerBar }, (_, beat) => (
                <div key={beat} className={`flex items-center gap-1 ${beat > 0 ? 'ml-3' : ''}`}>
                  {Array.from({ length: subdivision }, (_, sub) => {
                    const flatIndex = beat * subdivision + sub
                    const accent = subdivisionAccents[flatIndex] || 'ON'
                    const isDownbeat = sub === 0
                    return (
                      <button
                        key={flatIndex}
                        onClick={() => cycleSubAccent(flatIndex)}
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        title={`Click ${flatIndex + 1}: ${accent}`}
                      >
                        <span
                          className={`rounded-full block ${ACCENT_STYLES[accent]} ${
                            isDownbeat ? 'ring-1 ring-dark/20' : ''
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-dark/40 text-center mt-2">Tap circles to cycle accent level</p>
        </div>

        {/* Delete button for existing songs */}
        {isEditing && (
          <div className="pt-4 border-t border-secondary">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full py-3 rounded-lg text-dark/50 font-semibold text-sm"
              >
                Delete Song
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-dark/60 text-sm text-center">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDelete(false)}
                    className="flex-1 py-3 rounded-lg bg-secondary text-dark font-semibold text-sm"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => onDelete(song.id)}
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
    </div>
  )
}
