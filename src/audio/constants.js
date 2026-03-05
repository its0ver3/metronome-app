export const LOOKAHEAD_MS = 25
export const SCHEDULE_AHEAD_S = 0.05
export const MIN_BPM = 20
export const MAX_BPM = 240
export const EXTENDED_MAX_BPM = 600
export const DEFAULT_BPM = 120
export const DEFAULT_BEATS_PER_BAR = 4

export const ACCENT_LEVELS = {
  ACCENT: { name: 'Accent', volume: 1.0 },
  ON: { name: 'On', volume: 0.5 },
  OFF: { name: 'Off', volume: 0.0 },
}

export const ACCENT_ORDER = ['ACCENT', 'ON', 'OFF']

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

export const ACCENT_STYLES = {
  ACCENT: 'w-5 h-5 bg-primary',
  ON: 'w-3.5 h-3.5 bg-dark/40',
  OFF: 'w-3 h-3 bg-transparent border-2 border-dark/20',
}

export function cycleAccentLevel(current) {
  const idx = ACCENT_ORDER.indexOf(current)
  return ACCENT_ORDER[(idx + 1) % ACCENT_ORDER.length]
}

export function buildDefaultAccents(beatsPerBar) {
  const accents = new Array(beatsPerBar).fill('ON')
  accents[0] = 'ACCENT'
  return accents
}

export function buildDefaultSubdivisionAccents(beatsPerBar, subdivision) {
  const total = beatsPerBar * subdivision
  const accents = new Array(total).fill('ON')
  for (let beat = 0; beat < beatsPerBar; beat++) {
    accents[beat * subdivision] = 'ACCENT'
  }
  return accents
}
