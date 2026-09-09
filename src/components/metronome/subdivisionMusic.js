import { writtenNoteName } from '../../audio/meter.js'

export function getSubdivisionNotation(count, denominator = 4) {
  if (!Number.isInteger(count) || count < 1 || count > 13) throw new RangeError('Subdivision must be 1–13')
  const base = 2 ** Math.floor(Math.log2(count))
  const duration = base * denominator
  const names = { 2: 'Half', 4: 'Quarter', 8: 'Eighth', 16: 'Sixteenth', 32: 'Thirty-second', 64: 'Sixty-fourth', 128: 'One-hundred-twenty-eighth' }
  const name = count === base ? `${names[duration]} notes` : count === 3 ? `${names[duration]}-note triplets` : count === 6 ? `${names[duration]}-note sextuplets` : `${count}-tuplets`
  return { beams: Math.max(0, Math.log2(duration) - 2), hollow: duration === 2, tuplet: count === base ? null : count, name, width: Math.max(44, 26 + (count - 1) * 14) }
}

export function getSubdivisionLabel(count, denominator = 4) {
  if (count === 0) return 'Group pulses only'
  return `${getSubdivisionNotation(count, denominator).name}, ${count} ${count === 1 ? 'click' : 'clicks'} per ${denominator === 4 ? 'beat' : writtenNoteName(denominator)}`
}
