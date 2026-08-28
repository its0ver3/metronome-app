import SoundSelector from './SoundSelector'
import VolumeControl from './VolumeControl'

export default function SettingsScreen({
  soundIndex,
  volume,
  onSoundChange,
  onSoundPreview,
  onVolumeChange,
}) {
  return (
    <section className="pulse-feature-screen pulse-settings-screen" aria-labelledby="settings-title">
      <div className="pulse-feature-scroll">
        <header className="pulse-feature-header">
          <span>Sound & feel</span>
          <h1 id="settings-title">Settings</h1>
          <p>Shape the click so it sits comfortably in your practice.</p>
        </header>

        <div className="pulse-settings-stack">
          <VolumeControl volume={volume} onChange={onVolumeChange} />

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
