import { useCallback, useRef } from 'react'
import BpmDisplay from './BpmDisplay'
import BpmControls from './BpmControls'
import PlayStopButton from './PlayStopButton'
import TapTempoButton from './TapTempoButton'
import BeatIndicators from './BeatIndicators'
import TimeSignature from './TimeSignature'
import SubdivisionPicker from './SubdivisionPicker'
import useKeyboard from '../../hooks/useKeyboard'

export default function MetronomeScreen({
  bpm,
  isPlaying,
  currentBeat,
  currentBar,
  inGap,
  beatsPerBar,
  beatUnit,
  subdivision,
  accents,
  onBpmChange,
  onToggle,
  onCycleAccent,
  onTimeSignatureChange,
  onSubdivisionChange,
  showMoreTimeSigs,
}) {
  const tapRef = useRef(null)

  const handleTap = useCallback(() => {
    tapRef.current?.click()
  }, [])

  useKeyboard({
    onToggle,
    onBpmUp: () => onBpmChange(bpm + 1),
    onBpmDown: () => onBpmChange(bpm - 1),
    onTap: handleTap,
  })

  return (
    <div className="flex-1 flex flex-col items-center py-4 px-2 overflow-y-auto gap-4">
      {/* BPM Display */}
      <BpmDisplay bpm={bpm} onBpmChange={onBpmChange} />

      {/* Beat indicators */}
      <BeatIndicators
        beatsPerBar={beatsPerBar}
        currentBeat={currentBeat}
        accents={accents}
        onCycleAccent={onCycleAccent}
        isPlaying={isPlaying}
        inGap={inGap}
      />

      {/* BPM Controls */}
      <BpmControls bpm={bpm} onBpmChange={onBpmChange} />

      {/* Play + Tap */}
      <div className="flex items-center gap-4">
        <TapTempoButton ref={tapRef} onBpmChange={onBpmChange} />
        <PlayStopButton isPlaying={isPlaying} onToggle={onToggle} />
      </div>

      {/* Time signature */}
      <TimeSignature
        beatsPerBar={beatsPerBar}
        beatUnit={beatUnit}
        onChange={onTimeSignatureChange}
        showMore={showMoreTimeSigs}
      />

      {/* Subdivision */}
      <SubdivisionPicker
        subdivision={subdivision}
        onChange={onSubdivisionChange}
      />
    </div>
  )
}
