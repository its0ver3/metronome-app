// Groove pattern → ABC notation string for abcjs rendering.
//
// Uses a percussion clef and abcjs drum decorations. Voice layout:
//   HH (up-stem, x-heads) + SN (up-stem) on staff 1
//   KD (down-stem) on staff 2
// Toms are rendered on the top staff when present.
//
// Articulation mapping:
//   hi-hat:  '-'→rest, 'x'→x-head, 'X'→x-head with accent, 'o'→open-hat mark
//   snare:   '-'→rest, 'o'→note, 'O'→accent, 'g'→ghost (parenthesised)
//   kick:    '-'→rest, 'o'→note
//   toms:    '-'→rest, 'o'→note (different pitches per tom)

const STAFF_UP_VOICES = ['hh', 'snare', 'tom1', 'tom2', 'tom3']
const STAFF_DOWN_VOICES = ['kick']

// ABC pitch per voice (percussion clef conventions used by abcjs).
const VOICE_PITCH = {
  hh: '^g',      // above top line
  snare: 'c',    // middle line
  tom1: 'e',
  tom2: 'd',
  tom3: 'A',
  kick: 'F',     // below staff
}

function noteLength(timeDivision) {
  // ABC L: default note length. For N slots per measure in 4/4 we want L:1/N so
  // each single-character token represents one slot. Works for the standard set
  // (4, 8, 12, 16, 24, 32, 48); non-standard denominators would require tuplets.
  return `1/${timeDivision}`
}

function headStyleFor(voice) {
  if (voice === 'hh') return '!style=x!'
  return ''
}

function decorate(voice, symbol, pitch) {
  // Emit a single-slot token (decoration + pitch + duration-of-1).
  if (symbol === '-') return 'z'
  if (voice === 'hh') {
    const head = '!style=x!'
    if (symbol === 'o') return `!open!${head}${pitch}`
    if (symbol === 'X') return `!accent!${head}${pitch}`
    return `${head}${pitch}` // 'x' normal
  }
  if (voice === 'snare') {
    if (symbol === 'g') return `!(.!${pitch}!).!` // parenthesised ghost
    if (symbol === 'O') return `!accent!${pitch}`
    return pitch // normal
  }
  // kick / toms
  if (symbol === 'o') return pitch
  return pitch
}

function voiceLine(voice, pattern) {
  const arr = pattern.voices[voice] || []
  const pitch = VOICE_PITCH[voice]
  const slotsPerMeasure = pattern.timeDivision
  const beatsPerBar = pattern.timeSignature.numBeats
  const slotsPerBeat = slotsPerMeasure / beatsPerBar

  const tokens = []
  for (let slot = 0; slot < slotsPerMeasure; slot++) {
    const sym = arr[slot] || '-'
    tokens.push(decorate(voice, sym, pitch))
    // Insert beat-group spaces so abcjs beams within each beat, not across.
    if ((slot + 1) % slotsPerBeat === 0 && slot < slotsPerMeasure - 1) {
      tokens.push(' ')
    }
  }
  return tokens.join('')
}

export function grooveToAbc(pattern, { tempo = 80, title = 'Groove' } = {}) {
  const { numBeats, noteValue } = pattern.timeSignature
  const L = noteLength(pattern.timeDivision)

  // Detect tom presence so we don't clutter the staff when unused.
  const hasToms = ['tom1', 'tom2', 'tom3'].some((v) =>
    (pattern.voices[v] || []).some((s) => s && s !== '-'),
  )

  const upVoices = STAFF_UP_VOICES.filter(
    (v) => v === 'hh' || v === 'snare' || (hasToms && v.startsWith('tom')),
  )
  const downVoices = STAFF_DOWN_VOICES

  const header = [
    'X:1',
    `T:${title}`,
    `M:${numBeats}/${noteValue}`,
    `L:${L}`,
    `Q:1/4=${Math.round(tempo)}`,
    `K:C clef=perc`,
  ]

  // One voice definition per line; abcjs accepts stem direction hints.
  const voiceDefs = []
  for (const v of upVoices) voiceDefs.push(`V:${v} stem=up`)
  for (const v of downVoices) voiceDefs.push(`V:${v} stem=down`)

  const body = []
  for (const v of [...upVoices, ...downVoices]) {
    body.push(`V:${v}`)
    body.push(`${voiceLine(v, pattern)} |`)
  }

  return [...header, ...voiceDefs, ...body].join('\n')
}
