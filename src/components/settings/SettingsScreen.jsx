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
    <section className="pulse-feature-screen pulse-settings-screen" aria-label="Settings">
      <div className="pulse-feature-scroll">
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
