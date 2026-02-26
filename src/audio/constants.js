export const LOOKAHEAD_MS = 25
export const SCHEDULE_AHEAD_S = 0.05
export const MIN_BPM = 20
export const MAX_BPM = 240
export const DEFAULT_BPM = 120
export const DEFAULT_BEATS_PER_BAR = 4
export const DEFAULT_BEAT_UNIT = 4

export const ACCENT_LEVELS = {
  STRONG: { name: 'Strong', volume: 1.0 },
  MEDIUM: { name: 'Medium', volume: 0.7 },
  NORMAL: { name: 'Normal', volume: 0.5 },
  GHOST: { name: 'Ghost', volume: 0.2 },
  SILENT: { name: 'Silent', volume: 0.0 },
}

export const ACCENT_ORDER = ['STRONG', 'MEDIUM', 'NORMAL', 'GHOST', 'SILENT']

export const SUBDIVISION_TYPES = {
  QUARTER: 1,
  EIGHTH: 2,
  TRIPLET: 3,
  SIXTEENTH: 4,
  QUINTUPLET: 5,
}

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
  STRONG: 'w-5 h-5 bg-primary',
  MEDIUM: 'w-4 h-4 bg-primary/70',
  NORMAL: 'w-3.5 h-3.5 bg-dark/40',
  GHOST: 'w-3 h-3 bg-dark/20',
  SILENT: 'w-3 h-3 bg-transparent border-2 border-dark/20',
}

export const SUBDIVISION_OPTIONS = [
  { type: SUBDIVISION_TYPES.QUARTER, label: '♩', desc: 'Quarter' },
  { type: SUBDIVISION_TYPES.EIGHTH, label: '♪♪', desc: '8th' },
  { type: SUBDIVISION_TYPES.TRIPLET, label: '♪♪♪', desc: 'Triplet' },
  { type: SUBDIVISION_TYPES.SIXTEENTH, label: '♬♬', desc: '16th' },
  { type: SUBDIVISION_TYPES.QUINTUPLET, label: '5', desc: 'Quintuplet' },
]

export const BASIC_TIME_SIG_PRESETS = [
  { beats: 3, unit: 4, label: '3/4' },
  { beats: 4, unit: 4, label: '4/4' },
  { beats: 5, unit: 4, label: '5/4' },
  { beats: 7, unit: 4, label: '7/4' },
]

export const ALL_TIME_SIG_PRESETS = [
  { beats: 2, unit: 4, label: '2/4' },
  { beats: 3, unit: 4, label: '3/4' },
  { beats: 4, unit: 4, label: '4/4' },
  { beats: 5, unit: 4, label: '5/4' },
  { beats: 6, unit: 4, label: '6/4' },
  { beats: 7, unit: 4, label: '7/4' },
  { beats: 6, unit: 8, label: '6/8' },
  { beats: 7, unit: 8, label: '7/8' },
  { beats: 9, unit: 8, label: '9/8' },
  { beats: 12, unit: 8, label: '12/8' },
]

export function cycleAccentLevel(current) {
  const idx = ACCENT_ORDER.indexOf(current)
  return ACCENT_ORDER[(idx + 1) % ACCENT_ORDER.length]
}

export function buildDefaultAccents(beatsPerBar) {
  const accents = new Array(beatsPerBar).fill('NORMAL')
  accents[0] = 'STRONG'
  return accents
}
