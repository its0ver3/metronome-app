import { getSubdivisionNotation } from './subdivisionMusic.js'
import './subdivisionNotation.css'

// Bravura uniE0A4 outline, copyright Steinberg, SIL OFL: src/assets/notation/OFL.txt.
// A single outline avoids downloading a music font for this small notation set.
const NOTEHEAD = 'M97 -125C186 -125 295 -43 295 42C295 93 255 125 198 125C88 125 0 44 0 -42C0 -94 43 -125 97 -125Z'

export default function SubdivisionNotation({ count, denominator = 4 }) {
  if (count === 0) return <span aria-hidden="true" className="pulse-group-pulse-symbol">●</span>
  const { beams, tuplet, width } = getSubdivisionNotation(count, denominator)
  const start = count === 1 ? 15 : 8
  const firstStem = start + 9.2
  const lastStem = firstStem + (count - 1) * 14
  return <svg className="pulse-subdivision-notation" data-subdivision={count} width={width} height="54" viewBox={`0 0 ${width} 54`} aria-hidden="true" focusable="false">
    {tuplet && <text className="pulse-notation-tuplet" x={(firstStem + lastStem) / 2} y="13" textAnchor="middle">{tuplet}</text>}
    {Array.from({ length: count }, (_, index) => <g key={index}>
      <path d={NOTEHEAD} transform={`translate(${start + index * 14} 44) scale(.032 -.032)`} fill="currentColor" />
      <path d={`M${firstStem + index * 14} 43 V20`} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </g>)}
    {count === 1 && beams > 0 ? <path d={`M${firstStem} 20 c1 5 10 7 5 16 c2 -8 -4 -7 -5 -10Z`} fill="currentColor" /> : Array.from({ length: beams }, (_, index) => <path key={index} d={`M${firstStem - .6} ${20 + index * 5} H${lastStem + .6}`} stroke="currentColor" strokeWidth="3" />)}
  </svg>
}
