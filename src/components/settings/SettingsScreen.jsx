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
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      <h2 className="font-heading text-3xl text-dark">Settings</h2>

      <VolumeControl volume={volume} onChange={onVolumeChange} />

      <SoundSelector
        selectedIndex={soundIndex}
        onSelect={onSoundChange}
        onPreview={onSoundPreview}
      />
    </div>
  )
}
