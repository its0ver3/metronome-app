import { useCallback, useEffect, useRef, useState } from 'react'
import BpmDisplay from './BpmDisplay'
import BpmControls from './BpmControls'
import TapTempoButton from './TapTempoButton'
import BeatIndicators from './BeatIndicators'
import BeatsPicker from './BeatsPicker'
import SubdivisionPicker from './SubdivisionPicker'
import PolyrhythmToggle from './PolyrhythmToggle'
import PolyrhythmPickers from './PolyrhythmPickers'
import PolyrhythmIndicators from './PolyrhythmIndicators'
import PolyrhythmOrbit, { StandardRhythmOrbit } from './PolyrhythmOrbit'
import RhythmReadout from './RhythmReadout.jsx'
import { getPlaybackSummary } from './PlaybackStatus'
import { getTempoHeat } from './tempoHeat'
import useKeyboard from '../../hooks/useKeyboard'

const FOCUSABLE = [
  'button:not([disabled])',
  'select:not([disabled])',
  'input:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function TransportIcon({ isPlaying }) {
  if (isPlaying) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function BeatPreviewRow({ label, count, activeBeat, isPlaying, inGap, rhythm }) {
  return (
    <div className="pulse-beat-preview-row" data-rhythm-preview={rhythm}>
      {label && <span className="pulse-beat-preview-label">{label}</span>}
      <div className="pulse-beat-preview-dots">
      {Array.from({ length: count }, (_, beat) => (
        <span
          key={beat}
          className={`pulse-preview-dot ${isPlaying && activeBeat === beat ? 'is-active' : ''}`}
          data-beat={beat}
          data-gap={inGap ? 'true' : undefined}
        />
      ))}
      </div>
    </div>
  )
}

function StandardBeatPreview({ beatsPerBar, currentBeat, isPlaying, inGap }) {
  return (
    <div className="pulse-beat-preview" aria-hidden="true">
      <BeatPreviewRow
        count={beatsPerBar}
        activeBeat={currentBeat}
        isPlaying={isPlaying}
        inGap={inGap}
        rhythm="standard"
      />
    </div>
  )
}

function PolyrhythmBeatPreview({
  rhythm1,
  rhythm2,
  activeBeat1,
  activeBeat2,
  isPlaying,
}) {
  return (
    <div className="pulse-beat-preview is-polyrhythm" aria-hidden="true">
      <BeatPreviewRow
        label="R1"
        count={rhythm1}
        activeBeat={activeBeat1}
        isPlaying={isPlaying}
        rhythm="one"
      />
      <BeatPreviewRow
        label="R2"
        count={rhythm2}
        activeBeat={activeBeat2}
        isPlaying={isPlaying}
        rhythm="two"
      />
    </div>
  )
}

export default function MetronomeScreen({
  bpm,
  isPlaying,
  currentBeat,
  currentSubdivision,
  inGap,
  beatsPerBar,
  subdivision,
  subdivisionAccents,
  onBpmChange,
  onToggle,
  onCycleSubdivisionAccent,
  onCycleBeatAccent,
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
  playbackStatus,
}) {
  const [rhythmOpen, setRhythmOpen] = useState(false)
  const tapRef = useRef(null)
  const screenRef = useRef(null)
  const contentRef = useRef(null)
  const sheetRef = useRef(null)
  const openerRef = useRef(null)

  const handleTap = useCallback(() => {
    tapRef.current?.click()
  }, [])

  const handleBpmDown = useCallback(() => {
    if (!tempoEnabled) onBpmChange(bpm - 1)
  }, [bpm, onBpmChange, tempoEnabled])

  const handleBpmUp = useCallback(() => {
    if (!tempoEnabled) onBpmChange(bpm + 1)
  }, [bpm, onBpmChange, tempoEnabled])

  const openRhythm = useCallback((event) => {
    openerRef.current = event.currentTarget
    setRhythmOpen(true)
  }, [])

  const closeRhythm = useCallback(() => {
    setRhythmOpen(false)
    requestAnimationFrame(() => openerRef.current?.focus())
  }, [])

  useKeyboard({
    onToggle,
    onBpmUp: tempoEnabled ? undefined : handleBpmUp,
    onBpmDown: tempoEnabled ? undefined : handleBpmDown,
    onTap: tempoEnabled ? undefined : handleTap,
  })

  useEffect(() => {
    if (!rhythmOpen) return undefined

    const sheet = sheetRef.current
    const shell = screenRef.current?.closest('.app-phone-frame')
    const outsideElements = [
      shell?.querySelector('.app-brand-header'),
      shell?.querySelector(':scope > nav:last-child'),
    ].filter(Boolean)

    contentRef.current?.setAttribute('inert', '')
    outsideElements.forEach((element) => element.setAttribute('inert', ''))
    requestAnimationFrame(() => sheet?.querySelector('[data-sheet-autofocus]')?.focus())

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRhythm()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = [...(sheet?.querySelectorAll(FOCUSABLE) || [])]
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      contentRef.current?.removeAttribute('inert')
      outsideElements.forEach((element) => element.removeAttribute('inert'))
    }
  }, [closeRhythm, rhythmOpen])

  const summary = getPlaybackSummary(playbackStatus || {
    bpm,
    isPlaying,
    currentBar: 0,
    currentBeat,
    beatsPerBar,
    inGap,
    tempoEnabled,
    subdivTrainerEnabled,
    polyrhythmMode,
  })

  const tempoHeat = getTempoHeat(bpm)

  return (
    <section
      ref={screenRef}
      className={`pulse-metronome-screen ${isPlaying ? 'is-playing' : ''}`}
      data-tempo-heat={tempoHeat.id}
      style={{
        '--tempo-heat-color': tempoHeat.color,
        '--tempo-slider-gradient': tempoHeat.sliderGradient,
        '--tempo-slider-progress': `${tempoHeat.sliderProgress}%`,
      }}
    >
      <div ref={contentRef} className="pulse-screen-content">
        {summary.chips.length > 0 && (
          <div className="pulse-status-chips" aria-label="Active training status">
            {summary.chips.map((chip) => <span key={chip}>{chip}</span>)}
          </div>
        )}

        <div className="pulse-performance">
          <div
            className={`pulse-orbit ${polyrhythmMode ? 'is-polyrhythm' : ''}`}
            aria-label={polyrhythmMode
              ? `Tempo ${bpm} BPM, polyrhythm ${polyRhythm1} against ${polyRhythm2}`
              : isPlaying
                ? `Tempo ${bpm} BPM, beat ${Math.max(0, currentBeat) + 1} of ${beatsPerBar}`
                : `Tempo ${bpm} BPM, ready`}
          >
            {polyrhythmMode ? (
              <PolyrhythmOrbit
                rhythm1={polyRhythm1}
                rhythm2={polyRhythm2}
                activeBeat1={polyBeat1}
                activeBeat2={polyBeat2}
                isPlaying={isPlaying}
                accents1={polyAccents1}
                accents2={polyAccents2}
                onCycleAccent={onCyclePolyAccent}
              />
            ) : (
              <StandardRhythmOrbit
                beatCount={beatsPerBar}
                subdivision={subdivision}
                accents={subdivisionAccents}
                activeBeat={currentBeat}
                isPlaying={isPlaying}
                onCycleBeatAccent={onCycleBeatAccent}
              />
            )}
            <div
              className="pulse-orbit-value"
            >
              <BpmDisplay bpm={bpm} onBpmChange={onBpmChange} disabled={tempoEnabled} />
              {polyrhythmMode && <span className="pulse-poly-label">{polyRhythm1} against {polyRhythm2}</span>}
            </div>
          </div>

          <div className="pulse-transport-row">
            <button
              type="button"
              onClick={handleBpmDown}
              disabled={tempoEnabled}
              className="pulse-nudge"
              aria-label="Decrease tempo by 1 BPM"
              aria-keyshortcuts="ArrowDown"
              title={tempoEnabled ? 'Tempo is controlled by Tempo Trainer' : 'Decrease tempo (Down arrow)'}
            >
              −
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="pulse-transport"
              aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'}
              aria-pressed={isPlaying}
              aria-keyshortcuts="Space"
            >
              <TransportIcon isPlaying={isPlaying} />
              <span>{isPlaying ? 'Stop' : 'Start'}</span>
            </button>
            <button
              type="button"
              onClick={handleBpmUp}
              disabled={tempoEnabled}
              className="pulse-nudge"
              aria-label="Increase tempo by 1 BPM"
              aria-keyshortcuts="ArrowUp"
              title={tempoEnabled ? 'Tempo is controlled by Tempo Trainer' : 'Increase tempo (Up arrow)'}
            >
              +
            </button>
          </div>

          <BpmControls
            bpm={bpm}
            onBpmChange={onBpmChange}
            disabled={tempoEnabled}
            className="pulse-tempo-slider"
          />

          {polyrhythmMode ? (
            <PolyrhythmBeatPreview
              rhythm1={polyRhythm1}
              rhythm2={polyRhythm2}
              activeBeat1={polyBeat1}
              activeBeat2={polyBeat2}
              isPlaying={isPlaying}
            />
          ) : (
            <StandardBeatPreview
              beatsPerBar={beatsPerBar}
              currentBeat={currentBeat}
              isPlaying={isPlaying}
              inGap={inGap}
            />
          )}
        </div>

        <div className="pulse-quickbar">
          <div className="pulse-tap-control">
            <span>Tap tempo</span>
            <TapTempoButton
              ref={tapRef}
              onBpmChange={onBpmChange}
              disabled={tempoEnabled}
              className="pulse-tap-button"
            />
          </div>
          <RhythmReadout
            polyrhythmMode={polyrhythmMode}
            beatsPerBar={beatsPerBar}
            subdivision={subdivision}
            polyRhythm1={polyRhythm1}
            polyRhythm2={polyRhythm2}
            expanded={rhythmOpen}
            controlsId="pulse-rhythm-controls"
            onOpen={openRhythm}
          />
        </div>
      </div>

      {rhythmOpen && (
        <>
          <button
            type="button"
            className="pulse-sheet-backdrop"
            onClick={closeRhythm}
            aria-label="Close rhythm controls"
            tabIndex={-1}
          />
          <section
            ref={sheetRef}
            id="pulse-rhythm-controls"
            className="pulse-control-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pulse-rhythm-title"
          >
            <div className="pulse-sheet-handle" aria-hidden="true" />
            <header className="pulse-sheet-header">
              <div>
                <span>Shape the click</span>
                <h2 id="pulse-rhythm-title">Rhythm</h2>
              </div>
              <button type="button" onClick={closeRhythm} data-sheet-autofocus>Done</button>
            </header>

            <div className="pulse-sheet-scroll">
              <PolyrhythmToggle enabled={polyrhythmMode} onToggle={onPolyrhythmModeToggle} />

              {polyrhythmMode ? (
                <div className="pulse-sheet-section">
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
                  <div className="pulse-pattern-heading">
                    <div>
                      <strong>Pulse accents</strong>
                      <span>Tap any pulse to cycle Off, On, and Accent</span>
                    </div>
                  </div>
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
                </div>
              ) : (
                <div className="pulse-sheet-section">
                  <div className="pulse-rhythm-pickers">
                    <BeatsPicker beatsPerBar={beatsPerBar} onChange={onBeatsChange} />
                    <SubdivisionPicker
                      subdivision={subdivision}
                      onChange={onSubdivisionChange}
                      disabled={subdivTrainerEnabled}
                    />
                  </div>
                  {subdivTrainerEnabled && (
                    <p className="pulse-owned-note">Subdivision is controlled by Subdivision Trainer.</p>
                  )}
                  <div className="pulse-pattern-heading">
                    <div>
                      <strong>Accent pattern</strong>
                      <span>Tap any click to cycle Off, On, and Accent</span>
                    </div>
                  </div>
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
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
