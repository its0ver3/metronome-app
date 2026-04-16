// Lightweight drum-staff SVG builder.
// Takes a groove pattern and produces an <svg> element as a string.
// Not intended as full music engraving — just a readable glance-at notation
// that updates as the user edits the grid.
//
// Staff layout (y-axis grows downward):
//   y=0    ─── top line (hi-hat x-heads placed 12px above)
//   y=12   ─── 2nd line
//   y=24   ─── middle line (snare sits here)
//   y=36   ─── 4th line
//   y=48   ─── bottom line
//   y=60   ─── kick sits one ledger below bottom line

const STAFF_LINES = 5
const LINE_GAP = 12
const STAFF_HEIGHT = (STAFF_LINES - 1) * LINE_GAP
const LEFT_PAD = 32
const RIGHT_PAD = 16
const TOP_PAD = 20
const BOTTOM_PAD = 40

const HH_Y = -LINE_GAP          // space above top line
const SNARE_Y = (STAFF_LINES - 1) * LINE_GAP / 2 // middle line
const KICK_Y = STAFF_HEIGHT + LINE_GAP // ledger below staff
const TOM1_Y = LINE_GAP * 0.5
const TOM2_Y = LINE_GAP * 1.5
const TOM3_Y = LINE_GAP * 3.5

function voiceY(voice) {
  switch (voice) {
    case 'hh':
      return HH_Y
    case 'snare':
      return SNARE_Y
    case 'kick':
      return KICK_Y
    case 'tom1':
      return TOM1_Y
    case 'tom2':
      return TOM2_Y
    case 'tom3':
      return TOM3_Y
    default:
      return SNARE_Y
  }
}

function noteheadSvg(voice, symbol, x, y) {
  const accent = symbol === 'X' || symbol === 'O' ? '<text x="' + (x - 5) + '" y="' + (y - LINE_GAP - 2) + '" font-size="14" fill="currentColor">&gt;</text>' : ''
  if (voice === 'hh') {
    // X-head
    return (
      accent +
      `<line x1="${x - 4}" y1="${y - 4}" x2="${x + 4}" y2="${y + 4}" stroke="currentColor" stroke-width="1.8"/>` +
      `<line x1="${x - 4}" y1="${y + 4}" x2="${x + 4}" y2="${y - 4}" stroke="currentColor" stroke-width="1.8"/>` +
      (symbol === 'o'
        ? `<circle cx="${x}" cy="${y - 9}" r="2.5" fill="none" stroke="currentColor" stroke-width="1.3"/>`
        : '')
    )
  }
  if (symbol === 'g' && voice === 'snare') {
    // Ghost: parenthesised notehead
    return (
      `<text x="${x - 8}" y="${y + 4}" font-size="11" fill="currentColor">(</text>` +
      `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="2.4" fill="currentColor"/>` +
      `<text x="${x + 4}" y="${y + 4}" font-size="11" fill="currentColor">)</text>`
    )
  }
  // Filled oval notehead
  return (
    accent +
    `<ellipse cx="${x}" cy="${y}" rx="4" ry="3" fill="currentColor" transform="rotate(-20 ${x} ${y})"/>`
  )
}

function ledgerLines(voice, x, color) {
  if (voice !== 'kick') return ''
  // One ledger line below the staff for kick
  return `<line x1="${x - 7}" y1="${STAFF_HEIGHT + LINE_GAP}" x2="${x + 7}" y2="${STAFF_HEIGHT + LINE_GAP}" stroke="${color}" stroke-width="1"/>`
}

export function renderGrooveSvg(pattern, { width = 640, color = '#F5F0E8' } = {}) {
  const slotsPerMeasure = pattern.timeDivision
  const beatsPerBar = pattern.timeSignature.numBeats
  const slotsPerBeat = slotsPerMeasure / beatsPerBar
  const innerWidth = width - LEFT_PAD - RIGHT_PAD
  const slotW = innerWidth / slotsPerMeasure
  const height = STAFF_HEIGHT + TOP_PAD + BOTTOM_PAD

  const parts = []

  // Staff lines
  for (let i = 0; i < STAFF_LINES; i++) {
    const y = TOP_PAD + i * LINE_GAP
    parts.push(`<line x1="${LEFT_PAD}" y1="${y}" x2="${width - RIGHT_PAD}" y2="${y}" stroke="${color}" stroke-width="1" opacity="0.8"/>`)
  }
  // Barlines at the start and end
  parts.push(`<line x1="${LEFT_PAD}" y1="${TOP_PAD}" x2="${LEFT_PAD}" y2="${TOP_PAD + STAFF_HEIGHT}" stroke="${color}" stroke-width="1.5"/>`)
  parts.push(`<line x1="${width - RIGHT_PAD}" y1="${TOP_PAD}" x2="${width - RIGHT_PAD}" y2="${TOP_PAD + STAFF_HEIGHT}" stroke="${color}" stroke-width="1.5"/>`)

  // Percussion clef label
  parts.push(`<text x="${LEFT_PAD - 22}" y="${TOP_PAD + STAFF_HEIGHT / 2 + 5}" font-family="monospace" font-size="14" fill="${color}">‖</text>`)

  // Time signature
  parts.push(`<text x="${LEFT_PAD + 4}" y="${TOP_PAD + STAFF_HEIGHT / 2 - 1}" font-size="13" font-weight="bold" fill="${color}">${beatsPerBar}</text>`)
  parts.push(`<text x="${LEFT_PAD + 4}" y="${TOP_PAD + STAFF_HEIGHT / 2 + 11}" font-size="13" font-weight="bold" fill="${color}">${pattern.timeSignature.noteValue}</text>`)

  // Beat tick marks below the staff
  for (let b = 0; b <= beatsPerBar; b++) {
    const x = LEFT_PAD + 16 + b * slotsPerBeat * slotW
    parts.push(`<line x1="${x}" y1="${TOP_PAD + STAFF_HEIGHT + 4}" x2="${x}" y2="${TOP_PAD + STAFF_HEIGHT + 10}" stroke="${color}" stroke-width="1" opacity="0.5"/>`)
    if (b < beatsPerBar) {
      parts.push(`<text x="${x + 2}" y="${TOP_PAD + STAFF_HEIGHT + 22}" font-size="10" fill="${color}" opacity="0.7">${b + 1}</text>`)
    }
  }

  // Notes per slot
  const voiceOrder = ['hh', 'snare', 'kick', 'tom1', 'tom2', 'tom3']
  for (let slot = 0; slot < slotsPerMeasure; slot++) {
    const x = LEFT_PAD + 16 + slot * slotW + slotW / 2
    for (const voice of voiceOrder) {
      const arr = pattern.voices[voice]
      if (!arr) continue
      const sym = arr[slot]
      if (!sym || sym === '-') continue
      const y = TOP_PAD + voiceY(voice)
      parts.push(ledgerLines(voice, x, color))
      parts.push(noteheadSvg(voice, sym, x, y))
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;color:${color};">${parts.join('')}</svg>`
}
