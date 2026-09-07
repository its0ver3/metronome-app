import GapPatternPicker from './GapPatternPicker'
import TrainerCardHeader from './TrainerCardHeader'

export default function GapTraining({ enabled, clickBars, silentBars, pattern = 'silence', denominator = 4, isPlaying = false, disabled = false, onChange }) {
  return <section className={`pulse-panel pulse-trainer-card ${enabled ? 'is-enabled' : ''}`}>
    <TrainerCardHeader type="gap" title="Gap Trainer"
      description="Alternate clicks with a gap pattern."
      metrics={[
        { label: 'Click bars', value: clickBars, min: 1, max: 16, onChange: value => onChange(enabled, value, silentBars, pattern) },
        { label: 'Gap bars', value: silentBars, min: 1, max: 16, onChange: value => onChange(enabled, clickBars, value, pattern) },
      ]}
      controlsId="gap-trainer-settings"
      enabled={enabled} disabled={disabled} onToggle={() => onChange(!enabled, clickBars, silentBars, pattern)}
    />
    <div id="gap-trainer-settings" aria-hidden={!enabled} inert={!enabled ? true : undefined}
      className={`pulse-trainer-settings-reveal ${enabled ? 'is-open' : ''}`}>
      <div className="pulse-trainer-settings-clip">
        <div className="pulse-gap-pattern-settings">
          <div className="pulse-gap-pattern-row">
            <span>Gap pattern</span>
            <GapPatternPicker value={pattern} denominator={denominator} disabled={!enabled || disabled}
              onChange={value => onChange(enabled, clickBars, silentBars, value)} />
          </div>
          {isPlaying && !disabled && <p className="pulse-owned-note">Changes take effect at the next bar</p>}
        </div>
      </div>
    </div>
  </section>
}
