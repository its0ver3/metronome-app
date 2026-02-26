export default function BpmControls({ bpm, onBpmChange }) {
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
      <input
        type="range"
        min={20}
        max={240}
        value={bpm}
        onChange={(e) => onBpmChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
      />
    </div>
  )
}
