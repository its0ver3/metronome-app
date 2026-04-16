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
    <div className="overflow-x-auto -mx-3 px-3">
      <div className="min-w-min">
        {/* Beat numbers header */}
        <div className="flex items-end">
          <div className="w-14 shrink-0" />
          <div className="flex">
            {Array.from({ length: slotsPerMeasure }).map((_, i) => {
              const isBeatStart = i % slotsPerBeat === 0
              return (
                <div
                  key={i}
                  className={`w-8 text-center text-[0.6rem] font-semibold ${
                    isBeatStart ? 'text-dark/70' : 'text-dark/20'
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
            <div className="w-14 shrink-0 pr-2 text-right text-xs font-semibold text-dark/80 sticky left-0 bg-light">
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
  )
}
