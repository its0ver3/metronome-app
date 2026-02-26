import { useState } from 'react'
import { SOUND_NAMES, SUBDIVISION_TYPES, ACCENT_ORDER } from '../../audio/constants'

const SUBDIVISION_OPTIONS = [
  { type: SUBDIVISION_TYPES.QUARTER, label: '♩', desc: 'Quarter' },
  { type: SUBDIVISION_TYPES.EIGHTH, label: '♪♪', desc: '8th' },
  { type: SUBDIVISION_TYPES.TRIPLET, label: '♪♪♪', desc: 'Triplet' },
  { type: SUBDIVISION_TYPES.SIXTEENTH, label: '♬♬', desc: '16th' },
  { type: SUBDIVISION_TYPES.QUINTUPLET, label: '5', desc: 'Quintuplet' },
]

const TIME_SIG_PRESETS = [
  { beats: 2, unit: 4, label: '2/4' },
  { beats: 3, unit: 4, label: '3/4' },
  { beats: 4, unit: 4, label: '4/4' },
  { beats: 5, unit: 4, label: '5/4' },
  { beats: 6, unit: 4, label: '6/4' },
  { beats: 7, unit: 4, label: '7/4' },
  { beats: 6, unit: 8, label: '6/8' },
  { beats: 7, unit: 8, label: '7/8' },
  { beats: 9, unit: 8, label: '9/8' },
  { beats: 12, unit: 8, label: '12/8' },
]

const accentStyles = {
  STRONG: 'w-5 h-5 bg-primary',
  MEDIUM: 'w-4 h-4 bg-primary/70',
  NORMAL: 'w-3.5 h-3.5 bg-dark/40',
  GHOST: 'w-3 h-3 bg-dark/20',
  SILENT: 'w-3 h-3 bg-transparent border-2 border-dark/20',
}

function buildDefaultAccents(beatsPerBar) {
  const accents = Array(beatsPerBar).fill('NORMAL')
  accents[0] = 'STRONG'
  return accents
}

export default function SongEditor({ song, onSave, onDelete, onCancel }) {
  const isEditing = !!song?.id

  const [name, setName] = useState(song?.name || '')
  const [bpm, setBpm] = useState(song?.bpm || 120)
  const [beatsPerBar, setBeatsPerBar] = useState(song?.beatsPerBar || 4)
  const [beatUnit, setBeatUnit] = useState(song?.beatUnit || 4)
  const [subdivision, setSubdivision] = useState(song?.subdivision || SUBDIVISION_TYPES.QUARTER)
  const [soundIndex, setSoundIndex] = useState(song?.soundIndex ?? 0)
  const [accents, setAccents] = useState(song?.accents || buildDefaultAccents(4))
  const [showDelete, setShowDelete] = useState(false)

  const handleTimeSigChange = (beats, unit) => {
    setBeatsPerBar(beats)
    setBeatUnit(unit)
    // Resize accents array
    const newAccents = Array(beats).fill('NORMAL')
    newAccents[0] = 'STRONG'
    for (let i = 0; i < Math.min(accents.length, beats); i++) {
      newAccents[i] = accents[i]
    }
    setAccents(newAccents)
  }

  const cycleAccent = (index) => {
    const current = accents[index]
    const currentIdx = ACCENT_ORDER.indexOf(current)
    const next = ACCENT_ORDER[(currentIdx + 1) % ACCENT_ORDER.length]
    const newAccents = [...accents]
    newAccents[index] = next
    setAccents(newAccents)
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      ...(song?.id ? { id: song.id } : {}),
      name: name.trim(),
      bpm,
      beatsPerBar,
      beatUnit,
      subdivision,
      soundIndex,
      accents,
    })
  }

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
              onClick={() => setBpm(Math.max(20, bpm - 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              −
            </button>
            <input
              type="number"
              min={20}
              max={240}
              value={bpm}
              onChange={(e) => setBpm(Math.max(20, Math.min(240, parseInt(e.target.value) || 20)))}
              className="w-20 h-12 text-center rounded-lg bg-secondary text-dark font-heading text-3xl"
            />
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              +
            </button>
          </div>
        </div>

        {/* Time Signature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">Time Sig</span>
            <span className="font-heading text-2xl text-dark">{beatsPerBar}/{beatUnit}</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {TIME_SIG_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleTimeSigChange(p.beats, p.unit)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  beatsPerBar === p.beats && beatUnit === p.unit
                    ? 'bg-primary text-light'
                    : 'bg-secondary text-dark active:bg-secondary/70'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subdivision */}
        <div>
          <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
            Subdivision
          </span>
          <div className="flex gap-2 justify-center">
            {SUBDIVISION_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setSubdivision(opt.type)}
                className={`flex-1 py-2 rounded-lg text-center transition-colors ${
                  subdivision === opt.type
                    ? 'bg-primary text-light'
                    : 'bg-secondary text-dark active:bg-secondary/70'
                }`}
              >
                <span className="block text-lg leading-none">{opt.label}</span>
                <span className="block text-xs mt-0.5 opacity-70">{opt.desc}</span>
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
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {accents.map((accent, i) => (
              <button
                key={i}
                onClick={() => cycleAccent(i)}
                className={`rounded-full flex-shrink-0 ${accentStyles[accent]}`}
                title={`Beat ${i + 1}: ${accent}`}
              />
            ))}
          </div>
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
