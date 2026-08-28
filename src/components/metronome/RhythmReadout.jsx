import { getRhythmReadoutLabel } from './rhythmReadoutLabel'

// Phosphor Icons, MIT License — Copyright (c) 2023 Phosphor Icons.
function MetronomeIcon() {
  return (
    <svg className="pulse-rhythm-readout-icon" aria-hidden="true" viewBox="0 0 256 256">
      <path d="m187.14 114.84 26.78-29.46a8 8 0 0 0-11.84-10.76l-20.55 22.6-17.2-54.07A15.94 15.94 0 0 0 149.08 32h-42.17a15.94 15.94 0 0 0-15.25 11.15l-50.91 160A16 16 0 0 0 56 224h144a16 16 0 0 0 15.25-20.85ZM184.72 160h-38.64l28.62-31.48ZM106.91 48h42.17l20 62.9L124.46 160H71.27ZM56 208l10.18-32h123.63L200 208Z" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg className="pulse-rhythm-readout-icon" aria-hidden="true" viewBox="0 0 256 256">
      <path d="M212.92 17.69a8 8 0 0 0-6.86-1.45l-128 32A8 8 0 0 0 72 56v110.08A36 36 0 1 0 88 196v-85.75l112-28v51.83A36 36 0 1 0 216 164V24a8 8 0 0 0-3.08-6.31ZM52 216a20 20 0 1 1 20-20 20 20 0 0 1-20 20Zm36-122.25v-31.5l112-28v31.5ZM180 184a20 20 0 1 1 20-20 20 20 0 0 1-20 20Z" />
    </svg>
  )
}

export default function RhythmReadout({
  polyrhythmMode,
  beatsPerBar,
  subdivision,
  polyRhythm1,
  polyRhythm2,
  expanded,
  controlsId,
  onOpen,
}) {
  const accessibleLabel = getRhythmReadoutLabel({
    polyrhythmMode,
    beatsPerBar,
    subdivision,
    polyRhythm1,
    polyRhythm2,
  })

  return (
    <button
      type="button"
      className="pulse-rhythm-readout"
      onClick={onOpen}
      aria-label={accessibleLabel}
      aria-expanded={expanded}
      aria-controls={controlsId}
    >
      {polyrhythmMode ? (
        <span className="pulse-rhythm-readout-pair is-polyrhythm" aria-hidden="true">
          <span className="pulse-rhythm-readout-item is-rhythm-one">
            <strong><small>A</small>{polyRhythm1}</strong>
          </span>
          <span className="pulse-rhythm-readout-divider" />
          <span className="pulse-rhythm-readout-item is-rhythm-two">
            <strong><small>B</small>{polyRhythm2}</strong>
          </span>
        </span>
      ) : (
        <span className="pulse-rhythm-readout-pair" aria-hidden="true">
          <span className="pulse-rhythm-readout-item">
            <strong>{beatsPerBar}</strong>
            <MetronomeIcon />
          </span>
          <span className="pulse-rhythm-readout-divider" />
          <span className="pulse-rhythm-readout-item">
            <strong>{subdivision}</strong>
            <NotesIcon />
          </span>
        </span>
      )}
      <span className="pulse-rhythm-readout-chevron" aria-hidden="true">⌃</span>
    </button>
  )
}
