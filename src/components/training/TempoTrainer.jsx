import { useState, useEffect, useId } from 'react'
import { MIN_BPM, MAX_BPM } from '../../audio/constants'

export default function TempoTrainer({ enabled, startBpm, targetBpm, increment, everyBars, disabled = false, onChange }) {
  const idPrefix = useId()
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
    <section className={`pulse-panel pulse-trainer-card ${enabled ? 'is-enabled' : ''}`}>
      <header className="pulse-panel-header">
        <div className="pulse-panel-copy">
          <span>Tempo · 02</span>
          <h2>Tempo trainer</h2>
          <p>Increase the tempo automatically as you play.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable tempo trainer"
          disabled={disabled}
          onClick={handleToggle}
          className="pulse-switch"
        >
          <span aria-hidden="true" className="pulse-switch-track">
            <span className="pulse-switch-thumb" />
          </span>
        </button>
      </header>

      <fieldset
        disabled={!enabled || disabled}
        aria-label="Tempo trainer settings"
        className={`pulse-number-grid ${!enabled || disabled ? 'is-disabled' : ''}`}
      >
          <label className="pulse-number-control">
            <span>Start BPM</span>
            <input
              id={`${idPrefix}-start-bpm`}
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={localStartBpm}
              onChange={(e) => setLocalStartBpm(e.target.value)}
              onBlur={() => handleBlur('startBpm', localStartBpm, setLocalStartBpm, MIN_BPM, MAX_BPM)}
              className="pulse-number-input"
            />
          </label>
          <label className="pulse-number-control">
            <span>Target BPM</span>
            <input
              id={`${idPrefix}-target-bpm`}
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={localTargetBpm}
              onChange={(e) => setLocalTargetBpm(e.target.value)}
              onBlur={() => handleBlur('targetBpm', localTargetBpm, setLocalTargetBpm, MIN_BPM, MAX_BPM)}
              className="pulse-number-input"
            />
          </label>
          <label className="pulse-number-control">
            <span>Increase by</span>
            <input
              id={`${idPrefix}-increment`}
              type="number"
              min={1}
              max={20}
              value={localIncrement}
              onChange={(e) => setLocalIncrement(e.target.value)}
              onBlur={() => handleBlur('increment', localIncrement, setLocalIncrement, 1, 20)}
              className="pulse-number-input"
            />
          </label>
          <label className="pulse-number-control">
            <span>Every bars</span>
            <input
              id={`${idPrefix}-every-bars`}
              type="number"
              min={1}
              max={32}
              value={localEveryBars}
              onChange={(e) => setLocalEveryBars(e.target.value)}
              onBlur={() => handleBlur('everyBars', localEveryBars, setLocalEveryBars, 1, 32)}
              className="pulse-number-input"
            />
          </label>
      </fieldset>
    </section>
  )
}
