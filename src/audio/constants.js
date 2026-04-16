export const LOOKAHEAD_MS = 25
export const SCHEDULE_AHEAD_S = 0.05
export const MIN_BPM = 20
export const MAX_BPM = 240
export const EXTENDED_MAX_BPM = 600
export const DEFAULT_BPM = 120
export const DEFAULT_BEATS_PER_BAR = 4

export const ACCENT_LEVELS = {
  LOUD: { name: 'Loud', volume: 1.0 },
  ACCENT: { name: 'Accent', volume: 0.5 },
  ON: { name: 'On', volume: 0.25 },
  OFF: { name: 'Off', volume: 0.0 },
}

export const ACCENT_ORDER = ['OFF', 'ON', 'ACCENT', 'LOUD']

export const ACCENT_WEDGES = { OFF: 0, ON: 1, ACCENT: 2, LOUD: 3 }

export const SUBDIVISION_OPTIONS = [
  { type: 1, label: '1', desc: '1' },
  { type: 2, label: '2', desc: '2' },
  { type: 3, label: '3', desc: '3' },
  { type: 4, label: '4', desc: '4' },
  { type: 5, label: '5', desc: '5' },
  { type: 6, label: '6', desc: '6' },
  { type: 7, label: '7', desc: '7' },
  { type: 8, label: '8', desc: '8' },
  { type: 9, label: '9', desc: '9' },
  { type: 10, label: '10', desc: '10' },
  { type: 11, label: '11', desc: '11' },
  { type: 12, label: '12', desc: '12' },
  { type: 13, label: '13', desc: '13' },
]

export const SOUND_NAMES = [
  'Classic Click',
  'Woodblock',
  'Rimshot',
  'Cowbell',
  'Hi-Hat',
  'Electronic Beep',
  'Soft Tone',
  'Stick Click',
]

export const POLYRHYTHM_MAX = 16

// Groove-mode constants
export const GROOVE_TIME_DIVISIONS = [8, 12, 16, 24]
export const GROOVE_COUNT_IN_OPTIONS = [0, 1, 2]
export const GROOVE_MAX_SWING_PERCENT = 50

export function cycleAccentLevel(current) {
  const idx = ACCENT_ORDER.indexOf(current)
  return ACCENT_ORDER[(idx + 1) % ACCENT_ORDER.length]
}

export function buildDefaultAccents(beatsPerBar) {
  const accents = new Array(beatsPerBar).fill('ON')
  accents[0] = 'LOUD'
  return accents
}

export function buildDefaultSubdivisionAccents(beatsPerBar, subdivision) {
  const total = beatsPerBar * subdivision
  const accents = new Array(total).fill('ON')
  for (let beat = 0; beat < beatsPerBar; beat++) {
    accents[beat * subdivision] = 'LOUD'
  }
  return accents
}

export function buildDefaultPolyAccents(count) {
  const accents = new Array(count).fill('ON')
  accents[0] = 'LOUD'
  return accents
}
