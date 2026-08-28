export default function GapTraining({ enabled, clickBars, silentBars, disabled = false, onChange }) {
  const handleToggle = () => {
    onChange(!enabled, clickBars, silentBars)
  }

  const handleClickBars = (val) => {
    const v = Math.max(1, Math.min(16, val))
    onChange(enabled, v, silentBars)
  }

  const handleSilentBars = (val) => {
    const v = Math.max(1, Math.min(16, val))
    onChange(enabled, clickBars, v)
  }

  return (
    <section className={`pulse-panel pulse-trainer-card ${enabled ? 'is-enabled' : ''}`}>
      <header className="pulse-panel-header">
        <div className="pulse-panel-copy">
          <span>Timing · 01</span>
          <h2>Gap training</h2>
          <p>Alternate between audible and silent bars.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable gap training"
          disabled={disabled}
          onClick={handleToggle}
          className="pulse-switch"
        >
          <span
            aria-hidden="true"
            className="pulse-switch-track"
          >
            <span className="pulse-switch-thumb" />
          </span>
        </button>
      </header>

      <div className={`pulse-step-grid ${!enabled || disabled ? 'is-disabled' : ''}`}>
        <div className="pulse-stepper">
          <span className="pulse-control-label">Click bars</span>
          <div>
            <button
              type="button"
              aria-label="Decrease click bars"
              disabled={!enabled || disabled}
              onClick={() => handleClickBars(clickBars - 1)}
              className="pulse-step-button"
            >
              −
            </button>
            <strong>{clickBars}</strong>
            <button
              type="button"
              aria-label="Increase click bars"
              disabled={!enabled || disabled}
              onClick={() => handleClickBars(clickBars + 1)}
              className="pulse-step-button"
            >
              +
            </button>
          </div>
        </div>
        <div className="pulse-stepper">
          <span className="pulse-control-label">Silent bars</span>
          <div>
            <button
              type="button"
              aria-label="Decrease silent bars"
              disabled={!enabled || disabled}
              onClick={() => handleSilentBars(silentBars - 1)}
              className="pulse-step-button"
            >
              −
            </button>
            <strong>{silentBars}</strong>
            <button
              type="button"
              aria-label="Increase silent bars"
              disabled={!enabled || disabled}
              onClick={() => handleSilentBars(silentBars + 1)}
              className="pulse-step-button"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
