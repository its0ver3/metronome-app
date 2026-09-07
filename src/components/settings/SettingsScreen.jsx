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

          <div className="pulse-settings-toggle-grid">
            <section className="pulse-panel pulse-flash-card">
              <div className="pulse-flash-heading">
                <div className="pulse-panel-copy">
                  <h2 id="pump-the-jam-label">Pump the Jam</h2>
                </div>
                <button type="button" role="switch" className="pulse-mode-switch"
                  aria-labelledby="pump-the-jam-label" aria-checked={pumpTheJam}
                  aria-describedby="pump-the-jam-description"
                  onClick={() => onPumpTheJamChange(!pumpTheJam)}>
                  <span className="pulse-mode-switch-track" aria-hidden="true">
                    <span className="pulse-mode-switch-thumb" />
                  </span>
                </button>
              </div>
              <p id="pump-the-jam-description" className="pulse-setting-description">Raises the tempo limit to 800 BPM.</p>
            </section>

            <section className="pulse-panel pulse-flash-card">
              <div className="pulse-flash-heading">
                <div className="pulse-panel-copy">
                  <h2 id="flash-on-one-label">Screen Flash On 1</h2>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flashOnOne}
                  aria-labelledby="flash-on-one-label"
                  aria-describedby="flash-on-one-description"
                  className="pulse-mode-switch"
                  onClick={() => onFlashOnOneChange(!flashOnOne)}
                >
                  <span className="pulse-mode-switch-track" aria-hidden="true">
                    <span className="pulse-mode-switch-thumb" />
                  </span>
                </button>
              </div>
              <p id="flash-on-one-description" className="pulse-setting-description">Flashes on the first beat of each bar.</p>
              {flashOnOne && (
                <div className="pulse-flash-options" role="group" aria-label="Screen flash pattern">
                  <button type="button" aria-pressed={!flashSubdivisions} onClick={() => onFlashSubdivisionsChange(false)}>One only</button>
                  <button type="button" aria-pressed={flashSubdivisions} onClick={() => onFlashSubdivisionsChange(true)}>One + subdivisions</button>
                </div>
              )}
            </section>
          </div>

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
