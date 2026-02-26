import { useState } from 'react'

export default function TempoTrainer({ enabled, startBpm, targetBpm, increment, everyBars, onChange }) {
  const [localStart, setLocalStart] = useState(startBpm)
  const [localTarget, setLocalTarget] = useState(targetBpm)
  const [localIncrement, setLocalIncrement] = useState(increment)
  const [localInterval, setLocalInterval] = useState(everyBars)

  const handleToggle = () => {
    onChange(!enabled, localStart, localTarget, localIncrement, localInterval)
  }

  const update = (setter, key, val) => {
    setter(val)
    if (enabled) {
      const vals = { startBpm: localStart, targetBpm: localTarget, increment: localIncrement, everyBars: localInterval }
      vals[key] = val
      onChange(true, vals.startBpm, vals.targetBpm, vals.increment, vals.everyBars)
    }
  }

  return (
    <div className="bg-secondary/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-xl text-dark">Tempo Trainer</h3>
          <p className="text-xs text-dark/50">Gradually change BPM over time</p>
        </div>
        <button
          onClick={handleToggle}
          className={`w-12 h-7 rounded-full transition-colors relative ${
            enabled ? 'bg-primary' : 'bg-dark/20'
          }`}
        >
          <span
            className={`absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className={`space-y-3 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-dark/50 font-semibold block mb-1">Start BPM</label>
            <input
              type="number"
              min={10}
              max={400}
              value={localStart}
              onChange={(e) => update(setLocalStart, 'startBpm', Math.max(10, Math.min(400, parseInt(e.target.value) || 10)))}
              className="w-full h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-dark/50 font-semibold block mb-1">Target BPM</label>
            <input
              type="number"
              min={10}
              max={400}
              value={localTarget}
              onChange={(e) => update(setLocalTarget, 'targetBpm', Math.max(10, Math.min(400, parseInt(e.target.value) || 10)))}
              className="w-full h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-dark/50 font-semibold block mb-1">Increment</label>
            <input
              type="number"
              min={1}
              max={20}
              value={localIncrement}
              onChange={(e) => update(setLocalIncrement, 'increment', Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-full h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-dark/50 font-semibold block mb-1">Every N Bars</label>
            <input
              type="number"
              min={1}
              max={32}
              value={localInterval}
              onChange={(e) => update(setLocalInterval, 'everyBars', Math.max(1, Math.min(32, parseInt(e.target.value) || 1)))}
              className="w-full h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
