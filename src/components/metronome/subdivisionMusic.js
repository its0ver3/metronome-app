export function getSubdivisionNotation(count, denominator = 4) {
  if (!Number.isInteger(count) || count < 1 || count > 13) throw new RangeError('Subdivision must be 1–13')
  const base = 2 ** Math.floor(Math.log2(count))
  const names = denominator === 8
    ? { 1: 'Eighth notes', 2: 'Sixteenth notes', 3: 'Sixteenth-note triplets', 4: 'Thirty-second notes', 6: 'Thirty-second-note sextuplets', 8: 'Sixty-fourth notes' }
    : { 1: 'Quarter notes', 2: 'Eighth notes', 3: 'Eighth-note triplets', 4: 'Sixteenth notes', 6: 'Sixteenth-note sextuplets', 8: 'Thirty-second notes' }
  return { beams: Math.log2(base) + (denominator === 8 ? 1 : 0), tuplet: count === base ? null : count, name: names[count] || `${count}-tuplets`, width: Math.max(44, 26 + (count - 1) * 14) }
}

export function getSubdivisionLabel(count, denominator = 4) {
  if (count === 0) return 'Group pulses only'
  return `${getSubdivisionNotation(count, denominator).name}, ${count} ${count === 1 ? 'click' : 'clicks'} per ${denominator === 8 ? 'eighth note' : 'beat'}`
}
