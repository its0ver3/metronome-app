export default function BeatsPicker({ beatsPerBar, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">
        Beats
      </span>
      <select
        value={beatsPerBar}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="h-10 px-3 rounded-lg bg-secondary text-dark font-semibold text-sm appearance-none cursor-pointer"
      >
        {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  )
}
