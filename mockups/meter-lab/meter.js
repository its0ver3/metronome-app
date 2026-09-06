export const PRESETS = [
  { n: 4, d: 4, groups: [1, 1, 1, 1] },
  { n: 3, d: 4, groups: [1, 1, 1] },
  { n: 2, d: 4, groups: [1, 1] },
  { n: 6, d: 8, groups: [3, 3] },
  { n: 9, d: 8, groups: [3, 3, 3] },
  { n: 12, d: 8, groups: [3, 3, 3, 3] },
  { n: 5, d: 8, groups: [2, 3] },
  { n: 7, d: 8, groups: [2, 2, 3] },
]
export const UNITS = {
  quarter: { quarters: 1, name: 'Quarter note', symbol: '♩' },
  dotted: { quarters: 1.5, name: 'Dotted quarter', symbol: '♩.' },
  eighth: { quarters: .5, name: 'Eighth note', symbol: '♪' },
}
export function defaultGroups(n, d) {
  if (d === 4 || n < 5) return Array(n).fill(1)
  if (n % 3 === 0) return Array(n / 3).fill(3)
  if (n % 2 === 0) return Array(n / 2).fill(2)
  return [...Array((n - 3) / 2).fill(2), 3]
}
export function defaultUnit(d, groups) {
  return d === 4 ? 'quarter' : groups.every(value => value === 3) ? 'dotted' : 'eighth'
}
export function validateMeter({ n, d, groups }) {
  if (!Number.isInteger(n) || n < 1 || n > 16 || ![4, 8].includes(d)) throw new RangeError('Choose 1–16 over 4 or 8.')
  if (!groups.length || groups.some(v => !Number.isInteger(v) || v < 1) || groups.reduce((a, b) => a + b, 0) !== n) throw new RangeError(`Groups must add up to ${n}.`)
}
export function makeSettings(meter = PRESETS[0]) {
  validateMeter(meter)
  return { ...meter, groups: [...meter.groups], bpm: 100, unit: defaultUnit(meter.d, meter.groups), division: 1,
    accents: meter.groups.map((_, i) => i === 0 ? 'ACCENT' : 'ON'),
    gap: false, audibleBars: 2, silentBars: 1,
    tempo: false, increment: 5, everyBars: 4,
    subdiv: false, stageBars: 2 }
}
export function groupSpans({ n, groups }) {
  let start = 0
  return groups.map((size, index) => {
    const span = { index, size, start, end: start + size, angleStart: -90 + start / n * 360, angleEnd: -90 + (start + size) / n * 360 }
    start += size
    return span
  })
}
// All durations are derived from written note values, never from group count.
export function buildBar(settings, barIndex = 0) {
  validateMeter(settings)
  const { n, d, unit, groups } = settings
  if (!UNITS[unit]) throw new RangeError('Unknown tempo unit')
  if (![0, 1, 2, 3, 4].includes(settings.division)) throw new RangeError('Unknown click division')
  const bpm = Math.max(20, Math.min(300, settings.bpm + (settings.tempo ? Math.floor(barIndex / settings.everyBars) * settings.increment : 0)))
  const secondsPerWrittenNote = 60 / bpm * (4 / d) / UNITS[unit].quarters
  const duration = n * secondsPerWrittenNote
  const silent = settings.gap && barIndex % (settings.audibleBars + settings.silentBars) >= settings.audibleBars
  const stage = settings.subdiv ? Math.floor(barIndex / settings.stageBars) % 2 : 0
  const division = stage ? settings.division === 0 ? 1 : settings.division * 2 : settings.division
  const events = []
  let start = 0
  groups.forEach((size, group) => {
    const ticks = division === 0 ? 1 : size * division
    for (let tick = 0; tick < ticks; tick++) {
      const offset = division === 0 ? 0 : tick / division
      const accent = settings.accents[group] || 'ON'
      const strong = tick === 0
      events.push({ offset: (start + offset) * secondsPerWrittenNote, group, tick, strong,
        duration: division === 0 ? size * secondsPerWrittenNote : secondsPerWrittenNote / division,
        audible: !silent && accent !== 'OFF',
        // Accenting the group never turns every subdivision into an accent.
        level: strong ? accent === 'ACCENT' ? .65 : .4 : .17,
        frequency: strong ? group === 0 && accent === 'ACCENT' ? 1500 : accent === 'ACCENT' ? 1200 : 950 : 650 })
    }
    start += size
  })
  return { events, duration, bpm, division, silent, stage, barIndex }
}
