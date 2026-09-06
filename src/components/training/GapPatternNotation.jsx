import { GAP_GLYPHS } from '../../assets/notation/gapGlyphs'
import { getGapPattern } from '../../audio/gapPatterns'

// Positions represent one denominator note. Rests preserve the audible click's
// place within that unit; /8 meters add one flag to each /4 duration.
export default function GapPatternNotation({ pattern, denominator = 4 }) {
  const { id } = getGapPattern(pattern)
  const shorter = denominator === 8
  const rest = (x, duration) => <path key={x} data-rest={duration}
    d={GAP_GLYPHS[`rest${duration}`]} transform={`translate(${x} 30) scale(.032 -.032)`} fill="currentColor" />
  const note = (x, duration) => <g data-note={duration}>
    <path d={GAP_GLYPHS.notehead} transform={`translate(${x} 43) scale(.032 -.032)`} fill="currentColor" />
    <path d={`M${x + 9.2} 42 V13`} stroke="currentColor" strokeWidth="1.2" />
    <path d={GAP_GLYPHS[`flag${duration}`]} transform={`translate(${x + 8.6} 13) scale(.032 -.032)`} fill="currentColor" />
  </g>
  const eighth = shorter ? 16 : 8
  const sixteenth = shorter ? 32 : 16
  const triplet = id === 'triplet-second' || id === 'triplet-third'
  return <svg className="pulse-gap-pattern-notation" data-gap-pattern={id}
    width="94" height="54" viewBox="0 0 94 54" aria-hidden="true" focusable="false">
    {triplet ? <>
      <path d="M8 10 V5 H39 M54 5 H86 V10" fill="none" stroke="currentColor" strokeWidth="1" />
      <text x="47" y="10" textAnchor="middle" className="pulse-notation-tuplet">3</text>
      <g transform="translate(0 5)" data-tuplet="3:2">
        {rest(8, eighth)}
        {id === 'triplet-second' ? <>{note(34, eighth)}{rest(70, eighth)}</> : <>{rest(34, eighth)}{note(64, eighth)}</>}
      </g>
    </> : id === 'silence' ? <>
      <path d="M32 24 H62" stroke="currentColor" strokeWidth="1" />
      <path data-rest="bar" d={GAP_GLYPHS.restWhole} transform="translate(42.5 24) scale(.032 -.032)" fill="currentColor" />
    </> : id === 'offbeat' ? <>
      {rest(22, eighth)}{note(54, eighth)}
    </> : id === 'second' ? <>
      {rest(8, sixteenth)}{note(34, sixteenth)}{rest(70, eighth)}
    </> : <>
      {rest(8, eighth)}{rest(34, sixteenth)}{note(64, sixteenth)}
    </>}
  </svg>
}
