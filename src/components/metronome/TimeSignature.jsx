import { useState } from 'react'
import { BASIC_TIME_SIG_PRESETS, ALL_TIME_SIG_PRESETS } from '../../audio/constants'

export default function TimeSignature({ beatsPerBar, beatUnit, onChange, showMore = false }) {
  const [showCustom, setShowCustom] = useState(false)
  const [customBeats, setCustomBeats] = useState(beatsPerBar)
  const [customUnit, setCustomUnit] = useState(beatUnit)

  const currentLabel = `${beatsPerBar}/${beatUnit}`
  const presets = showMore ? ALL_TIME_SIG_PRESETS : BASIC_TIME_SIG_PRESETS
  const isPreset = ALL_TIME_SIG_PRESETS.some((p) => p.beats === beatsPerBar && p.unit === beatUnit)

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
