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
  { type: 1, label: '♩', desc: 'Quarter' },
  { type: 2, label: '8ths', desc: '8ths' },
  { type: 3, label: '3s', desc: 'Triplets' },
  { type: 4, label: '16ths', desc: '16ths' },
  { type: 5, label: '5s', desc: '5s' },
  { type: 6, label: '6s', desc: '6s' },
  { type: 7, label: '7s', desc: '7s' },
  { type: 8, label: '8s', desc: '8s' },
  { type: 9, label: '9s', desc: '9s' },
  { type: 10, label: '10s', desc: '10s' },
  { type: 11, label: '11s', desc: '11s' },
  { type: 12, label: '12s', desc: '12s' },
  { type: 13, label: '13s', desc: '13s' },
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
    const idx = beat * subdivision
    accents[idx] = beat === 0 ? 'ACCENT' : 'ON'
  }
  return accents
}
