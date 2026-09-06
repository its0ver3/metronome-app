import SoundSelector from './SoundSelector'
import VolumeControl from './VolumeControl'

export default function SettingsScreen({
  soundIndex,
  volume,
  pumpTheJam,
  onPumpTheJamChange,
  flashOnOne,
  onFlashOnOneChange,
  flashSubdivisions,
  onFlashSubdivisionsChange,
  onSoundChange,
  onSoundPreview,
  onVolumeChange,
}) {
  return (
    <section className="pulse-feature-screen pulse-settings-screen" aria-label="Settings">
      <div className="pulse-feature-scroll">
        <div className="pulse-settings-stack">
          <VolumeControl volume={volume} onChange={onVolumeChange} />

          <section className="pulse-panel pulse-flash-card">
            <div className="pulse-flash-heading">
              <div className="pulse-panel-copy">
                <h2 id="pump-the-jam-label">Pump the Jam</h2>
              </div>
              <button type="button" role="switch" className="pulse-mode-switch"
                aria-labelledby="pump-the-jam-label" aria-checked={pumpTheJam}
                onClick={() => onPumpTheJamChange(!pumpTheJam)}>
                <span className="pulse-mode-switch-track" aria-hidden="true">
                  <span className="pulse-mode-switch-thumb" />
                </span>
              </button>
            </div>
          </section>

          <section className="pulse-panel pulse-flash-card">
            <div className="pulse-flash-heading">
            <div className="pulse-panel-copy">
              <h2 id="flash-on-one-label">Screen flash</h2>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={flashOnOne}
              aria-labelledby="flash-on-one-label"
              className="pulse-mode-switch"
              onClick={() => onFlashOnOneChange(!flashOnOne)}
            >
              <span className="pulse-mode-switch-track" aria-hidden="true">
                <span className="pulse-mode-switch-thumb" />
              </span>
            </button>
            </div>
            {flashOnOne && (
              <div className="pulse-flash-options" role="group" aria-label="Screen flash pattern">
                <button type="button" aria-pressed={!flashSubdivisions} onClick={() => onFlashSubdivisionsChange(false)}>One only</button>
                <button type="button" aria-pressed={flashSubdivisions} onClick={() => onFlashSubdivisionsChange(true)}>One + subdivisions</button>
              </div>
            )}
          </section>

          <SoundSelector
            selectedIndex={soundIndex}
            onSelect={onSoundChange}
            onPreview={onSoundPreview}
          />
        </div>
      </div>
    </section>
  )
}
