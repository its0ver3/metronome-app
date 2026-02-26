export default function VolumeControl({ volume, onChange }) {
  const percent = Math.round(volume * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading text-xl text-dark">Volume</h3>
        <span className="text-sm text-dark/50 font-semibold">{percent}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
      />
    </div>
  )
}
