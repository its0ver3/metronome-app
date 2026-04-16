import PlayStopButton from '../metronome/PlayStopButton'
import BpmDisplay from '../metronome/BpmDisplay'
import { MIN_GROOVE_BPM, MAX_GROOVE_BPM } from '../../groove/grooveConstants'

export default function GrooveTransport({ bpm, isPlaying, onToggle, onBpmChange }) {
  const handleSlider = (e) => onBpmChange(parseInt(e.target.value, 10))
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex justify-center">
          <BpmDisplay bpm={bpm} onBpmChange={onBpmChange} />
        </div>
        <PlayStopButton isPlaying={isPlaying} onToggle={onToggle} />
      </div>
      <input
        type="range"
        min={MIN_GROOVE_BPM}
        max={MAX_GROOVE_BPM}
        value={bpm}
        onChange={handleSlider}
        className="w-full"
        aria-label="Tempo"
      />
    </div>
  )
}
