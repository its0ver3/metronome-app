import { MIN_BPM, MAX_BPM } from '../../audio/constants'
import TrainerCardHeader from './TrainerCardHeader'
import NumberWheel from './NumberWheel'

export default function TempoTrainer({ enabled, startBpm, targetBpm, increment, everyBars, disabled = false, onChange }) {
  const update = (key, value) => {
    const next = { startBpm, targetBpm, increment, everyBars, [key]: value }
    onChange(enabled, next.startBpm, next.targetBpm, next.increment, next.everyBars)
  }
  return <section className={`pulse-panel pulse-trainer-card ${enabled ? 'is-enabled' : ''}`}>
    <TrainerCardHeader type="tempo" title="Tempo Trainer"
      description="Change BPM at set intervals."
      metrics={[
        { label: 'Start BPM', value: startBpm, min: MIN_BPM, max: MAX_BPM, onChange: value => update('startBpm', value) },
        { label: 'Target BPM', value: targetBpm, min: MIN_BPM, max: MAX_BPM, onChange: value => update('targetBpm', value) },
      ]}
      enabled={enabled} disabled={disabled} controlsId="tempo-trainer-settings"
      onToggle={() => onChange(!enabled, startBpm, targetBpm, increment, everyBars)}
    />
    <div id="tempo-trainer-settings" aria-hidden={!enabled} inert={!enabled ? true : undefined}
      className={`pulse-trainer-settings-reveal ${enabled ? 'is-open' : ''}`}>
      <div className="pulse-trainer-settings-clip">
        <fieldset disabled={!enabled || disabled} aria-label="Tempo Trainer settings" className="pulse-trainer-settings pulse-tempo-wheel-settings">
          <div className="pulse-inline-wheel-setting"><span>Increase by</span><NumberWheel compact label="BPM increase" value={increment} min={1} max={20} disabled={!enabled || disabled} onChange={value => update('increment', value)} /><span>BPM</span></div>
          <div className="pulse-inline-wheel-setting"><span>Every</span><NumberWheel compact label="Bars between increases" value={everyBars} min={1} max={32} disabled={!enabled || disabled} onChange={value => update('everyBars', value)} /><span>bars</span></div>
        </fieldset>
      </div>
    </div>
  </section>
}
