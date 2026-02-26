import SoundSelector from './SoundSelector'
import VolumeControl from './VolumeControl'

export default function SettingsScreen({
  soundIndex,
  volume,
  showMoreTimeSigs,
  onSoundChange,
  onSoundPreview,
  onVolumeChange,
  onShowMoreTimeSigsChange,
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      <h2 className="font-heading text-3xl text-dark">Settings</h2>

      <VolumeControl volume={volume} onChange={onVolumeChange} />

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-dark">Show all time signatures</span>
        <button
          onClick={() => onShowMoreTimeSigsChange(!showMoreTimeSigs)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            showMoreTimeSigs ? 'bg-primary' : 'bg-secondary'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-light transition-transform ${
              showMoreTimeSigs ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      <SoundSelector
        selectedIndex={soundIndex}
        onSelect={onSoundChange}
        onPreview={onSoundPreview}
      />
    </div>
  )
}
