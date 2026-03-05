import { useState } from 'react'
import { MAX_BPM, EXTENDED_MAX_BPM } from '../../audio/constants'

export default function BpmControls({ bpm, onBpmChange }) {
  const [extendedRange, setExtendedRange] = useState(false)
  const currentMax = extendedRange ? EXTENDED_MAX_BPM : MAX_BPM

  return (
    <div className="flex flex-col items-center gap-4 w-full px-6">
      <div className="flex items-center gap-6">
        <button
          onClick={() => onBpmChange(bpm - 1)}
          className="w-14 h-14 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70 transition-colors"
        >
          −
        </button>
        <button
          onClick={() => onBpmChange(bpm + 1)}
          className="w-14 h-14 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70 transition-colors"
        >
          +
        </button>
      </div>
      <div className="flex items-center gap-3 w-full">
        <input
          type="range"
          min={20}
          max={currentMax}
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
        />
        <button
          onClick={() => setExtendedRange(!extendedRange)}
          className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all whitespace-nowrap border ${
            extendedRange
              ? 'border-primary text-primary shadow-[0_0_8px_rgba(250,246,240,0.4)]'
              : 'border-dark/20 text-dark/40'
          }`}
          title={extendedRange ? 'Normal range (20–240)' : 'Extended range (20–600)'}
        >
          600
        </button>
      </div>
    </div>
  )
}
