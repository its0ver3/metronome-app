import { useEffect, useRef } from 'react'
import BpmControls from './BpmControls'
import PolyrhythmOrbit, { StandardRhythmOrbit } from './PolyrhythmOrbit'
import { getTempoHeat } from './tempoHeat'
import { getPlaybackSummary } from './PlaybackStatus'
import SessionStatus from './SessionStatus'
import useKeyboard from '../../hooks/useKeyboard'
import './kitView.css'

export default function KitView({
  bpm, maxBpm, isPlaying, isStarting = false, currentBeat, beatsPerBar, meter, inGap,
  subdivision, subdivisionAccents, polyrhythmMode,
  polyRhythm1, polyRhythm2, polyBeat1, polyBeat2, polyAccents1, polyAccents2,
  onCycleBeatAccent, onCyclePolyAccent,
  tempoEnabled, onBpmChange, onToggle, onExit, ...trainingStatus
}) {
  const transportRef = useRef(null)
  const tempoHeat = getTempoHeat(bpm, maxBpm)
  const tempoLocked = tempoEnabled && !polyrhythmMode
  const summary = getPlaybackSummary({
    ...trainingStatus, bpm, isPlaying, currentBeat, beatsPerBar,
    inGap, tempoEnabled, polyrhythmMode,
  })

  useEffect(() => {
    transportRef.current?.focus({ preventScroll: true })
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onExit()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onExit])

  useKeyboard({
    onToggle,
    onBpmUp: tempoLocked ? undefined : () => onBpmChange(bpm + 1),
    onBpmDown: tempoLocked ? undefined : () => onBpmChange(bpm - 1),
  })

  return (
    <section
      className={`pulse-kit-view ${isPlaying ? 'is-playing' : ''}`}
      aria-label="Kit View"
      style={{
        '--tempo-heat-color': tempoHeat.color,
        '--tempo-slider-gradient': tempoHeat.sliderGradient,
        '--tempo-slider-progress': `${tempoHeat.sliderProgress}%`,
      }}
    >
      {/* A native button spans the viewport. Accent slices, slider, and exit are
          siblings above it, so their gestures can never bubble into playback. */}
      <button
        ref={transportRef}
        type="button"
        className="pulse-kit-tap-surface"
        onClick={onToggle}
        aria-label={isPlaying ? 'Stop metronome' : isStarting ? 'Cancel metronome startup' : 'Start metronome'}
        aria-busy={isStarting}
        aria-pressed={isPlaying}
        aria-keyshortcuts="Space"
      />
      <div className="pulse-kit-content">
        <div className="pulse-kit-instrument">
          <div className="pulse-kit-orbit-space">
            <div className="pulse-kit-orbit">
              {polyrhythmMode ? (
                <PolyrhythmOrbit
                  rhythm1={polyRhythm1} rhythm2={polyRhythm2}
                  activeBeat1={polyBeat1} activeBeat2={polyBeat2}
                  accents1={polyAccents1} accents2={polyAccents2}
                  isPlaying={isPlaying}
                  onCycleAccent={onCyclePolyAccent}
                />
              ) : (
                <StandardRhythmOrbit
                  meter={meter} beatCount={beatsPerBar} subdivision={subdivision}
                  accents={subdivisionAccents} activeBeat={currentBeat}
                  isPlaying={isPlaying}
                  onCycleBeatAccent={onCycleBeatAccent}
                />
              )}
              <div className="pulse-kit-value">
                <strong>{bpm}</strong>
                <span>BPM</span>
                <span className="pulse-kit-meter">
                  {polyrhythmMode ? `${polyRhythm1} against ${polyRhythm2}` : `${meter.numerator}/${meter.denominator}`}
                </span>
              </div>
            </div>
          </div>
          <div className="pulse-kit-playback">
            <span>Tap anywhere to {isPlaying ? 'stop' : isStarting ? 'cancel' : 'start'}</span>
          </div>
        </div>
        <div className="pulse-kit-tempo">
          <SessionStatus session={trainingStatus.session} />
          <BpmControls
            maxBpm={maxBpm}
            bpm={bpm} onBpmChange={onBpmChange} disabled={tempoLocked}
            className="pulse-tempo-slider pulse-kit-slider"
          />
          {tempoLocked && <p>Tempo controlled by Tempo Trainer</p>}
          {summary.chips.length > 0 && (
            <div className="pulse-kit-training" aria-label="Active training status">
              {summary.chips.map(chip => <span key={chip}>{chip}</span>)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
