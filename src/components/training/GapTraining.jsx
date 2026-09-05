import TrainerCardHeader from './TrainerCardHeader'

export default function GapTraining({ enabled, clickBars, silentBars, disabled = false, onChange }) {
  return <section className={`pulse-panel pulse-trainer-card ${enabled ? 'is-enabled' : ''}`}>
    <TrainerCardHeader type="gap" title="Gap Trainer"
      description="Alternate between clicks and silence."
      metrics={[
        { label: 'Click bars', value: clickBars, min: 1, max: 16, onChange: value => onChange(enabled, value, silentBars) },
        { label: 'Silent bars', value: silentBars, min: 1, max: 16, onChange: value => onChange(enabled, clickBars, value) },
      ]}
      metricsId="gap-trainer-settings" controlsId="gap-trainer-settings"
      enabled={enabled} disabled={disabled} onToggle={() => onChange(!enabled, clickBars, silentBars)}
    />
  </section>
}
