import React from 'react'

export const choices = Array.from({ length: 13 }, (_, index) => index + 1)

export function notationFor(count) {
  if (!choices.includes(count)) throw new RangeError('Subdivision must be 1–13')
  const base = 2 ** Math.floor(Math.log2(count))
  const names = { 1: 'Quarter notes', 2: 'Eighth notes', 3: 'Eighth-note triplets', 4: 'Sixteenth notes', 6: 'Sixteenth-note sextuplets', 8: 'Thirty-second notes' }
  return {
    beams: Math.log2(base),
    tuplet: count === base ? null : count,
    name: names[count] || `${count}-tuplets`,
    width: Math.max(44, 26 + (count - 1) * 14),
  }
}

// Bravura's SMuFL black notehead, joined by simple engraving stems/beams.
// One group always occupies one quarter-note beat; tuplets are N:base.
export function Notes({ count, active = -1 }) {
  const { beams, tuplet, width } = notationFor(count)
  const start = count === 1 ? 15 : 8
  const firstStem = start + 9.2
  const lastStem = firstStem + (count - 1) * 14
  return <svg className="lab-notes" width={width} height="54" viewBox={`0 0 ${width} 54`} aria-hidden="true" focusable="false">
    {tuplet && <text className="lab-tuplet" x={(firstStem + lastStem) / 2} y="13" textAnchor="middle">{tuplet}</text>}
    {Array.from({ length: count }, (_, i) => <g key={i} className={i === active ? 'note-lit' : ''}>
      <text className="music-head" x={start + i * 14} y="44">{'\uE0A4'}</text>
      <path d={`M${firstStem + i * 14} 43 V20`} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </g>)}
    {Array.from({ length: beams }, (_, i) => <path key={i} d={`M${firstStem - .6} ${20 + i * 5} H${lastStem + .6}`} stroke="currentColor" strokeWidth="3" />)}
  </svg>
}
