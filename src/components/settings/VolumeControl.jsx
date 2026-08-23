import { useId } from 'react'

export default function VolumeControl({ volume, onChange }) {
  const inputId = useId()
  const percent = Math.round(volume * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={inputId} className="font-heading text-xl text-dark">Volume</label>
        <span className="text-sm text-dark/50 font-semibold" aria-hidden="true">{percent}%</span>
      </div>
      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
        aria-valuetext={`${percent} percent`}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
      />
    </div>
  )
}
