import { useCallback, useRef } from 'react'
import BpmDisplay from './BpmDisplay'
import BpmControls from './BpmControls'
import PlayStopButton from './PlayStopButton'
import TapTempoButton from './TapTempoButton'
import BeatIndicators from './BeatIndicators'
import BeatsPicker from './BeatsPicker'
import SubdivisionPicker from './SubdivisionPicker'
import PolyrhythmToggle from './PolyrhythmToggle'
import PolyrhythmPickers from './PolyrhythmPickers'
import PolyrhythmIndicators from './PolyrhythmIndicators'
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
  subdivTrainerEnabled,
  polyrhythmMode,
  polyRhythm1,
  polyRhythm2,
  polySoundIndex1,
  polySoundIndex2,
  polyBeat1,
  polyBeat2,
  polyAccents1,
  polyAccents2,
  onCyclePolyAccent,
  onPolyrhythmModeToggle,
  onPolyRhythm1Change,
  onPolyRhythm2Change,
  onPolySoundIndex1Change,
  onPolySoundIndex2Change,
  onSoundPreview,
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
      {/* BPM Display with +/- buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onBpmChange(bpm - 1)}
          disabled={tempoEnabled}
          className={`w-10 h-10 rounded-full bg-secondary text-dark text-lg font-bold flex items-center justify-center active:bg-secondary/70 transition-colors ${tempoEnabled ? 'opacity-40 pointer-events-none' : ''}`}
        >
          −
        </button>
        <BpmDisplay bpm={bpm} onBpmChange={onBpmChange} disabled={tempoEnabled} />
        <button
          onClick={() => onBpmChange(bpm + 1)}
          disabled={tempoEnabled}
          className={`w-10 h-10 rounded-full bg-secondary text-dark text-lg font-bold flex items-center justify-center active:bg-secondary/70 transition-colors ${tempoEnabled ? 'opacity-40 pointer-events-none' : ''}`}
        >
          +
        </button>
      </div>

      {/* Beat indicators */}
      {polyrhythmMode ? (
        <PolyrhythmIndicators
          rhythm1={polyRhythm1}
          rhythm2={polyRhythm2}
          polyBeat1={polyBeat1}
          polyBeat2={polyBeat2}
          polyAccents1={polyAccents1}
          polyAccents2={polyAccents2}
          onCyclePolyAccent={onCyclePolyAccent}
          isPlaying={isPlaying}
        />
      ) : (
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
      )}

      {/* BPM Controls */}
      <BpmControls bpm={bpm} onBpmChange={onBpmChange} disabled={tempoEnabled} />

      {/* Play + Tap */}
      <div className="flex items-center gap-4">
        <TapTempoButton ref={tapRef} onBpmChange={onBpmChange} />
        <PlayStopButton isPlaying={isPlaying} onToggle={onToggle} />
      </div>

      <PolyrhythmToggle enabled={polyrhythmMode} onToggle={onPolyrhythmModeToggle} />

      {/* Beats & Subdivision / Polyrhythm pickers */}
      {polyrhythmMode ? (
        <PolyrhythmPickers
          rhythm1={polyRhythm1}
          rhythm2={polyRhythm2}
          soundIndex1={polySoundIndex1}
          soundIndex2={polySoundIndex2}
          onRhythm1Change={onPolyRhythm1Change}
          onRhythm2Change={onPolyRhythm2Change}
          onSoundIndex1Change={onPolySoundIndex1Change}
          onSoundIndex2Change={onPolySoundIndex2Change}
          onSoundPreview={onSoundPreview}
        />
      ) : (
        <div className="flex gap-4 px-4 w-full justify-center mt-2">
          <BeatsPicker beatsPerBar={beatsPerBar} onChange={onBeatsChange} />
          <div className={subdivTrainerEnabled ? 'opacity-40 pointer-events-none' : ''}>
            <SubdivisionPicker subdivision={subdivision} onChange={onSubdivisionChange} />
          </div>
        </div>
      )}
    </div>
  )
}
