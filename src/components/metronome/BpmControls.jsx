import { MIN_BPM, MAX_BPM } from '../../audio/constants'

export default function BpmControls({ bpm, onBpmChange, disabled, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-4 w-full px-6 ${className} ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center w-full">
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          step={1}
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
          disabled={disabled}
          aria-label="Tempo"
          aria-valuetext={`${bpm} beats per minute`}
          className="flex-1 h-11 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed accent-primary bg-secondary"
        />
      </div>
    </div>
  )
}
