import { useCallback, useRef } from 'react'
import BpmDisplay from './BpmDisplay'
import BpmControls from './BpmControls'
import PlayStopButton from './PlayStopButton'
import TapTempoButton from './TapTempoButton'
import BeatIndicators from './BeatIndicators'
import BeatsPicker from './BeatsPicker'
import SubdivisionPicker from './SubdivisionPicker'
import useKeyboard from '../../hooks/useKeyboard'

export default function MetronomeScreen({
  bpm,
  isPlaying,
  currentBeat,
  currentSubdivision,
  currentBar,
  inGap,
  beatsPerBar,
  subdivision,
  subdivisionAccents,
  onBpmChange,
  onToggle,
  onCycleSubdivisionAccent,
  onBeatsChange,
  onSubdivisionChange,
  tempoEnabled,
}) {
  const tapRef = useRef(null)

  const handleTap = useCallback(() => {
    tapRef.current?.click()
  }, [])

  useKeyboard({
    onToggle,
    onBpmUp: tempoEnabled ? undefined : () => onBpmChange(bpm + 1),
    onBpmDown: tempoEnabled ? undefined : () => onBpmChange(bpm - 1),
    onTap: tempoEnabled ? undefined : handleTap,
  })

  return (
    <div className="flex-1 flex flex-col items-center py-4 px-2 overflow-y-auto gap-4">
      {/* BPM Display */}
      <BpmDisplay bpm={bpm} onBpmChange={onBpmChange} disabled={tempoEnabled} />

      {/* Beat indicators */}
      <BeatIndicators
        beatsPerBar={beatsPerBar}
        subdivision={subdivision}
        subdivisionAccents={subdivisionAccents}
        currentBeat={currentBeat}
        currentSubdivision={currentSubdivision}
        onCycleSubdivisionAccent={onCycleSubdivisionAccent}
        isPlaying={isPlaying}
        inGap={inGap}
      />

      {/* BPM Controls */}
      <BpmControls bpm={bpm} onBpmChange={onBpmChange} disabled={tempoEnabled} />

      {/* Play + Tap */}
      <div className="flex items-center gap-4">
        <TapTempoButton ref={tapRef} onBpmChange={onBpmChange} />
        <PlayStopButton isPlaying={isPlaying} onToggle={onToggle} />
      </div>

      {/* Beats & Subdivision */}
      <div className="flex gap-4 px-4 w-full justify-start">
        <BeatsPicker beatsPerBar={beatsPerBar} onChange={onBeatsChange} />
        <SubdivisionPicker subdivision={subdivision} onChange={onSubdivisionChange} />
      </div>
    </div>
  )
}
