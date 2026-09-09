import { writtenNoteName } from '../../audio/meter.js'
function pluralize(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`
}

export function getRhythmReadoutLabel({
  polyrhythmMode,
  beatsPerBar,
  subdivision,
  meter,
  polyRhythm1,
  polyRhythm2,
}) {
  if (polyrhythmMode) {
    return `Open rhythm controls: pulse A ${polyRhythm1}, pulse B ${polyRhythm2}`
  }

  if (meter) return `Open rhythm controls: ${meter.numerator}/${meter.denominator}, grouped ${meter.groups.join(' + ')}, ${subdivision === 0 ? 'group pulses only' : `${pluralize(subdivision, 'click')} per ${writtenNoteName(meter.denominator)}`}`

  return `Open rhythm controls: ${pluralize(beatsPerBar, 'beat')}, ${pluralize(subdivision, 'click')} per beat`
}
