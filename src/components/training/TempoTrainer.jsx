import { useState, useEffect } from 'react'
import { MIN_BPM, EXTENDED_MAX_BPM } from '../../audio/constants'

export default function TempoTrainer({ enabled, startBpm, targetBpm, increment, everyBars, onChange }) {
  const [localStartBpm, setLocalStartBpm] = useState(String(startBpm))
  const [localTargetBpm, setLocalTargetBpm] = useState(String(targetBpm))
  const [localIncrement, setLocalIncrement] = useState(String(increment))
  const [localEveryBars, setLocalEveryBars] = useState(String(everyBars))

  useEffect(() => { setLocalStartBpm(String(startBpm)) }, [startBpm])
  useEffect(() => { setLocalTargetBpm(String(targetBpm)) }, [targetBpm])
  useEffect(() => { setLocalIncrement(String(increment)) }, [increment])
  useEffect(() => { setLocalEveryBars(String(everyBars)) }, [everyBars])

  const handleBlur = (key, localValue, setLocal, min, max) => {
    const parsed = parseInt(localValue)
    let clamped
    if (isNaN(parsed) || parsed < min) {
      clamped = min
    } else if (parsed > max) {
      clamped = max
    } else {
      clamped = parsed
    }
    setLocal(String(clamped))
    update(key, clamped)
  }

  const handleToggle = () => {
    onChange(!enabled, startBpm, targetBpm, increment, everyBars)
  }

  const update = (key, val) => {
    const vals = { startBpm, targetBpm, increment, everyBars, [key]: val }
    onChange(enabled, vals.startBpm, vals.targetBpm, vals.increment, vals.everyBars)
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
              min={MIN_BPM}
              max={EXTENDED_MAX_BPM}
              value={localStartBpm}
              onChange={(e) => setLocalStartBpm(e.target.value)}
              onBlur={() => handleBlur('startBpm', localStartBpm, setLocalStartBpm, MIN_BPM, EXTENDED_MAX_BPM)}
              className="w-full h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-dark/50 font-semibold block mb-1">Target BPM</label>
            <input
              type="number"
              min={MIN_BPM}
              max={EXTENDED_MAX_BPM}
              value={localTargetBpm}
              onChange={(e) => setLocalTargetBpm(e.target.value)}
              onBlur={() => handleBlur('targetBpm', localTargetBpm, setLocalTargetBpm, MIN_BPM, EXTENDED_MAX_BPM)}
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
              onChange={(e) => setLocalIncrement(e.target.value)}
              onBlur={() => handleBlur('increment', localIncrement, setLocalIncrement, 1, 20)}
              className="w-full h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-dark/50 font-semibold block mb-1">Every N Bars</label>
            <input
              type="number"
              min={1}
              max={32}
              value={localEveryBars}
              onChange={(e) => setLocalEveryBars(e.target.value)}
              onBlur={() => handleBlur('everyBars', localEveryBars, setLocalEveryBars, 1, 32)}
              className="w-full h-10 text-center rounded-lg bg-secondary text-dark font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
