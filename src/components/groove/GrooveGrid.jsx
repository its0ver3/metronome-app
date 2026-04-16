import GrooveCell from './GrooveCell'
import { VOICE_LABELS } from '../../groove/grooveConstants'

export default function GrooveGrid({
  pattern,
  activeSlot,
  inCountIn,
  showToms,
  onCellTap,
  onCellSet,
}) {
  const slotsPerMeasure = pattern.timeDivision
  const beatsPerBar = pattern.timeSignature.numBeats
  const slotsPerBeat = slotsPerMeasure / beatsPerBar

  const visibleVoices = showToms
    ? ['hh', 'snare', 'kick', 'tom1', 'tom2', 'tom3']
    : ['hh', 'snare', 'kick']

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs text-dark/60 font-semibold uppercase tracking-wide">
          Pattern editor
        </div>
        <div className="text-[0.65rem] text-dark/40">
          Tap to cycle · Long-press for options
        </div>
      </div>
      <div className="overflow-x-auto -mx-3 px-3">
        <div className="min-w-min rounded-md overflow-hidden border border-muted">
          {/* Beat numbers header */}
          <div className="flex items-end bg-muted/10">
            <div className="w-14 shrink-0" />
            <div className="flex">
              {Array.from({ length: slotsPerMeasure }).map((_, i) => {
                const isBeatStart = i % slotsPerBeat === 0
                return (
                  <div
                    key={i}
                    className={`w-10 text-center py-1 text-[0.65rem] font-semibold ${
                      isBeatStart ? 'text-primary' : 'text-dark/25'
                    }`}
                  >
                    {isBeatStart ? i / slotsPerBeat + 1 : ''}
                  </div>
                )
              })}
            </div>
          </div>

          {visibleVoices.map((voice) => (
            <div key={voice} className="flex items-center">
              <div className="w-14 shrink-0 pr-2 text-right text-xs font-semibold text-dark/80 sticky left-0 bg-light border-r border-muted py-2">
                {VOICE_LABELS[voice]}
              </div>
              <div className="flex">
                {pattern.voices[voice].map((sym, slot) => (
                  <GrooveCell
                    key={slot}
                    voice={voice}
                    slot={slot}
                    symbol={sym}
                    beatGroupStart={slot % slotsPerBeat === 0}
                    oddBeat={Math.floor(slot / slotsPerBeat) % 2 === 1}
                    active={!inCountIn && activeSlot === slot}
                    onTap={onCellTap}
                    onSet={onCellSet}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Legend />
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-2 text-[0.65rem] text-dark/50 flex flex-wrap gap-x-3 gap-y-1">
      <span>
        <span className="inline-block w-2 h-2 rounded-full bg-primary align-middle mr-1" />
        normal
      </span>
      <span>
        <span className="inline-block w-3 h-3 rounded-full bg-primary ring-2 ring-primary align-middle mr-1" />
        accent
      </span>
      <span>(●) ghost (snare)</span>
      <span>◯ open (hi-hat)</span>
    </div>
  )
}
