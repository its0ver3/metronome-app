function pluralize(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`
}

export function getRhythmReadoutLabel({
  polyrhythmMode,
  beatsPerBar,
  subdivision,
  polyRhythm1,
  polyRhythm2,
}) {
  if (polyrhythmMode) {
    return `Open rhythm controls: pulse A ${polyRhythm1}, pulse B ${polyRhythm2}`
  }

  return `Open rhythm controls: ${pluralize(beatsPerBar, 'beat')}, ${pluralize(subdivision, 'click')} per beat`
}
