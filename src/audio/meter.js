export const TEMPO_UNITS = {
  quarter: { quarters: 1, name: 'Quarter note', symbol: '♩' },
}
export function defaultMeterGroups(n, d) {
  if (d === 4 || n < 5) return Array(n).fill(1)
  if (n % 3 === 0) return Array(n / 3).fill(3)
  if (n % 2 === 0) return Array(n / 2).fill(2)
  return [...Array((n - 3) / 2).fill(2), 3]
}
export function normalizeMeter(value, legacyBeats = 4) {
  const candidate = Number(value?.numerator ?? legacyBeats)
  const numerator = Number.isInteger(candidate) && candidate >= 1 && candidate <= 16 ? candidate : 4
  const denominator = Number(value?.denominator) === 8 ? 8 : 4
  const supplied = value?.groups
  const groups = Array.isArray(supplied) && supplied.length && supplied.every(n => Number.isInteger(n) && n > 0) && supplied.reduce((a, b) => a + b, 0) === numerator
    ? [...supplied] : defaultMeterGroups(numerator, denominator)
  // Also migrate saved note-value preferences: BPM always means quarter notes.
  return { numerator, denominator, groups, tempoUnit: 'quarter', groupOnly: denominator === 8 && value?.groupOnly === true }
}
export const METER_PRESETS = [[4, 4], [3, 4], [2, 4], [5, 8], [6, 8], [7, 8], [9, 8], [12, 8]].map(([numerator, denominator]) => normalizeMeter({ numerator, denominator }))
export function meterGroups(meter) {
  let start = 0
  return meter.groups.map((length, index) => {
    const group = { index, start, length, end: start + length }
    start += length
    return group
  })
}
export function writtenNoteSeconds(meter, bpm) {
  return 60 / bpm * (4 / meter.denominator)
}
export function meterAccents(meter, subdivision, previous, previousSubdivision = subdivision) {
  const result = Array(meter.numerator * subdivision).fill('ON')
  for (const group of meterGroups(meter)) {
    const level = previous?.[group.start * previousSubdivision] || 'ACCENT'
    if (level === 'OFF') result.fill('OFF', group.start * subdivision, group.end * subdivision)
    else result[group.start * subdivision] = level
  }
  return result
}
