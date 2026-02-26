import { useState } from 'react'

const BASIC_PRESETS = [
  { beats: 3, unit: 4, label: '3/4' },
  { beats: 4, unit: 4, label: '4/4' },
  { beats: 5, unit: 4, label: '5/4' },
  { beats: 7, unit: 4, label: '7/4' },
]

const EXTENDED_PRESETS = [
  { beats: 2, unit: 4, label: '2/4' },
  { beats: 6, unit: 4, label: '6/4' },
  { beats: 6, unit: 8, label: '6/8' },
  { beats: 7, unit: 8, label: '7/8' },
  { beats: 9, unit: 8, label: '9/8' },
  { beats: 12, unit: 8, label: '12/8' },
]

const ALL_PRESETS = [
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

export default function TimeSignature({ beatsPerBar, beatUnit, onChange, showMore = false }) {
  const [showCustom, setShowCustom] = useState(false)
  const [customBeats, setCustomBeats] = useState(beatsPerBar)
  const [customUnit, setCustomUnit] = useState(beatUnit)

  const currentLabel = `${beatsPerBar}/${beatUnit}`
  const presets = showMore ? ALL_PRESETS : BASIC_PRESETS
  const isPreset = ALL_PRESETS.some((p) => p.beats === beatsPerBar && p.unit === beatUnit)

  const handlePreset = (beats, unit) => {
    onChange(beats, unit)
    setShowCustom(false)
  }

  const handleCustomApply = () => {
    onChange(customBeats, customUnit)
    setShowCustom(false)
  }

  return (
    <div className="w-full px-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">Time Sig</span>
        <span className="font-heading text-2xl text-dark">{currentLabel}</span>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.beats, p.unit)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              beatsPerBar === p.beats && beatUnit === p.unit
                ? 'bg-primary text-light'
                : 'bg-secondary text-dark active:bg-secondary/70'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            !isPreset ? 'bg-primary text-light' : 'bg-secondary text-dark active:bg-secondary/70'
          }`}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <input
            type="number"
            min={1}
            max={16}
            value={customBeats}
            onChange={(e) => setCustomBeats(Math.max(1, Math.min(16, parseInt(e.target.value) || 1)))}
            className="w-14 h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
          />
          <span className="text-dark text-xl">/</span>
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(parseInt(e.target.value))}
            className="h-10 px-3 rounded-lg bg-secondary text-dark font-semibold"
          >
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={16}>16</option>
          </select>
          <button
            onClick={handleCustomApply}
            className="h-10 px-4 rounded-lg bg-primary text-light font-semibold text-sm"
          >
            Set
          </button>
        </div>
      )}
    </div>
  )
}
