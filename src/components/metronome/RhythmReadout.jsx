import { getRhythmReadoutLabel } from './rhythmReadoutLabel'
import SubdivisionNotation from './SubdivisionNotation.jsx'
import TimeSignature from './TimeSignature.jsx'

export default function RhythmReadout({
  polyrhythmMode,
  beatsPerBar,
  subdivision,
  meter,
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
    meter,
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
            <TimeSignature numerator={meter?.numerator ?? beatsPerBar} denominator={meter?.denominator ?? 4} />
          </span>
          <span className="pulse-rhythm-readout-divider" />
          <span className="pulse-rhythm-readout-item is-subdivision">
            <SubdivisionNotation count={subdivision} denominator={meter?.denominator ?? 4} />
          </span>
        </span>
      )}
    </button>
  )
}
